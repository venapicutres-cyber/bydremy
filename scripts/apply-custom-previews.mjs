import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

/** Applies the generated custom preview page rows with the service role key. */

const ids = [326105, 326104, 326102, 326103, 326106, 326112, 326107];
const pages = JSON.parse(fs.readFileSync('src/data/generated/pages.json', 'utf8'));
const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^[A-Z0-9_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);

const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const rows = pages
  .filter((page) => ids.includes(page.id))
  .map((page, index) => ({
    id: page.id,
    slug: page.slug,
    route: page.route,
    label: page.label,
    title: page.title,
    description: page.description,
    category: page.category ?? null,
    sort_order: page.order ?? 0,
    template_name: page.templateName ?? null,
    file: page.file,
    css: page.css ?? '',
    thumb: page.thumb,
    status: page.status,
    kind: page.kind,
    price: null,
    price_compare: null,
    content_html: null,
    hidden_section_ids: [],
    text_overrides: {},
    image_overrides: {},
    link_overrides: {},
    extra_html: null,
    views: 120 + index * 17,
    updated_at: '2026-11-25T13:00:00',
  }));

if (rows.length !== ids.length) {
  throw new Error(`Expected ${ids.length} preview rows, found ${rows.length}.`);
}

const { error } = await db.from('pages').upsert(rows, { onConflict: 'id' });
if (error) throw error;

const { data: verify, error: verifyError } = await db
  .from('pages')
  .select('id,slug,route,label,status,kind,file')
  .in('id', ids)
  .order('id');

if (verifyError) throw verifyError;
console.log(JSON.stringify(verify, null, 2));
