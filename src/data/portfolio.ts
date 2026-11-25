import { assetUrl } from '../utils/assetUrl';

export const portfolioItems = [
  { image: '/wp-content/uploads/2026/09/1.-Astri-Ando.webp', name: 'Astri & Ando' },
  { image: '/wp-content/uploads/2026/09/2.-Felivia-Jordie.webp', name: 'Felivia & Jordie' },
  { image: '/wp-content/uploads/2026/09/3.-Denise-Farhan.webp', name: 'Denise & Farhan' },
  { image: '/wp-content/uploads/2026/09/4.-Nida-Maulana.webp', name: 'Nida & Maulana' },
  { image: '/wp-content/uploads/2026/09/5.-Nisrina-Tito.webp', name: 'Nisrina & Tito' },
  { image: '/wp-content/uploads/2026/09/6.-Via-Hizkia-FI.jpg', name: 'Via & Hizkia' },
  { image: '/wp-content/uploads/2026/09/7.-Tasha-Ali.webp', name: 'Tasha & Ali' },
].map((item) => ({ ...item, image: assetUrl(item.image) }));
