-- Pembayaran transfer manual: pelanggan mengunggah bukti transfer, admin yang
-- memutuskan aktif / tidak aktif. Tidak ada Midtrans dan tidak ada aktivasi otomatis.

-- Rekening tujuan diisi admin lewat Pengaturan -> Rekening Transfer.
alter table public.site_settings
  add column if not exists bank_name text not null default '',
  add column if not exists bank_account_number text not null default '',
  add column if not exists bank_account_holder text not null default '';

alter table public.orders
  add column if not exists proof_path text,
  add column if not exists proof_uploaded_at timestamptz;

create index if not exists orders_proof_uploaded_at_idx
  on public.orders (proof_uploaded_at) where proof_uploaded_at is not null;

-- Bukti transfer bersifat privat: hanya admin yang boleh melihatnya.
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update set public = false;

drop policy if exists "payment_proofs_customer_upload" on storage.objects;
create policy "payment_proofs_customer_upload"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'payment-proofs'
  and name ~ '^orders/[A-Za-z0-9_-]+/[A-Za-z0-9._-]+$'
);

drop policy if exists "payment_proofs_admin_read" on storage.objects;
create policy "payment_proofs_admin_read"
on storage.objects for select to authenticated
using (bucket_id = 'payment-proofs' and public.is_admin());

-- Status pesanan milik pelanggan, kini ikut menampilkan jumlah yang harus ditransfer.
drop function if exists public.checkout_status(text, text);
create function public.checkout_status(p_order_id text, p_checkout_token text)
returns table (
  payment_status text,
  invitation_route text,
  activated boolean,
  total bigint,
  customer_name text,
  proof_path text
)
language sql
security definer
set search_path = public
as $$
  select o.payment_status, p.route, o.activated_at is not null,
         o.total, o.customer_name, o.proof_path
  from public.orders o
  left join public.pages p on p.id = o.invitation_id
  where o.id = p_order_id and o.checkout_token = p_checkout_token
  limit 1;
$$;

revoke all on function public.checkout_status(text, text) from public;
grant execute on function public.checkout_status(text, text) to anon, authenticated;

