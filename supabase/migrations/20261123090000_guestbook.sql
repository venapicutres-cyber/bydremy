-- Buku tamu / RSVP undangan.
-- Ucapan tamu disimpan di database (bukan hanya localStorage) agar bisa dilihat
-- semua tamu dan direkap di dashboard. Penulisan hanya lewat RPC submit_guestbook
-- yang memvalidasi isi, sehingga anon tidak bisa insert/update/delete langsung.

create table if not exists public.guestbook_entries (
  id bigint generated always as identity primary key,
  page_id bigint not null references public.pages (id) on delete cascade,
  name text not null,
  message text not null default '',
  attendance text not null default '',
  created_at timestamptz not null default now(),
  constraint guestbook_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint guestbook_message_length check (char_length(message) <= 1000),
  constraint guestbook_attendance_length check (char_length(attendance) <= 40)
);

create index if not exists guestbook_entries_page_idx
  on public.guestbook_entries (page_id, created_at desc);

create index if not exists guestbook_entries_created_idx
  on public.guestbook_entries (created_at desc);

-- Tabel baru otomatis mendapat grant dari default privileges; cabut dulu agar
-- tamu hanya bisa membaca dan mengirim lewat fungsi di bawah.
revoke all on public.guestbook_entries from anon, authenticated;
grant select on public.guestbook_entries to anon, authenticated;

alter table public.guestbook_entries enable row level security;

drop policy if exists guestbook_read on public.guestbook_entries;
create policy guestbook_read on public.guestbook_entries
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Kirim ucapan: validasi, cegah kiriman ganda, lalu simpan.
-- ---------------------------------------------------------------------------
create or replace function public.submit_guestbook(
  p_page_id bigint,
  p_name text,
  p_message text,
  p_attendance text default ''
)
returns public.guestbook_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_attendance text := btrim(coalesce(p_attendance, ''));
  v_entry public.guestbook_entries;
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

  -- Cegah dobel klik / kiriman berulang dalam 20 detik terakhir.
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

  return v_entry;
end;
$$;

revoke all on function public.submit_guestbook(bigint, text, text, text) from public;
grant execute on function public.submit_guestbook(bigint, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: biar ucapan baru langsung muncul di undangan tamu lain.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.guestbook_entries;
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end if;
end $$;
