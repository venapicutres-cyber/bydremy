-- Keamanan produksi: publik hanya boleh membaca konten website.
-- Semua operasi tulis, data pesanan/pelanggan/pengguna, dan upload Storage
-- hanya untuk user yang login lewat Supabase Auth (role `authenticated`).

-- ---------------------------------------------------------------------------
-- Konten publik: select tetap terbuka, tulis hanya untuk authenticated.
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
      'create policy %I on public.%I for insert to authenticated with check (true);',
      t || '_write_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (true) with check (true);',
      t || '_write_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (true);',
      t || '_write_delete', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Data bisnis & akun: tidak boleh dibaca publik sama sekali.
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
      'create policy %I on public.%I for select to authenticated using (true);',
      t || '_read_all', t
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (true);',
      t || '_write_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (true) with check (true);',
      t || '_write_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (true);',
      t || '_write_delete', t
    );
  end loop;
end $$;

revoke all on public.orders, public.customers, public.users from anon;
grant select, insert, update, delete on public.orders, public.customers, public.users to authenticated;

-- ---------------------------------------------------------------------------
-- Simpan snapshot dashboard: hanya user login.
-- ---------------------------------------------------------------------------
revoke all on function public.replace_site_data(jsonb) from public, anon;
grant execute on function public.replace_site_data(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: baca publik, tulis hanya user login.
-- ---------------------------------------------------------------------------
drop policy if exists assets_public_insert on storage.objects;
drop policy if exists assets_public_update on storage.objects;
drop policy if exists assets_public_delete on storage.objects;

create policy assets_public_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'assets');

create policy assets_public_update on storage.objects
  for update to authenticated using (bucket_id = 'assets') with check (bucket_id = 'assets');

create policy assets_public_delete on storage.objects
  for delete to authenticated using (bucket_id = 'assets');