-- Tautan bukti hanya diterima jika token checkout cocok dengan pesanan itu.
create or replace function public.submit_payment_proof(
  p_order_id text,
  p_checkout_token text,
  p_proof_path text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select * into v_order
  from public.orders
  where id = p_order_id and checkout_token = p_checkout_token
  for update;

  if not found then
    raise exception 'Sesi pembayaran tidak valid.' using errcode = '42501';
  end if;
  if v_order.activated_at is not null then
    raise exception 'Pesanan ini sudah aktif.' using errcode = '42501';
  end if;
  if p_proof_path is null
     or p_proof_path !~ ('^orders/' || regexp_replace(p_order_id, '[^A-Za-z0-9_-]', '', 'g') || '/[A-Za-z0-9._-]+$') then
    raise exception 'Path bukti transfer tidak valid.' using errcode = '22023';
  end if;

  update public.orders
  set proof_path = p_proof_path,
      proof_uploaded_at = now(),
      payment_provider = 'manual_transfer',
      payment_reference = p_proof_path,
      payment_status = 'pending'
  where id = p_order_id;

  return true;
end;
$$;

revoke all on function public.submit_payment_proof(text, text, text) from public;
grant execute on function public.submit_payment_proof(text, text, text) to anon, authenticated;

-- replace_site_data wajib mengubah daftar kolom site_settings karena kolom
-- rekening baru, dan harus mempertahankan data checkout yang tidak dikirim
-- oleh snapshot dashboard (token, bukti, status aktivasi).
create or replace function public.replace_site_data(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh menyimpan data dashboard.'
      using errcode = '42501';
  end if;

  drop table if exists pg_temp._guestbook_backup;
  create temp table _guestbook_backup on commit drop as
    select id, page_id, name, message, attendance, created_at
    from public.guestbook_entries;

  drop table if exists pg_temp._guest_checkin_backup;
  create temp table _guest_checkin_backup on commit drop as
    select entry_id, token, identity_category, phone, checked_in_at, checkin_method, checkin_note, created_at
    from public.guest_checkins;

  drop table if exists pg_temp._checkout_backup;
  create temp table _checkout_backup on commit drop as
    select id, checkout_key, checkout_token, payment_status, payment_provider, payment_reference,
           payment_url, payment_expires_at, invitation_id, auth_user_id, activated_at,
           proof_path, proof_uploaded_at
    from public.orders;

  delete from public.footer_links where true;
  delete from public.footer_columns where true;
  delete from public.navigation where true;
  delete from public.orders where true;
  delete from public.customers where true;
  delete from public.users where true;
  delete from public.media where true;
  delete from public.site_settings where true;
  delete from public.pages where true;
  delete from public.categories where true;

  insert into public.categories
  select * from jsonb_populate_recordset(null::public.categories, coalesce(payload->'categories', '[]'::jsonb));

  insert into public.pages
  select * from jsonb_populate_recordset(null::public.pages, coalesce(payload->'pages', '[]'::jsonb));

  insert into public.guestbook_entries (id, page_id, name, message, attendance, created_at)
  overriding system value
  select b.id, b.page_id, b.name, b.message, b.attendance, b.created_at
  from pg_temp._guestbook_backup b
  where exists (select 1 from public.pages p where p.id = b.page_id)
  order by b.id;

  insert into public.guest_checkins (
    entry_id, token, identity_category, phone, checked_in_at, checkin_method, checkin_note, created_at
  )
  select b.entry_id, b.token, b.identity_category, b.phone, b.checked_in_at,
         b.checkin_method, b.checkin_note, b.created_at
  from pg_temp._guest_checkin_backup b
  where exists (select 1 from public.guestbook_entries e where e.id = b.entry_id)
  order by b.entry_id;

  perform setval(
    pg_get_serial_sequence('public.guestbook_entries', 'id'),
    greatest(coalesce((select max(id) from public.guestbook_entries), 0), 1),
    true
  );

  insert into public.media
  select * from jsonb_populate_recordset(null::public.media, coalesce(payload->'media', '[]'::jsonb));

  insert into public.customers
  select * from jsonb_populate_recordset(null::public.customers, coalesce(payload->'customers', '[]'::jsonb));

  insert into public.users
  select * from jsonb_populate_recordset(null::public.users, coalesce(payload->'users', '[]'::jsonb));

  insert into public.orders (
    id, customer_name, email, phone, template_id, package_name, status, total,
    paid, paid_at, date, notes, payment_status
  )
  select
    o.id, o.customer_name, o.email, o.phone, o.template_id, o.package_name, o.status, o.total,
    o.paid, o.paid_at, o.date, coalesce(o.notes, ''), coalesce(o.payment_status, 'unpaid')
  from jsonb_populate_recordset(null::public.orders, coalesce(payload->'orders', '[]'::jsonb)) o;

  update public.orders o
  set checkout_key = b.checkout_key,
      checkout_token = b.checkout_token,
      payment_status = b.payment_status,
      payment_provider = b.payment_provider,
      payment_reference = b.payment_reference,
      payment_url = b.payment_url,
      payment_expires_at = b.payment_expires_at,
      invitation_id = b.invitation_id,
      auth_user_id = b.auth_user_id,
      activated_at = b.activated_at,
      proof_path = b.proof_path,
      proof_uploaded_at = b.proof_uploaded_at
  from pg_temp._checkout_backup b
  where o.id = b.id;

  insert into public.site_settings (
    id, site_name, tagline, description, logo, whatsapp, instagram, email, address,
    announcement, announcement_enabled, seo_title, seo_description, seo_keywords,
    footer_text, primary_color, accent_color,
    bank_name, bank_account_number, bank_account_holder, updated_at
  )
  select
    1, s.site_name, s.tagline, s.description, s.logo, s.whatsapp, s.instagram, s.email, s.address,
    s.announcement, coalesce(s.announcement_enabled, false), s.seo_title, s.seo_description, s.seo_keywords,
    s.footer_text, s.primary_color, s.accent_color,
    coalesce(s.bank_name, ''), coalesce(s.bank_account_number, ''), coalesce(s.bank_account_holder, ''),
    coalesce(s.updated_at, now())
  from jsonb_populate_record(null::public.site_settings, coalesce(payload->'settings', '{}'::jsonb)) s;

  insert into public.navigation
  select * from jsonb_populate_recordset(null::public.navigation, coalesce(payload->'navigation', '[]'::jsonb));

  insert into public.footer_columns
  select * from jsonb_populate_recordset(null::public.footer_columns, coalesce(payload->'footer', '[]'::jsonb));

  insert into public.footer_links (column_id, label, href, sort_order)
  select
    col->>'id',
    link->>'label',
    coalesce(link->>'href', ''),
    coalesce((link->>'sort_order')::int, 0)
  from jsonb_array_elements(coalesce(payload->'footer', '[]'::jsonb)) as col
  cross join lateral jsonb_array_elements(coalesce(col->'links', '[]'::jsonb)) as link;
end;
$$;

revoke all on function public.replace_site_data(jsonb) from public, anon;
grant execute on function public.replace_site_data(jsonb) to authenticated;
