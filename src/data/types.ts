export type PageStatus = 'published' | 'draft';

export interface PageRecord {
  id: number;
  slug: string;
  route: string;
  label: string;
  title: string;
  description: string;
  category: string | null;
  order: number;
  templateName: string | null;
  file: string;
  css: string;
  thumb: string;
  status: PageStatus;
  kind: 'template' | 'home' | 'page';
  /** Harga jual template demo (Rp) yang tampil di section "Choose Your Design". */
  price?: number;
  /** Harga coret / sebelum diskon (Rp) pada kartu template. */
  priceCompare?: number;
  contentHtml?: string;
  hiddenSectionIds?: string[];
  textOverrides?: Record<string, string>;
  imageOverrides?: Record<string, string>;
  /** Override tautan (href asli -> href baru) pada section katalog. */
  linkOverrides?: Record<string, string>;
  extraHtml?: string;
  updatedAt?: string;
  views?: number;
}

export interface CategoryRecord {
  id: string | number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  accent: string;
  cover: string;
  count: number;
}

export interface MediaRecord {
  id: number;
  name: string;
  url: string;
  type: 'image' | 'font' | 'video' | 'audio' | 'document';
  folder: string;
  size: string;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  templateId: number | null;
  packageName: string;
  status: 'pending' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
  total: number;
  /** Jumlah uang yang sudah diterima (DP/angsuran). Kosong = belum ada pembayaran. */
  paid?: number;
  /** Tanggal pembayaran terakhir diterima. */
  paidAt?: string;
  date: string;
  notes?: string;
  /** Field checkout transfer manual; diisi oleh pesanan dari halaman checkout. */
  checkoutToken?: string;
  paymentStatus?: 'unpaid' | 'pending' | 'settlement' | 'failed' | 'expired';
  proofPath?: string;
  proofUploadedAt?: string;
  invitationId?: number | null;
  activatedAt?: string;
}

export interface CustomerRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  joined: string;
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive';
  lastLogin: string;
}

export interface SettingsRecord {
  siteName: string;
  tagline: string;
  description: string;
  logo: string;
  whatsapp: string;
  instagram: string;
  email: string;
  address: string;
  /** Rekening tujuan transfer manual, diisi lewat Pengaturan admin. */
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  announcement: string;
  announcementEnabled: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  footerText: string;
  primaryColor: string;
  accentColor: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: { label: string; href: string }[];
}

export interface Database {
  version: number;
  pages: PageRecord[];
  categories: CategoryRecord[];
  media: MediaRecord[];
  orders: OrderRecord[];
  customers: CustomerRecord[];
  users: UserRecord[];
  settings: SettingsRecord;
  navigation: NavItem[];
  footer: FooterColumn[];
  /** Seed pages removed from the dashboard, so they stay deleted after reload. */
  deletedPageIds?: number[];
  /** Seed media removed from the dashboard, so they stay deleted after reload. */
  deletedMediaIds?: number[];
}
