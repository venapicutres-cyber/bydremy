-- Digital Guestbook: personal QR check-in, manual check-in, dan data realtime.
-- Token QR disimpan di tabel terpisah supaya anon tidak bisa membaca/menyalin
-- token lewat SELECT biasa pada guestbook_entries.

create table if not exists public.guest_checkins (
  entry_id bigint primary key references public.guestbook_entries (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  identity_category text not null default '',
  phone text not null default '',
  checked_in_at timestamptz,
  checkin_method text not null default '',
  checkin_note text not null default '',
  created_at timestamptz not null default now(),
  constraint guest_checkin_identity_length check (char_length(identity_category) <= 60),
  constraint guest_checkin_phone_length check (char_length(phone) <= 30),
  constraint guest_checkin_method_check check (checkin_method = '' or checkin_method in ('qr', 'manual')),
  constraint guest_checkin_note_length check (char_length(checkin_note) <= 200)
);

create index if not exists guest_checkins_token_idx on public.guest_checkins (token);
create index if not exists guest_checkins_checked_idx on public.guest_checkins (checked_in_at desc);

-- Tamu lama ikut mendapat QR personal.
insert into public.guest_checkins (entry_id)
select e.id
from public.guestbook_entries e
where not exists (
  select 1 from public.guest_checkins c where c.entry_id = e.id
);

revoke all on public.guest_checkins from anon, authenticated;
grant select on public.guest_checkins to authenticated;
alter table public.guest_checkins enable row level security;

drop policy if exists guest_checkins_read on public.guest_checkins;
create policy guest_checkins_read on public.guest_checkins
  for select to authenticated
  using (
    exists (
      select 1
      from public.guestbook_entries e
      where e.id = entry_id and public.is_editor_of(e.page_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Kirim RSVP: tetap memakai validasi lama, sekarang ikut membuat QR personal.
-- Return value diubah jadi jsonb agar token bisa dipakai undangan tamu.
-- ---------------------------------------------------------------------------
drop function if exists public.submit_guestbook(bigint, text, text, text);
create or replace function public.submit_guestbook(
  p_page_id bigint,
  p_name text,
  p_message text,
  p_attendance text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_attendance text := btrim(coalesce(p_attendance, ''));
  v_entry public.guestbook_entries;
  v_checkin public.guest_checkins;
begin
  if char_length(v_name) < 1 or char_length(v_name) > 80 then
    raise exception 'Nama tamu harus 1-80 karakter.' using errcode = '22023';
  end if;
  if char_length(v_message) > 1000 then
    raise exception 'Ucapan maksimal 1000 karakter.' using errcode = '22023';
  end if;
  if v_attendance not in ('Hadir', 'Tidak Hadir') then
    v_attendance := '';
  end if;
  if not exists (select 1 from public.pages where id = p_page_id) then
    raise exception 'Undangan tidak ditemukan.' using errcode = '23503';
  end if;

  if exists (
    select 1
    from public.guestbook_entries e
    where e.page_id = p_page_id
      and lower(e.name) = lower(v_name)
      and e.message = v_message
      and e.created_at > now() - interval '20 seconds'
  ) then
    raise exception 'Ucapan yang sama baru saja dikirim.' using errcode = '23505';
  end if;

  insert into public.guestbook_entries (page_id, name, message, attendance)
  values (p_page_id, v_name, v_message, v_attendance)
  returning * into v_entry;

  insert into public.guest_checkins (entry_id)
  values (v_entry.id)
  returning * into v_checkin;

  return to_jsonb(v_entry) || jsonb_build_object('checkin_token', v_checkin.token);
end;
$$;

revoke all on function public.submit_guestbook(bigint, text, text, text) from public;
grant execute on function public.submit_guestbook(bigint, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Scan QR di dashboard check-in. Idempotent: scan ulang tidak merusak data.
-- ---------------------------------------------------------------------------
drop function if exists public.check_in_guest_token(uuid, text);
create or replace function public.check_in_guest_token(p_token uuid, p_method text default 'qr')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_checkin public.guest_checkins;
  v_entry public.guestbook_entries;
  v_method text := lower(btrim(coalesce(p_method, 'qr')));
  v_already boolean := false;
begin
  if v_method not in ('qr', 'manual') then
    v_method := 'qr';
  end if;

  select c.* into v_checkin
  from public.guest_checkins c
  where c.token = p_token
  for update;

  if not found then
    raise exception 'QR code tidak ditemukan.' using errcode = '23503';
  end if;

  select e.* into v_entry
  from public.guestbook_entries e
  where e.id = v_checkin.entry_id
  for update;

  if not public.is_editor_of(v_entry.page_id) then
    raise exception 'Tidak punya akses ke tamu ini.' using errcode = '42501';
  end if;

  if v_checkin.checked_in_at is not null then
    v_already := true;
  else
    update public.guest_checkins
    set checked_in_at = now(), checkin_method = v_method
    where entry_id = v_checkin.entry_id
    returning * into v_checkin;

    update public.guestbook_entries
    set attendance = 'Hadir'
    where id = v_entry.id
    returning * into v_entry;
  end if;

  return to_jsonb(v_entry) || jsonb_build_object(
    'checkin_token', v_checkin.token,
    'identity_category', v_checkin.identity_category,
    'phone', v_checkin.phone,
    'checked_in_at', v_checkin.checked_in_at,
    'checkin_method', v_checkin.checkin_method,
    'already_checked_in', v_already
  );
end;
$$;

revoke all on function public.check_in_guest_token(uuid, text) from public;
grant execute on function public.check_in_guest_token(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Input manual untuk undangan cetak. Hanya admin/editor undangan terkait.
-- ---------------------------------------------------------------------------
drop function if exists public.manual_check_in(bigint, text, text, text);
create or replace function public.manual_check_in(
  p_page_id bigint,
  p_name text,
  p_identity_category text,
  p_phone text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_identity text := btrim(coalesce(p_identity_category, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^\d+]', '', 'g');
  v_entry public.guestbook_entries;
  v_checkin public.guest_checkins;
begin
  if not public.is_editor_of(p_page_id) then
    raise exception 'Tidak punya akses ke undangan ini.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.pages where id = p_page_id) then
    raise exception 'Undangan tidak ditemukan.' using errcode = '23503';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 80 then
    raise exception 'Nama lengkap tamu harus 1-80 karakter.' using errcode = '22023';
  end if;
  if v_identity = '' then
    v_identity := 'Undangan Cetak';
  end if;
  if char_length(v_identity) > 60 then
    raise exception 'Kategori identitas maksimal 60 karakter.' using errcode = '22023';
  end if;
  if char_length(v_phone) > 30 then
    v_phone := left(v_phone, 30);
  end if;

  if exists (
    select 1
    from public.guestbook_entries e
    where e.page_id = p_page_id
      and lower(e.name) = lower(v_name)
      and e.attendance = 'Hadir'
      and e.created_at > now() - interval '20 seconds'
  ) then
    raise exception 'Tamu ini baru saja di-check-in.' using errcode = '23505';
  end if;

  insert into public.guestbook_entries (page_id, name, message, attendance)
  values (p_page_id, v_name, '', 'Hadir')
  returning * into v_entry;

  insert into public.guest_checkins (
    entry_id, identity_category, phone, checked_in_at, checkin_method
  )
  values (v_entry.id, v_identity, v_phone, now(), 'manual')
  returning * into v_checkin;

  return to_jsonb(v_entry) || jsonb_build_object(
    'checkin_token', v_checkin.token,
    'identity_category', v_checkin.identity_category,
    'phone', v_checkin.phone,
    'checked_in_at', v_checkin.checked_in_at,
    'checkin_method', v_checkin.checkin_method,
    'already_checked_in', false
  );
end;
$$;

revoke all on function public.manual_check_in(bigint, text, text, text) from public;
grant execute on function public.manual_check_in(bigint, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- replace_site_data harus ikut mencadangkan data check-in saat snapshot
-- dashboard ditimpa, kalau tidak token QR hilang setelah admin menyimpan.
-- ---------------------------------------------------------------------------
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

  insert into public.orders
  select * from jsonb_populate_recordset(null::public.orders, coalesce(payload->'orders', '[]'::jsonb));

  insert into public.site_settings (
    id, site_name, tagline, description, logo, whatsapp, instagram, email, address,
    announcement, announcement_enabled, seo_title, seo_description, seo_keywords,
    footer_text, primary_color, accent_color, updated_at
  )
  select
    1, s.site_name, s.tagline, s.description, s.logo, s.whatsapp, s.instagram, s.email, s.address,
    s.announcement, coalesce(s.announcement_enabled, false), s.seo_title, s.seo_description, s.seo_keywords,
    s.footer_text, s.primary_color, s.accent_color, coalesce(s.updated_at, now())
  from jsonb_populate_record(null::public.site_settings, coalesce(payload->'settings', '{}'::jsonb)) s;

  insert into public.navigation
  select * from jsonb_populate_recordset(null::public.navigation, coalesce(payload->'navigation', '[]'::jsonb));

  insert into public.footer_columns
  select * from jsonb_populate_recordset(null::public.footer, coalesce(payload->'footer', '[]'::jsonb));

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

-- Realtime untuk dashboard check-in dan layar sapa.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.guest_checkins;
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end if;
end $$;
