import pagesSeed from './generated/pages.json';
import categoriesSeed from './generated/categories.json';
import type {
  CategoryRecord,
  CustomerRecord,
  Database,
  FooterColumn,
  MediaRecord,
  NavItem,
  OrderRecord,
  PageRecord,
  SettingsRecord,
  UserRecord,
} from './types';

const now = '2026-11-04T14:00:26';

// Harga template demo (jual + coret) untuk kartu section "Choose Your Design".
// Nilai awal ini bisa diubah admin per template di editor halaman.
const templatePrices: Record<string, [number, number]> = {
  'demo-heritage-series-utary': [299000, 598000],
  'demo-heritage-series-aruna': [299000, 598000],
  'demo-heritage-series-sandhayu': [299000, 598000],
  'demo-heritage-series-ameera': [249000, 498000],
  'demo-heritage-series-sandhayu-v2': [299000, 598000],
  'demo-heritage-series-aruna-v2': [299000, 598000],
  'demo-watercolor-01-dandelion': [129000, 258000],
  'demo-watercolor-02-alyssum': [129000, 258000],
  'demo-watercolor-03-lotus': [129000, 258000],
  'demo-watercolor-04-bluebell': [129000, 258000],
  'demo-watercolor-05-rainlily': [129000, 258000],
  'demo-premium-10-flara': [199000, 398000],
  'demo-premium-11-kila': [199000, 398000],
  'demo-premium-09-ivanna': [199000, 398000],
  'demo-premium-06-danila-redesign': [199000, 398000],
  'demo-premium-08-beanca': [199000, 398000],
  'demo-premium-07-ariya': [199000, 398000],
  'demo-premium-02': [179000, 358000],
  'demo-premium-04': [179000, 358000],
  'demo-premium-05': [179000, 358000],
  'demo-premium-01': [179000, 358000],
  'demo-premium-03-sage': [179000, 358000],
  'demo-moody-papercut': [129000, 258000],
  'demo-moody-wave': [129000, 258000],
  'demo-moody-sweetpink-fix': [129000, 258000],
};

export const pages: PageRecord[] = (pagesSeed as PageRecord[]).map((page) => {
  const price = templatePrices[page.slug];
  return {
    ...page,
    status: 'published',
    hiddenSectionIds: [],
    updatedAt: now,
    views: 120 + ((page.id * 37) % 4200),
    price: price?.[0],
    priceCompare: price?.[1],
  };
});

export const categories: CategoryRecord[] = categoriesSeed as CategoryRecord[];

export const navigation: NavItem[] = [
  { id: 'nav-home', label: 'Home', href: '/', visible: true },
  { id: 'nav-katalog', label: 'Katalog', href: '/katalog', visible: true },
  { id: 'nav-guestbook', label: 'Digital Guestbook', href: '/digital-guestbook', visible: true },
  { id: 'nav-about', label: 'Tentang', href: '/tentang', visible: true },
  { id: 'nav-contact', label: 'Kontak', href: '/contact-us', visible: true },
];

export const footer: FooterColumn[] = [
  {
    id: 'foot-katalog',
    title: 'Katalog',
    links: [
      { label: 'Semua Template', href: '/katalog' },
      { label: 'Heritage Series', href: '/katalog/heritage' },
      { label: 'Premium Series', href: '/katalog/premium' },
      { label: 'Moody Series', href: '/katalog/moody' },
      { label: 'Watercolor Series', href: '/katalog/watercolor' },
    ],
  },
  {
    id: 'foot-layanan',
    title: 'Layanan',
    links: [
      { label: 'Digital Guestbook', href: '/digital-guestbook' },
      { label: 'Wedding Frame', href: '/wedding-frame' },
      { label: 'Video & Statik', href: '/video-statik' },
      { label: 'Katalog Video', href: '/katalog-video-statik' },
      { label: 'Katalog Buku Tamu', href: '/katalog-buku-tamu-fix' },
    ],
  },
  {
    id: 'foot-perusahaan',
    title: 'bydreamy',
    links: [
      { label: 'Tentang Kami', href: '/tentang' },
      { label: 'Portfolio', href: '/portfolio' },
      { label: 'Kontak', href: '/contact-us' },
      { label: 'Admin Dashboard', href: '/admin' },
    ],
  },
];

