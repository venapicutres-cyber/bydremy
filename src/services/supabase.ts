import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { seedDatabase } from '../data/site';
import type {
  CategoryRecord,
  CustomerRecord,
  Database,
  MediaRecord,
  NavItem,
  OrderRecord,
  PageRecord,
  SettingsRecord,
  UserRecord,
} from '../data/types';
import { ASSET_BASE } from '../utils/assetUrl';

/**
 * Supabase dipakai sebagai backend: data dashboard disimpan di tabel `public`
 * dan seluruh aset disajikan dari bucket Storage `assets`.
 */
const ENV = ((import.meta as { env?: Record<string, string> }).env || {}) as Record<string, string>;

const SUPABASE_URL = (ENV.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (ENV.VITE_SUPABASE_ANON_KEY || '').trim();

export const ASSET_BUCKET = 'assets';

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export const isSupabaseConfigured = Boolean(supabase);

type Row = Record<string, unknown>;

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optNum(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapRecord(value: unknown): Record<string, string> {
  return value && typeof value === 'object' ? (value as Record<string, string>) : {};
}

/* -------------------------------------------------------------------------- */
/* Baris tabel -> record aplikasi                                              */
/* -------------------------------------------------------------------------- */

function pageFromRow(row: Row): PageRecord {
  const record: PageRecord = {
    id: num(row.id),
    slug: str(row.slug),
    route: str(row.route),
    label: str(row.label),
    title: str(row.title),
    description: str(row.description),
    category: row.category == null ? null : str(row.category),
    order: num(row.sort_order),
    templateName: row.template_name == null ? null : str(row.template_name),
    file: str(row.file),
    css: str(row.css),
    thumb: str(row.thumb),
    status: str(row.status, 'published') as PageRecord['status'],
    kind: str(row.kind, 'page') as PageRecord['kind'],
    hiddenSectionIds: Array.isArray(row.hidden_section_ids) ? (row.hidden_section_ids as string[]) : [],
    textOverrides: mapRecord(row.text_overrides),
    imageOverrides: mapRecord(row.image_overrides),
    linkOverrides: mapRecord(row.link_overrides),
    updatedAt: row.updated_at == null ? undefined : str(row.updated_at),
    views: num(row.views),
  };
  const price = optNum(row.price);
  if (price !== undefined) record.price = price;
  const priceCompare = optNum(row.price_compare);
  if (priceCompare !== undefined) record.priceCompare = priceCompare;
  if (row.content_html != null) record.contentHtml = str(row.content_html);
  if (row.extra_html != null) record.extraHtml = str(row.extra_html);
  return record;
}

function categoryFromRow(row: Row): CategoryRecord {
  return {
    id: str(row.id),
    name: str(row.name),
    slug: str(row.slug),
    tagline: str(row.tagline),
    description: str(row.description),
    accent: str(row.accent),
    cover: str(row.cover),
    count: num(row.count),
  };
}

function mediaFromRow(row: Row): MediaRecord {
  return {
    id: num(row.id),
    name: str(row.name),
    url: str(row.url),
    type: str(row.type, 'image') as MediaRecord['type'],
    folder: str(row.folder),
    size: str(row.size),
    createdAt: str(row.created_at, new Date().toISOString()),
  };
}

function orderFromRow(row: Row): OrderRecord {
  const record: OrderRecord = {
    id: str(row.id),
    customerName: str(row.customer_name),
    email: str(row.email),
    phone: str(row.phone),
    templateId: optNum(row.template_id) ?? null,
    packageName: str(row.package_name),
    status: str(row.status, 'pending') as OrderRecord['status'],
    total: num(row.total),
    date: str(row.date),
    notes: str(row.notes),
  };
  const paid = optNum(row.paid);
  if (paid !== undefined) record.paid = paid;
  if (row.paid_at != null) record.paidAt = str(row.paid_at);
  if (row.checkout_token != null) record.checkoutToken = str(row.checkout_token);
  if (row.payment_status != null) record.paymentStatus = str(row.payment_status) as OrderRecord['paymentStatus'];
  if (row.proof_path != null) record.proofPath = str(row.proof_path);
  if (row.proof_uploaded_at != null) record.proofUploadedAt = str(row.proof_uploaded_at);
  if (row.invitation_id != null) record.invitationId = optNum(row.invitation_id) ?? null;
  if (row.activated_at != null) record.activatedAt = str(row.activated_at);
  return record;
}

function customerFromRow(row: Row): CustomerRecord {
  return {
    id: num(row.id),
    name: str(row.name),
    email: str(row.email),
    phone: str(row.phone),
    joined: str(row.joined),
  };
}

function userFromRow(row: Row): UserRecord {
  return {
    id: num(row.id),
    name: str(row.name),
    email: str(row.email),
    role: str(row.role, 'viewer') as UserRecord['role'],
    status: str(row.status, 'active') as UserRecord['status'],
    lastLogin: str(row.last_login),
  };
}

function settingsFromRow(row: Row): SettingsRecord {
  return {
    siteName: str(row.site_name),
    tagline: str(row.tagline),
    description: str(row.description),
    logo: str(row.logo),
    whatsapp: str(row.whatsapp),
    instagram: str(row.instagram),
    email: str(row.email),
    address: str(row.address),
    bankName: str(row.bank_name),
    bankAccountNumber: str(row.bank_account_number),
    bankAccountHolder: str(row.bank_account_holder),
    announcement: str(row.announcement),
    announcementEnabled: Boolean(row.announcement_enabled),
    seoTitle: str(row.seo_title),
    seoDescription: str(row.seo_description),
    seoKeywords: str(row.seo_keywords),
    footerText: str(row.footer_text),
    primaryColor: str(row.primary_color),
    accentColor: str(row.accent_color),
  };
}

/* -------------------------------------------------------------------------- */
/* Record aplikasi -> payload snapshot                                         */
/* -------------------------------------------------------------------------- */

function isoOrNull(value: string | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function isoOrNow(value: string | undefined): string {
  return isoOrNull(value) || new Date().toISOString();
}

/** Snapshot lengkap dipakai baik untuk menyimpan dari dashboard maupun untuk seed. */
export function toSitePayload(db: Database) {
  return {
    categories: db.categories.map((category, index) => ({
      id: String(category.id),
      name: category.name,
      slug: category.slug,
      tagline: category.tagline,
      description: category.description,
      accent: category.accent,
      cover: category.cover,
      sort_order: index,
      count: category.count,
    })),
    pages: db.pages.map((page) => ({
      id: page.id,
      slug: page.slug,
      route: page.route,
      label: page.label,
      title: page.title,
      description: page.description,
      category: page.category,
      sort_order: page.order ?? 0,
      template_name: page.templateName,
      file: page.file,
      css: page.css,
      thumb: page.thumb,
      status: page.status,
      kind: page.kind,
      price: page.price ?? null,
      price_compare: page.priceCompare ?? null,
      content_html: page.contentHtml ?? null,
      hidden_section_ids: page.hiddenSectionIds ?? [],
      text_overrides: page.textOverrides ?? {},
      image_overrides: page.imageOverrides ?? {},
      link_overrides: page.linkOverrides ?? {},
      extra_html: page.extraHtml ?? null,
      views: page.views ?? 0,
      updated_at: isoOrNow(page.updatedAt),
    })),
    media: db.media.map((item, index) => ({
      id: item.id,
      name: item.name,
      url: item.url,
      type: item.type,
      folder: item.folder,
      size: item.size,
      sort_order: index,
      created_at: isoOrNow(item.createdAt),
    })),
    orders: db.orders.map((order, index) => ({
      id: order.id,
      customer_name: order.customerName,
      email: order.email,
      phone: order.phone,
      template_id: order.templateId,
      package_name: order.packageName,
      status: order.status,
      total: order.total,
      paid: order.paid ?? null,
      paid_at: order.paidAt || null,
      date: order.date,
      notes: order.notes ?? '',
      sort_order: index,
    })),
    customers: db.customers.map((item, index) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      joined: item.joined,
      sort_order: index,
    })),
    users: db.users.map((item, index) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      role: item.role,
      status: item.status,
      last_login: isoOrNull(item.lastLogin),
      sort_order: index,
    })),
    settings: {
      site_name: db.settings.siteName,
      tagline: db.settings.tagline,
      description: db.settings.description,
      logo: db.settings.logo,
      whatsapp: db.settings.whatsapp,
      instagram: db.settings.instagram,
      email: db.settings.email,
      address: db.settings.address,
      bank_name: db.settings.bankName,
      bank_account_number: db.settings.bankAccountNumber,
      bank_account_holder: db.settings.bankAccountHolder,
      announcement: db.settings.announcement,
      announcement_enabled: db.settings.announcementEnabled,
      seo_title: db.settings.seoTitle,
      seo_description: db.settings.seoDescription,
      seo_keywords: db.settings.seoKeywords,
      footer_text: db.settings.footerText,
      primary_color: db.settings.primaryColor,
      accent_color: db.settings.accentColor,
    },
    navigation: db.navigation.map((item, index) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      visible: item.visible,
      sort_order: index,
    })),
    footer: db.footer.map((column, index) => ({
      id: column.id,
      title: column.title,
      sort_order: index,
      links: column.links.map((link, linkIndex) => ({
        label: link.label,
        href: link.href,
        sort_order: linkIndex,
      })),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Baca / tulis ke Supabase                                                    */
/* -------------------------------------------------------------------------- */

function firstError(results: { error: { message: string } | null }[]): string | null {
  const failed = results.find((result) => result.error);
  return failed?.error?.message ?? null;
}

export interface FetchDatabaseOptions {
  /**
   * Ikut ambil tabel bisnis (pesanan, pelanggan, pengguna). Hanya boleh true
   * setelah user login karena RLS menutup tabel tersebut untuk anon.
   */
  includeAdmin?: boolean;
}

/** Ambil data website publik; tabel admin hanya bila diminta. Null bila kosong. */
export async function fetchDatabase(options: FetchDatabaseOptions = {}): Promise<Database | null> {
  if (!supabase) return null;

  const [pages, categories, media, settings, navigation, footerColumns, footerLinks] = await Promise.all([
    supabase.from('pages').select('*').order('sort_order'),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('media').select('*').order('sort_order'),
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('navigation').select('*').order('sort_order'),
    supabase.from('footer_columns').select('*').order('sort_order'),
    supabase.from('footer_links').select('*').order('sort_order'),
  ]);

  const error = firstError([pages, categories, media, settings, navigation, footerColumns, footerLinks]);
  if (error) throw new Error(error);

  const pageRows = (pages.data || []) as Row[];
  if (!pageRows.length) return null;

  let orderRows: Row[] = [];
  let customerRows: Row[] = [];
  let userRows: Row[] = [];
  if (options.includeAdmin) {
    const [orders, customers, users] = await Promise.all([
      supabase.from('orders').select('*').order('sort_order'),
      supabase.from('customers').select('*').order('sort_order'),
      supabase.from('users').select('*').order('sort_order'),
    ]);
    const adminError = firstError([orders, customers, users]);
    if (adminError) throw new Error(adminError);
    orderRows = (orders.data || []) as Row[];
    customerRows = (customers.data || []) as Row[];
    userRows = (users.data || []) as Row[];
  }

  const linkRows = (footerLinks.data || []) as Row[];
  const footer: Database['footer'] = ((footerColumns.data || []) as Row[]).map((column) => ({
    id: str(column.id),
    title: str(column.title),
    links: linkRows
      .filter((link) => str(link.column_id) === str(column.id))
      .map((link) => ({ label: str(link.label), href: str(link.href) })),
  }));

  const navRows = (navigation.data || []) as Row[];
  const navigationItems: NavItem[] = navRows.map((row) => ({
    id: str(row.id),
    label: str(row.label),
    href: str(row.href),
    visible: row.visible !== false,
  }));

  return {
    version: seedDatabase.version,
    pages: pageRows.map(pageFromRow),
    categories: ((categories.data || []) as Row[]).map(categoryFromRow),
    media: ((media.data || []) as Row[]).map(mediaFromRow),
    orders: orderRows.map(orderFromRow),
    customers: customerRows.map(customerFromRow),
    users: userRows.map(userFromRow),
    settings: settings.data ? settingsFromRow(settings.data as Row) : seedDatabase.settings,
    navigation: navigationItems.length ? navigationItems : seedDatabase.navigation,
    footer: footer.length ? footer : seedDatabase.footer,
  };
}

/** True bila browser sudah punya sesi Supabase Auth yang aktif. */
export async function hasSupabaseSession(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

/** Ganti seluruh data dashboard dengan snapshot terbaru dalam satu transaksi. */
export async function saveDatabase(db: Database): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('replace_site_data', { payload: toSitePayload(db) });
  if (error) throw new Error(error.message);
}

/**
 * Simpan perubahan satu undangan saja. Dipakai editor pengantin yang hanya
 * berhak atas halaman miliknya, dan aman dipanggil admin juga.
 */
export async function saveInvitationPage(pageId: number, patch: Record<string, unknown>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('update_invitation_page', { target: pageId, patch });
  if (error) throw new Error(error.message);
}

/** Unggah berkas ke bucket `assets` dan kembalikan URL publiknya. */
export async function uploadAsset(file: Blob, path: string, contentType: string, pageId?: number): Promise<string> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const scopedPath = pageId ? `invitations/${pageId}/${path}` : path;
  const { error } = await supabase.storage.from(ASSET_BUCKET).upload(scopedPath, file, {
    contentType,
    upsert: true,
    cacheControl: '31536000',
  });
  if (error) throw new Error(error.message);
  return `${ASSET_BASE}/${scopedPath}`;
}
