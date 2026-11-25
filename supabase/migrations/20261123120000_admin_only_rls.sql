-- Kunci akses tulis ke admin sungguhan.
--
-- Sebelumnya semua kebijakan tulis memakai `to authenticated using (true)`.
-- Karena pendaftaran publik terbuka, siapa pun bisa mendaftar lalu otomatis
-- punya hak admin (baca data pesanan/pelanggan, ubah konten, timpa snapshot).
-- Sekarang setiap operasi tulis dan data bisnis wajib app_metadata.role='admin'.

-- ---------------------------------------------------------------------------
-- Helper: pemanggil adalah admin? (klaim JWT dari Supabase Auth)
-- `service_role` diizinkan agar skrip pemeliharaan tetap bisa berjalan.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
      or coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Konten publik: baca tetap terbuka untuk anon, tulis hanya admin.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'categories', 'pages', 'media', 'site_settings',
    'navigation', 'footer_columns', 'footer_links'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_write_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_write_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_write_delete', t);

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_admin());',
      t || '_write_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin());',
      t || '_write_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_admin());',
      t || '_write_delete', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Data bisnis & akun: hanya admin yang boleh baca maupun tulis.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['orders', 'customers', 'users']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_read_all', t);
    execute format('drop policy if exists %I on public.%I', t || '_write_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_write_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_write_delete', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_admin());',
      t || '_read_all', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_admin());',
      t || '_write_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin());',
      t || '_write_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_admin());',
      t || '_write_delete', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Buku tamu: moderasi (hapus) hanya admin.
-- ---------------------------------------------------------------------------
grant delete on public.guestbook_entries to authenticated;

drop policy if exists guestbook_admin_delete on public.guestbook_entries;
create policy guestbook_admin_delete on public.guestbook_entries
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Snapshot dashboard: fungsi ini SECURITY DEFINER, jadi RLS tabel tidak
-- berlaku di dalamnya. Tanpa penjaga ini, user login biasa bisa menimpa
-- seluruh data situs lewat satu panggilan RPC.
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
  delete from public.pages where true;
  delete from public.categories where true;

  -- Kategori lebih dulu: pages.category -> categories.slug.
  insert into public.categories
  select * from jsonb_populate_recordset(null::public.categories, coalesce(payload->'categories', '[]'::jsonb));

  insert into public.pages
  select * from jsonb_populate_recordset(null::public.pages, coalesce(payload->'pages', '[]'::jsonb));

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

-- ---------------------------------------------------------------------------
-- Storage: baca publik, tulis hanya admin.
-- ---------------------------------------------------------------------------
drop policy if exists assets_public_insert on storage.objects;
drop policy if exists assets_public_update on storage.objects;
drop policy if exists assets_public_delete on storage.objects;

create policy assets_public_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'assets' and public.is_admin());

create policy assets_public_update on storage.objects
  for update to authenticated using (bucket_id = 'assets' and public.is_admin())
  with check (bucket_id = 'assets' and public.is_admin());

create policy assets_public_delete on storage.objects
  for delete to authenticated using (bucket_id = 'assets' and public.is_admin());