export const settings: SettingsRecord = {
  siteName: 'bydreamy',
  tagline: 'Sebar Undangan dalam Genggaman',
  description:
    'Bagikan momen bahagia kamu bersama bydreamy. Solusi mudah sebar undangan pernikahan tanpa ribet, praktis, dan up to date dengan sentuhan digital.',
  logo: '/wp-content/uploads/2026/02/Logo-Invite-Me-150x150.webp',
  whatsapp: '62895406181407',
  instagram: 'https://www.instagram.com/bydreamy/',
  email: 'hello@bydreamy.local',
  address: 'Jakarta, Indonesia',
  bankName: '',
  bankAccountNumber: '',
  bankAccountHolder: '',
  announcement: 'FREE WEDDING REGISTRY & DISC UP TO 50% OFF!',
  announcementEnabled: false,
  seoTitle: 'bydreamy - Sebar Undangan dalam Genggaman',
  seoDescription:
    'Undangan pernikahan digital dengan desain premium, heritage, dan moody. Sebar undangan dalam genggaman, lengkap dengan guestbook, wedding frame, dan video.',
  seoKeywords: 'undangan digital, undangan pernikahan, wedding invitation, bydreamy, guestbook',
  footerText: '© 2026 bydreamy. Seluruh hak cipta dilindungi.',
  primaryColor: '#202020',
  accentColor: '#AD8E70',
};

const mediaUrls: [string, string, string, string][] = [
  ['AMEERA-SLIDE-1.webp', '/wp-content/uploads/2026/02/AMEERA-SLIDE-1.webp', 'images/2026/02', '1.2 MB'],
  ['AMEERA-SLIDE-2.webp', '/wp-content/uploads/2026/02/AMEERA-SLIDE-2.webp', 'images/2026/02', '1.4 MB'],
  ['UTARY-SLIDE-1.webp', '/wp-content/uploads/2026/02/UTARY-SLIDE-1.webp', 'images/2026/02', '980 KB'],
  ['UTARY-SLIDE-2.webp', '/wp-content/uploads/2026/02/UTARY-SLIDE-2.webp', 'images/2026/02', '1.1 MB'],
  ['ARUNA-SLIDE-1.webp', '/wp-content/uploads/2026/02/ARUNA-SLIDE-1.webp', 'images/2026/02', '1.3 MB'],
  ['SANDHAYU-SLIDE-1.webp', '/wp-content/uploads/2026/02/SANDHAYU-SLIDE-1.webp', 'images/2026/02', '1.0 MB'],
  ['PREVIEW_Endless-Love@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Endless-Love@500.webp', 'images/2024/06', '420 KB'],
  ['PREVIEW_Flawless@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Flawless@500.webp', 'images/2024/06', '410 KB'],
  ['PREVIEW_Sage-2@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Sage-2@500.webp', 'images/2024/06', '430 KB'],
  ['PREVIEW_Alyssa@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Alyssa@500.webp', 'images/2024/06', '405 KB'],
  ['PREVIEW_Shakira@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Shakira@500.webp', 'images/2024/06', '415 KB'],
  ['PREVIEW_Danila-2.webp', '/wp-content/uploads/2025/03/PREVIEW_Danila-2.webp', 'images/2025/03', '520 KB'],
  ['PREVIEW_Ariya@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Ariya@500.webp', 'images/2024/06', '390 KB'],
  ['PREVIEW_Beanca-2@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Beanca-2@500.webp', 'images/2024/06', '400 KB'],
  ['PREVIEW_Ivanna-1.webp', '/wp-content/uploads/2024/09/PREVIEW_Ivanna-1.webp', 'images/2024/09', '610 KB'],
  ['PREVIEW_Flara.webp', '/wp-content/uploads/2024/09/PREVIEW_Flara.webp', 'images/2024/09', '600 KB'],
  ['PREVIEW-KATALOG-KILA.webp', '/wp-content/uploads/2025/07/PREVIEW-KATALOG-KILA.webp', 'images/2025/07', '580 KB'],
  ['MOODY-PAPERCUT.webp', '/wp-content/uploads/2024/05/MOODY-PAPERCUT-1024x1024.webp', 'images/2024/05', '310 KB'],
  ['MOODY-WAVE.webp', '/wp-content/uploads/2024/05/MOODY-WAVE-1024x1024.webp', 'images/2024/05', '305 KB'],
  ['MOODY-SWEETPINK.webp', '/wp-content/uploads/2024/05/MOODY-SWEETPINK-1024x1024.webp', 'images/2024/05', '315 KB'],
  ['WHY-CHOOSE-US.webp', '/wp-content/uploads/2025/01/WHY-CHOOSE-US-1024x684.webp', 'images/2025/01', '480 KB'],
  ['bydreamy Logo', '/wp-content/uploads/2026/02/Logo-Invite-Me-150x150.webp', 'brand', '24 KB'],
  ['Portfolio Astri & Ando', '/wp-content/uploads/2026/09/1.-Astri-Ando.webp', 'portfolio/2026', '720 KB'],
  ['Portfolio Felivia & Jordie', '/wp-content/uploads/2026/09/2.-Felivia-Jordie.webp', 'portfolio/2026', '710 KB'],
  ['Portfolio Denise & Farhan', '/wp-content/uploads/2026/09/3.-Denise-Farhan.webp', 'portfolio/2026', '730 KB'],
  ['Portfolio Nida & Maulana', '/wp-content/uploads/2026/09/4.-Nida-Maulana.webp', 'portfolio/2026', '725 KB'],
  ['Portfolio Nisrina & Tito', '/wp-content/uploads/2026/09/5.-Nisrina-Tito.webp', 'portfolio/2026', '740 KB'],
  ['Portfolio Via & Hizkia', '/wp-content/uploads/2026/09/6.-Via-Hizkia-FI.jpg', 'portfolio/2026', '810 KB'],
  ['Portfolio Tasha & Ali', '/wp-content/uploads/2026/09/7.-Tasha-Ali.webp', 'portfolio/2026', '715 KB'],
];

