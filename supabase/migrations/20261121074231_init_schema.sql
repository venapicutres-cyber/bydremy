-- Skema backend bydreamy (Supabase/Postgres).
-- Semua tabel berada di schema `public` dan dipakai oleh Data API.
-- Aplikasi memakai anon key dengan login demo sisi klien, sehingga policy
-- di bawah ini sengaja permisif. Ganti ke auth.uid() berbasis jika nanti
-- memakai Supabase Auth sungguhan.

-- ---------------------------------------------------------------------------
-- Kategori template
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  tagline text not null default '',
  description text not null default '',
  accent text not null default '',
  cover text not null default '',
  sort_order integer not null default 0,
  count integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Halaman (home, template demo, halaman jual)
-- ---------------------------------------------------------------------------
create table if not exists public.pages (
  id bigint primary key,
  slug text not null unique,
  route text not null,
  label text not null,
  title text not null default '',
  description text not null default '',
  category text references public.categories (slug) on delete set null,
  sort_order integer not null default 0,
  template_name text,
  file text not null,
  css text not null default '',
  thumb text not null default '',
  status text not null default 'published' check (status in ('published', 'draft')),
  kind text not null default 'page' check (kind in ('template', 'home', 'page')),
  price integer,
  price_compare integer,
  content_html text,
  hidden_section_ids text[] not null default '{}',
  text_overrides jsonb not null default '{}'::jsonb,
  image_overrides jsonb not null default '{}'::jsonb,
  link_overrides jsonb not null default '{}'::jsonb,
  extra_html text,
  views integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists pages_category_idx on public.pages (category);
create index if not exists pages_sort_order_idx on public.pages (sort_order);

-- ---------------------------------------------------------------------------
-- Media (gambar, font, video, dokumen)
-- ---------------------------------------------------------------------------
create table if not exists public.media (
  id bigint primary key,
  name text not null,
  url text not null default '',
  type text not null default 'image' check (type in ('image', 'font', 'video', 'document')),
  folder text not null default '',
  size text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists media_type_idx on public.media (type);

-- ---------------------------------------------------------------------------
-- Pesanan & pelanggan
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  email text not null default '',
  phone text not null default '',
  template_id bigint references public.pages (id) on delete set null,
  package_name text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'in_progress', 'completed', 'cancelled')),
  total bigint not null default 0,
  paid bigint,
  paid_at date,
  date date not null default current_date,
  notes text default ''
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_template_idx on public.orders (template_id);

create table if not exists public.customers (
  id bigint primary key,
  name text not null,
  email text not null default '',
  phone text not null default '',
  joined date not null default current_date
);

-- ---------------------------------------------------------------------------
-- Pengguna dashboard (login demo sisi klien)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id bigint primary key,
  name text not null,
  email text not null unique,
  role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  last_login timestamptz
);

-- ---------------------------------------------------------------------------
-- Pengaturan situs (satu baris)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  site_name text not null default '',
  tagline text not null default '',
  description text not null default '',
  logo text not null default '',
  whatsapp text not null default '',
  instagram text not null default '',
  email text not null default '',
  address text not null default '',
  announcement text not null default '',
  announcement_enabled boolean not null default false,
  seo_title text not null default '',
  seo_description text not null default '',
  seo_keywords text not null default '',
  footer_text text not null default '',
  primary_color text not null default '',
  accent_color text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Navigasi & footer
-- ---------------------------------------------------------------------------
create table if not exists public.navigation (
  id text primary key,
  label text not null,
  href text not null default '',
  visible boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.footer_columns (
  id text primary key,
  title text not null,
  sort_order integer not null default 0
);

create table if not exists public.footer_links (
  id bigint generated always as identity primary key,
  column_id text not null references public.footer_columns (id) on delete cascade,
  label text not null,
  href text not null default '',
  sort_order integer not null default 0
);

create index if not exists footer_links_column_idx on public.footer_links (column_id);

-- ---------------------------------------------------------------------------
-- Hak akses Data API + RLS
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;

alter table public.categories enable row level security;
alter table public.pages enable row level security;
alter table public.media enable row level security;
alter table public.orders enable row level security;
alter table public.customers enable row level security;
alter table public.users enable row level security;
alter table public.site_settings enable row level security;
alter table public.navigation enable row level security;
alter table public.footer_columns enable row level security;
alter table public.footer_links enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'categories', 'pages', 'media', 'orders', 'customers', 'users',
    'site_settings', 'navigation', 'footer_columns', 'footer_links'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true);',
      t || '_read_all', t
    );
    execute format(
      'create policy %I on public.%I for insert to anon, authenticated with check (true);',
      t || '_write_insert', t
    );
    execute format(
      'create policy %I on public.%I for update to anon, authenticated using (true) with check (true);',
      t || '_write_update', t
    );
    execute format(
      'create policy %I on public.%I for delete to anon, authenticated using (true);',
      t || '_write_delete', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage: folder publik aset
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do update set public = true;
