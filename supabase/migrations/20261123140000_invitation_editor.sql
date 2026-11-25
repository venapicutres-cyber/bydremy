-- Akun editor khusus satu undangan, dibagikan ke pengantin.
--
-- Role 'editor' tidak boleh memakai replace_site_data karena fungsi itu menimpa
-- seluruh snapshot situs dan tetap dijaga is_admin(). Sebagai gantinya editor
-- hanya boleh memperbarui satu halaman lewat RPC di bawah, dan hanya halaman
-- yang id-nya tercatat di app_metadata akun tersebut.

-- ---------------------------------------------------------------------------
-- Helper: halaman yang boleh diedit pemanggil, dan apakah target diizinkan.
-- ---------------------------------------------------------------------------
create or replace function public.editor_page_id()
returns bigint
language sql
stable
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'page_id', '')::bigint;
$$;

grant execute on function public.editor_page_id() to anon, authenticated;

create or replace function public.is_editor_of(target bigint)
returns boolean
language sql
stable
as $$
  select public.is_admin()
      or (
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'editor'
        and public.editor_page_id() = target
      );
$$;

grant execute on function public.is_editor_of(bigint) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Simpan satu undangan: hanya kolom yang boleh disentuh pengantin.
-- ---------------------------------------------------------------------------
create or replace function public.update_invitation_page(target bigint, patch jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_editor_of(target) then
    raise exception 'Tidak punya akses ke undangan ini.' using errcode = '42501';
  end if;

  update public.pages set
    label = coalesce(patch ->> 'label', label),
    title = coalesce(patch ->> 'title', title),
    description = coalesce(patch ->> 'description', description),
    slug = coalesce(patch ->> 'slug', slug),
    route = coalesce(patch ->> 'route', route),
    status = coalesce(patch ->> 'status', status),
    hidden_section_ids = case
      when patch ? 'hidden_section_ids'
        then array(select jsonb_array_elements_text(patch -> 'hidden_section_ids'))
      else hidden_section_ids
    end,
    text_overrides = coalesce(patch -> 'text_overrides', text_overrides),
    image_overrides = coalesce(patch -> 'image_overrides', image_overrides),
    link_overrides = coalesce(patch -> 'link_overrides', link_overrides),
    updated_at = now()
  where id = target;

  if not found then
    raise exception 'Undangan tidak ditemukan.' using errcode = '23503';
  end if;
end;
$$;

revoke all on function public.update_invitation_page(bigint, jsonb) from public;
grant execute on function public.update_invitation_page(bigint, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: editor undangan boleh mengunggah foto/video/musik. Hapus tetap
-- admin supaya aset situs tidak ikut terhapus.
-- ---------------------------------------------------------------------------
drop policy if exists assets_public_insert on storage.objects;
drop policy if exists assets_public_update on storage.objects;

create policy assets_public_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'assets'
    and (
      public.is_admin()
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'editor'
    )
  );

create policy assets_public_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'assets'
    and (
      public.is_admin()
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'editor'
    )
  )
  with check (
    bucket_id = 'assets'
    and (
      public.is_admin()
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'editor'
    )
  );