// Font lokal yang dipakai template (WordPress "use any font"), disajikan dari
// public/wp-content/uploads/useanyfont supaya tidak bergantung Google Fonts.
const fontFiles: [string, string][] = [
  ['Belgiano Serif', '8543Belgiano-Serif.woff2'],
  ['Garden Sans', '6976Garden-Sans.woff2'],
  ['Wimberley', '2709Wimberley.woff2'],
  ['Barriecito', '9932Barriecito.woff2'],
  ['Brick Sans', '9409BrickSans.woff2'],
  ['Alverata', '2961Alverata.woff2'],
  ['Alverata Italic', '5762Alverata-Italic.woff2'],
  ['GFS Didot', '2016GFS_Didot.woff2'],
  ['Josefin Sans', '9712josefin-sans.woff2'],
  ['Moontime', '255moontime.woff2'],
  ['The Seasons', '8889The-Seasons-Font.woff2'],
  ['Brittany', '5737brittany.woff2'],
  ['Nostalgic Whispers', '5041NostalgicWhispers.woff2'],
  ['Montserrat', '5493Montserrat.woff2'],
  ['Montserrat Alternate', '4363Montserrat-Alternate.woff2'],
  ['Northwest Family', '1555NORTHWEST-FAMILY.woff2'],
  ['Northwest Bold', '9424NORTHWEST-BOLD.woff2'],
  ['Pristina', '4480Pristina.woff2'],
  ['Awesome Ways', '9461Awesome-Ways-Font.woff2'],
  ['New York Regular', '6105NewYork.woff2'],
  ['New York Light', '9175NewYork.woff2'],
  ['Beatrice Light', '960Beatrice-Light.woff2'],
  ['Myriad Pro Regular', '7459MyriadPro-Regular.woff2'],
  ['Poppins Regular', '8095Poppins-Regular.woff2'],
  ['Sande More', '8762SandeMoreDemo-Regula.woff2'],
  ['Alta', '388Alta.woff2'],
  ['Belleza', '7347Belleza.woff2'],
  ['Anastasia Script', '3607-AnastasiaScript.woff2'],
  ['Jawadwipa', '5493Jawadwipa.woff2'],
  ['Restages', '4968Restages.woff2'],
  ['Roman Capitals', '494Roman-Capitals.woff2'],
  ['Watermint Script', '8675Watermint-Script.woff2'],
  ['Gary Downley Script', '5210Gary-Downley-Script.woff2'],
  ['Moana Rainy', '5199moana-rainy-font.woff2'],
  ['Didot SSV', '8091didot-ssv.woff2'],
  ['Glacial Indifference', '8780glacial-indifference.woff2'],
  ['Aurelia', '5785Aurelia.woff2'],
  ['Neutica Regular', '3858Neutica.woff2'],
  ['Neutica Bold', '1697Neutica.woff2'],
  ['Neutica Medium', '8439Neutica.woff2'],
  ['Mozart', '5128Mozart.woff2'],
  ['Perfect Harmony', '2690Perfect-Harmony.woff2'],
  ['Perfect Harmony Italic', '6645Perfect-Harmony.woff2'],
  ['Angsana Regular', '5403Angsana.woff2'],
  ['Angsana Bold', '9952Angsana.woff2'],
  ['Angsana Bold Italic', '9677Angsana.woff2'],
  ['Angsana Italic', '9641Angsana.woff2'],
  ['Futura Cyrillic Bold', '3000Futura-Cyrillic.woff2'],
  ['Futura Cyrillic Regular', '60Futura-Cyrillic.woff2'],
  ['Futura Cyrillic SemiBold', '6439Futura-Cyrillic.woff2'],
  ['Futura Cyrillic ExtraBold', '4223Futura-Cyrillic.woff2'],
  ['Futura Cyrillic Light', '9669Futura-Cyrillic.woff2'],
  ['Futura Cyrillic Medium', '2434Futura-Cyrillic.woff2'],
  ['Gabriola', '1704Gabriola.woff2'],
  ['Thirsty Script', '8246Thirsty-Script-Regul.woff2'],
  ['Wasted Vindey', '5445Wasted-Vindey.woff2'],
  ['Richardson Script', '4930Richardson-Script.woff2'],
];

