-- Public readers only see published pages; admins and assigned editors can
-- also read the pages their role is allowed to manage.
drop policy if exists pages_read_all on public.pages;
drop policy if exists pages_public_published_read on public.pages;
drop policy if exists pages_editor_assigned_read on public.pages;

create policy pages_public_published_read on public.pages
	for select to anon, authenticated
	using (status = 'published');

create policy pages_editor_assigned_read on public.pages
	for select to authenticated
	using (public.is_editor_of(id));

-- Editors can only create or replace objects inside their own invitation path.
-- Admins retain access to the shared media namespace. Public object URLs remain
-- available because the bucket itself is public; object listing stays scoped.
drop policy if exists assets_public_read on storage.objects;
drop policy if exists assets_authenticated_read on storage.objects;
drop policy if exists assets_public_insert on storage.objects;
drop policy if exists assets_public_update on storage.objects;

create policy assets_authenticated_read on storage.objects
	for select to authenticated
	using (
		bucket_id = 'assets'
		and (
			public.is_admin()
			or (
				public.is_editor_of(public.editor_page_id())
				and (storage.foldername(name))[1] = 'invitations'
				and (storage.foldername(name))[2] = public.editor_page_id()::text
			)
		)
	);

create policy assets_public_insert on storage.objects
	for insert to authenticated
	with check (
		bucket_id = 'assets'
		and (
			public.is_admin()
			or (
				public.is_editor_of(public.editor_page_id())
				and (storage.foldername(name))[1] = 'invitations'
				and (storage.foldername(name))[2] = public.editor_page_id()::text
			)
		)
	);

create policy assets_public_update on storage.objects
	for update to authenticated
	using (
		bucket_id = 'assets'
		and (
			public.is_admin()
			or (
				public.is_editor_of(public.editor_page_id())
				and (storage.foldername(name))[1] = 'invitations'
				and (storage.foldername(name))[2] = public.editor_page_id()::text
			)
		)
	)
	with check (
		bucket_id = 'assets'
		and (
			public.is_admin()
			or (
				public.is_editor_of(public.editor_page_id())
				and (storage.foldername(name))[1] = 'invitations'
				and (storage.foldername(name))[2] = public.editor_page_id()::text
			)
		)
	);
