// Membuat supabase/seed.sql dari data seed aplikasi (src/data/site.ts) supaya
// tabel Supabase berisi mock data yang identik dengan yang dipakai frontend.
//
// site.ts adalah TypeScript, jadi dibundel dulu dengan esbuild (sudah tersedia
// lewat Vite) lalu diimpor sebagai modul ESM.
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(process.cwd());
const bundlePath = join(tmpdir(), `attar-seed-${Date.now()}.mjs`);

await build({
  entryPoints: [join(ROOT, 'src', 'data', 'site.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: bundlePath,
  loader: { '.json': 'json' },
  logLevel: 'silent',
});

const { seedDatabase: db } = await import(pathToFileURL(bundlePath).href);

const q = (value) => (value === null || value === undefined ? 'null' : `'${String(value).replace(/'/g, "''")}'`);
const json = (value) => (value === null || value === undefined ? `'{}'::jsonb` : `${q(JSON.stringify(value))}::jsonb`);
const num = (value) => (value === null || value === undefined ? 'null' : String(value));
const strArray = (value) =>
  Array.isArray(value) && value.length ? `array[${value.map(q).join(', ')}]::text[]` : `'{}'::text[]`;

const lines = [
  '-- Seed data bydreamy, dihasilkan dari src/data/site.ts.',
  '-- Idempoten: baris yang sudah ada tidak ditimpa.',
  '',
];

function insert(table, columns, rows, conflict = 'id') {
  if (!rows.length) return;
  lines.push(`insert into public.${table} (${columns.join(', ')}) values`);
  lines.push(rows.map((row) => `  (${row.join(', ')})`).join(',\n'));
  lines.push(`on conflict (${conflict}) do nothing;`, '');
}

insert(
  'categories',
  ['id', 'name', 'slug', 'tagline', 'description', 'accent', 'cover', 'sort_order', 'count'],
  db.categories.map((c, i) => [
    q(String(c.id)),
    q(c.name),
    q(c.slug),
    q(c.tagline),
    q(c.description),
    q(c.accent),
    q(c.cover),
    num(i),
    num(c.count),
  ]),
);

insert(
  'pages',
  [
    'id', 'slug', 'route', 'label', 'title', 'description', 'category', 'sort_order', 'template_name',
    'file', 'css', 'thumb', 'status', 'kind', 'price', 'price_compare', 'content_html',
    'hidden_section_ids', 'text_overrides', 'image_overrides', 'link_overrides', 'extra_html', 'views', 'updated_at',
  ],
  db.pages.map((p) => [
    num(p.id), q(p.slug), q(p.route), q(p.label), q(p.title), q(p.description), q(p.category ?? null),
    num(p.order), q(p.templateName ?? null), q(p.file), q(p.css), q(p.thumb), q(p.status), q(p.kind),
    num(p.price), num(p.priceCompare), q(p.contentHtml ?? null), strArray(p.hiddenSectionIds),
    json(p.textOverrides), json(p.imageOverrides), json(p.linkOverrides), q(p.extraHtml ?? null),
    num(p.views), q(p.updatedAt ?? null),
  ]),
);

insert(
  'media',
  ['id', 'name', 'url', 'type', 'folder', 'size', 'created_at'],
  db.media.map((m) => [num(m.id), q(m.name), q(m.url), q(m.type), q(m.folder), q(m.size), q(m.createdAt)]),
);

insert(
  'orders',
  ['id', 'customer_name', 'email', 'phone', 'template_id', 'package_name', 'status', 'total', 'paid', 'paid_at', 'date', 'notes'],
  db.orders.map((o) => [
    q(o.id), q(o.customerName), q(o.email), q(o.phone), num(o.templateId), q(o.packageName), q(o.status),
    num(o.total), num(o.paid), q(o.paidAt ?? null), q(o.date), q(o.notes ?? ''),
  ]),
);

insert(
  'customers',
  ['id', 'name', 'email', 'phone', 'joined'],
  db.customers.map((c) => [num(c.id), q(c.name), q(c.email), q(c.phone), q(c.joined)]),
);

insert(
  'users',
  ['id', 'name', 'email', 'role', 'status', 'last_login'],
  db.users.map((u) => [num(u.id), q(u.name), q(u.email), q(u.role), q(u.status), q(u.lastLogin)]),
);

insert(
  'navigation',
  ['id', 'label', 'href', 'visible', 'sort_order'],
  db.navigation.map((n, i) => [q(n.id), q(n.label), q(n.href), String(Boolean(n.visible)), num(i)]),
);

insert(
  'footer_columns',
  ['id', 'title', 'sort_order'],
  db.footer.map((f, i) => [q(f.id), q(f.title), num(i)]),
);

lines.push('insert into public.footer_links (column_id, label, href, sort_order) values');
lines.push(
  db.footer
    .flatMap((f) => f.links.map((l, i) => `  (${q(f.id)}, ${q(l.label)}, ${q(l.href)}, ${num(i)})`))
    .join(',\n'),
);
lines.push('on conflict do nothing;', '');

const s = db.settings;
insert(
  'site_settings',
  [
    'id', 'site_name', 'tagline', 'description', 'logo', 'whatsapp', 'instagram', 'email', 'address',
    'announcement', 'announcement_enabled', 'seo_title', 'seo_description', 'seo_keywords', 'footer_text',
    'primary_color', 'accent_color',
  ],
  [[
    '1', q(s.siteName), q(s.tagline), q(s.description), q(s.logo), q(s.whatsapp), q(s.instagram), q(s.email),
    q(s.address), q(s.announcement), String(Boolean(s.announcementEnabled)), q(s.seoTitle), q(s.seoDescription),
    q(s.seoKeywords), q(s.footerText), q(s.primaryColor), q(s.accentColor),
  ]],
);

writeFileSync(join(ROOT, 'supabase', 'seed.sql'), `${lines.join('\n')}\n`);
console.log(`supabase/seed.sql dibuat: ${db.pages.length} halaman, ${db.media.length} media, ${db.orders.length} pesanan, ${db.categories.length} kategori.`);
