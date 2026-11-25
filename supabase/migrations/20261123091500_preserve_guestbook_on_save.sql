-- Dashboard menyimpan snapshot dengan menghapus seluruh `pages` lalu memasukkannya
-- kembali. Karena guestbook_entries.page_id memakai ON DELETE CASCADE, setiap
-- penyimpanan akan menghapus semua ucapan tamu. Fungsi ini mencadangkan buku tamu
-- dulu dan mengembalikannya setelah halaman ditulis ulang, termasuk ID dan waktu
-- aslinya, sehingga data RSVP aman.

create or replace function public.replace_site_data(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Cadangkan ucapan tamu (pg_temp selalu tersedia di dalam fungsi security definer).
  drop table if exists pg_temp._guestbook_backup;
  create temp table _guestbook_backup on commit drop as
    select id, page_id, name, message, attendance, created_at
    from public.guestbook_entries;

  -- Hapus mengikuti arah foreign key, lalu tulis ulang seluruh snapshot.
  -- `where true` wajib: ekstensi safeupdate menolak DELETE tanpa klausa WHERE.
  delete from public.footer_links where true;
  delete from public.footer_columns where true;
  delete from public.navigation where true;
  delete from public.orders where true;
  delete from public.customers where true;
  delete from public.users where true;
  delete from public.media where true;
  delete from public.site_settings where true;
  delete from public.pages where true; -- guestbook ikut terhapus karena cascade
  delete from public.categories where true;

  -- Kategori lebih dulu: pages.category -> categories.slug.
  insert into public.categories
  select * from jsonb_populate_recordset(null::public.categories, coalesce(payload->'categories', '[]'::jsonb));

  insert into public.pages
  select * from jsonb_populate_recordset(null::public.pages, coalesce(payload->'pages', '[]'::jsonb));

  -- Kembalikan ucapan untuk halaman yang masih ada. ID dan created_at dipertahankan.
  insert into public.guestbook_entries (id, page_id, name, message, attendance, created_at)
  overriding system value
  select b.id, b.page_id, b.name, b.message, b.attendance, b.created_at
  from pg_temp._guestbook_backup b
  where exists (select 1 from public.pages p where p.id = b.page_id)
  order by b.id;

  -- Pastikan sequence identity tetap di depan ID terbesar.
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

  -- Pesanan setelah halaman: orders.template_id -> pages.id.
  insert into public.orders
  select * from jsonb_populate_recordset(null::public.orders, coalesce(payload->'orders', '[]'::jsonb));

  -- Baris tunggal; id & updated_at tidak dikirim klien sehingga diisi di sini.
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
  select * from jsonb_populate_recordset(null::public.footer_columns, coalesce(payload->'footer', '[]'::jsonb));

  -- Link footer diambil dari array bersarang (id-nya identity, bukan dari klien).
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

grant execute on function public.replace_site_data(jsonb) to anon, authenticated;