export const media: MediaRecord[] = [
  ...mediaUrls.map(([name, url, folder, size], idx) => ({
    id: idx + 1,
    name,
    url,
    type: 'image' as const,
    folder,
    size,
    createdAt: now,
  })),
  ...fontFiles.map(([name, file], idx) => ({
    id: mediaUrls.length + idx + 1,
    name,
    url: `/wp-content/uploads/useanyfont/${file}`,
    type: 'font' as const,
    folder: 'fonts/useanyfont',
    size: '—',
    createdAt: now,
  })),
];

export const orders: OrderRecord[] = [
  ['ATT-2401', 'Astri Prameswari', 'astri@example.com', '081234567890', 324486, 'Premium Duo', 'completed', 499000, '2026-10-02'],
  ['ATT-2402', 'Felivia Jordie', 'felivia@example.com', '081234567891', 162067, 'Signature', 'completed', 899000, '2026-10-05'],
  ['ATT-2403', 'Denise Farhan', 'denise@example.com', '081234567892', 17655, 'Premium', 'in_progress', 399000, '2026-10-11'],
  ['ATT-2404', 'Nida Maulana', 'nida@example.com', '081234567893', 9014, 'Moody', 'paid', 299000, '2026-10-14'],
  ['ATT-2405', 'Nisrina Tito', 'nisrina@example.com', '081234567894', 736, 'Premium Duo', 'pending', 499000, '2026-10-18'],
  ['ATT-2406', 'Via Hizkia', 'via@example.com', '081234567895', 324502, 'Heritage', 'paid', 349000, '2026-10-21'],
  ['ATT-2407', 'Tasha Ali', 'tasha@example.com', '081234567896', 322220, 'Signature', 'completed', 899000, '2026-10-24'],
  ['ATT-2408', 'Raka Pradana', 'raka@example.com', '081234567897', 10755, 'Watercolor', 'cancelled', 249000, '2026-10-27'],
  ['ATT-2409', 'Sekar Ayu', 'sekar@example.com', '081234567898', 287480, 'Premium', 'pending', 399000, '2026-10-30'],
  ['ATT-2410', 'Bagas Naila', 'bagas@example.com', '081234567899', 324524, 'Heritage', 'in_progress', 349000, '2026-11-01'],
].map(([id, name, email, phone, templateId, packageName, status, total, date], idx) => ({
  id: id as string,
  customerName: name as string,
  email: email as string,
  phone: phone as string,
  templateId: templateId as number,
  packageName: packageName as string,
  status: status as OrderRecord['status'],
  total: total as number,
  date: date as string,
  notes: idx % 3 === 0 ? 'Request revisi nama mempelai.' : '',
}));

export const customers: CustomerRecord[] = orders.map((order, idx) => ({
  id: idx + 1,
  name: order.customerName,
  email: order.email,
  phone: order.phone,
  joined: order.date,
}));

export const users: UserRecord[] = [
  { id: 1, name: 'Admin bydreamy', email: 'admin@bydreamy.local', role: 'admin', status: 'active', lastLogin: '2026-11-19T08:12:00' },
  { id: 2, name: 'Rani Editor', email: 'rani@bydreamy.local', role: 'editor', status: 'active', lastLogin: '2026-11-18T16:40:00' },
  { id: 3, name: 'Dimas Content', email: 'dimas@bydreamy.local', role: 'editor', status: 'active', lastLogin: '2026-11-17T11:05:00' },
  { id: 4, name: 'Sari Viewer', email: 'sari@bydreamy.local', role: 'viewer', status: 'inactive', lastLogin: '2026-10-29T09:30:00' },
];

export const seedDatabase: Database = {
  version: 3,
  pages,
  categories,
  media,
  orders,
  customers,
  users,
  settings,
  navigation,
  footer,
};
