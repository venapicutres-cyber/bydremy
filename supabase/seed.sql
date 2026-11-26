-- Seed data bydreamy, dihasilkan dari src/data/site.ts.
-- Idempoten: baris yang sudah ada tidak ditimpa.

insert into public.categories (id, name, slug, tagline, description, accent, cover, sort_order, count) values
  ('heritage', 'Heritage', 'heritage', 'Klasik, hangat, dan penuh detail', 'Sentuhan warisan Nusantara dengan ornamen, motif, dan tipografi klasik yang dirangkai modern.', '#AD8E70', '/wp-content/uploads/2026/02/AMEERA-SLIDE-2.webp', 0, 6),
  ('moody', 'Moody', 'moody', 'Berani, emosional, tak biasa', 'Palet gelap dan warna berani untuk pasangan yang ingin undangan berbeda dari yang lain.', '#562231', '/wp-content/uploads/2024/05/MOODY-WAVE-1024x1024.webp', 1, 3),
  ('premium', 'Premium', 'premium', 'Mewah, sinematik, berkelas', 'Koleksi signature dengan komposisi sinematik, detail emas, dan pengalaman undangan yang mewah.', '#8D6E44', '/wp-content/uploads/2024/09/PREVIEW_Flara.webp', 2, 11),
  ('watercolor', 'Watercolor', 'watercolor', 'Lembut, artistik, romantis', 'Lukisan cat air dengan nuansa lembut untuk pernikahan yang intim dan puitis.', '#987070', '/wp-content/uploads/2023/05/couple-5657196-min-scaled-1.jpg', 3, 5)
on conflict (id) do nothing;

insert into public.pages (id, slug, route, label, title, description, category, sort_order, template_name, file, css, thumb, status, kind, price, price_compare, content_html, hidden_section_ids, text_overrides, image_overrides, link_overrides, extra_html, views, updated_at) values
  (324486, 'demo-heritage-series-ameera', '/demo-heritage-series-ameera', 'Ameera', 'DEMO: Heritage Series &#8211; Ameera', 'THE WEDDING OF Bagas & Naila “I love you, I am who I am because of you. You are every reason, every hope and every dream. I’ve ever had and no matter what happens to us in the future, every day we are together is the greatest day of my life. I will always be yours.” THE', 'heritage', 1, 'Ameera', '324486.html', 'post-324486.css', '/wp-content/uploads/2026/02/AMEERA-SLIDE-1.webp', 'published', 'template', 249000, 498000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 2502, '2026-11-04T14:00:26'),
  (324494, 'demo-heritage-series-utary', '/demo-heritage-series-utary', 'Utary', 'DEMO: Heritage Series &#8211; Utary', '20 T F 26 Tary & Fachrul May 2025 Tamu Undangan Kami mengundang Anda untuk menghadiriacara pernikahan kami. Buka Undangan QR Check-in THE WEDDING OF TARY & FACHRUL “I love you, I am who I am because of you. You are every reason, every hope and every dream. I’ve ever had and no matter what', 'heritage', 2, 'Utary', '324494.html', 'post-324494.css', '/wp-content/uploads/2026/02/UTARY-SLIDE-1.webp', 'published', 'template', 299000, 598000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 2798, '2026-11-04T14:00:26'),
  (324502, 'demo-heritage-series-sandhayu', '/demo-heritage-series-sandhayu', 'Sandhayu', 'DEMO: Heritage Series &#8211; Sandhayu', 'THE WEDDING OF Angel & Deny “I love you, I am who I am because of you. You are every reason, every hope and every dream. I’ve ever had and no matter what happens to us in the future, every day we are together is the greatest day of my life. I will always be yours.” THE', 'heritage', 3, 'Sandhayu', '324502.html', 'post-324502.css', '/wp-content/uploads/2026/02/SANDHAYU-SLIDE-1.webp', 'published', 'template', 299000, 598000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3094, '2026-11-04T14:00:26'),
  (324522, 'demo-heritage-series-sandhayu-v2', '/demo-heritage-series-sandhayu-v2', 'Sandhayu V2', 'DEMO: Heritage Series &#8211; Sandhayu &#8211; v2', 'THE WEDDING OF Angel & Deny “I love you, I am who I am because of you. You are every reason, every hope and every dream. I’ve ever had and no matter what happens to us in the future, every day we are together is the greatest day of my life. I will always be yours.” THE', 'heritage', 4, 'Sandhayu V2', '324522.html', 'post-324522.css', '/wp-content/uploads/2026/02/SANDHAYU-SLIDE-2.webp', 'published', 'template', 299000, 598000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3834, '2026-11-04T14:00:26'),
  (324524, 'demo-heritage-series-aruna', '/demo-heritage-series-aruna', 'Aruna', 'DEMO: Heritage Series &#8211; Aruna', 'THE WEDDING OF Ila & Fachrul “I love you, I am who I am because of you. You are every reason, every hope and every dream. I’ve ever had and no matter what happens to us in the future, every day we are together is the greatest day of my life. I will always be yours.” THE', 'heritage', 5, 'Aruna', '324524.html', 'post-324524.css', '/wp-content/uploads/2026/02/ARUNA-SLIDE-1.webp', 'published', 'template', 299000, 598000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3908, '2026-11-04T14:00:26'),
  (324548, 'demo-heritage-series-aruna-v2', '/demo-heritage-series-aruna-v2', 'Aruna V2', 'DEMO: Heritage Series &#8211; Aruna &#8211; v2', 'THE WEDDING OF Ila & Fachrul “I love you, I am who I am because of you. You are every reason, every hope and every dream. I’ve ever had and no matter what happens to us in the future, every day we are together is the greatest day of my life. I will always be yours.” THE', 'heritage', 6, 'Aruna V2', '324548.html', 'post-324548.css', '/wp-content/uploads/2026/02/ARUNA-SLIDE-2.webp', 'published', 'template', 299000, 598000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 596, '2026-11-04T14:00:26'),
  (9012, 'demo-moody-papercut', '/demo-moody-papercut', 'Papercut', 'DEMO: Moody Papercut', 'Preview Tema Moody Wave untuk Undangan Website Terbaru dengan nuansa Premium, Modern, Minimalist, dan nyaman diliat dari bydreamy', 'moody', 7, 'Papercut', '9012.html', 'post-9012.css', '/wp-content/uploads/2024/05/MOODY-PAPERCUT-1024x1024.webp', 'published', 'template', 129000, 258000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 1764, '2026-11-04T14:00:26'),
  (10363, 'demo-moody-sweetpink-fix', '/demo-moody-sweetpink-fix', 'Sweetpink', 'DEMO: Moody Sweetpink (Fix)', 'Preview Tema Moody Wave untuk Undangan Website Terbaru dengan nuansa Premium, Modern, Minimalist, dan nyaman diliat dari bydreamy', 'moody', 8, 'Sweetpink', '10363.html', 'post-10363.css', '/wp-content/uploads/2024/05/MOODY-SWEETPINK-1024x1024.webp', 'published', 'template', 129000, 258000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 1351, '2026-11-04T14:00:26'),
  (9014, 'demo-moody-wave', '/demo-moody-wave', 'Wave', 'DEMO: Moody Wave', 'Preview Tema Moody Wave untuk Undangan Website Terbaru dengan nuansa Premium, Modern, Minimalist, dan nyaman diliat dari bydreamy', 'moody', 9, 'Wave', '9014.html', 'post-9014.css', '/wp-content/uploads/2024/05/MOODY-WAVE-1024x1024.webp', 'published', 'template', 129000, 258000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 1838, '2026-11-04T14:00:26'),
  (736, 'demo-premium-01', '/demo-premium-01', 'Endless Love 01', 'DEMO: Premium 01 &#8211; Endless Love', 'Preview Tema Premium Undangan Website Terbaru dengan nuansa Premium, Modern, dan Elegan yang memiliki warna dasar Dark Gold dari bydreamy', 'premium', 10, 'Endless Love 01', '736.html', 'post-736.css', '/wp-content/uploads/2024/06/PREVIEW_Endless-Love@500.webp', 'published', 'template', 179000, 358000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 2152, '2026-11-04T14:00:26'),
  (14622, 'demo-premium-02', '/demo-premium-02', 'Flawless 02', 'DEMO: Premium 02 &#8211; Flawless', 'Preview Tema Premium Undangan Website Terbaru dengan nuansa Premium, Modern, dan Elegan yang memiliki warna dasar Putih Abu-Abu dihiasi efek kaca semidari bydreamy', 'premium', 11, 'Flawless 02', '14622.html', 'post-14622.css', '/wp-content/uploads/2024/06/PREVIEW_Flawless@500.webp', 'published', 'template', 179000, 358000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3534, '2026-11-04T14:00:26'),
  (17655, 'demo-premium-03-sage', '/demo-premium-03-sage', 'Sage 03', 'DEMO: Premium 03 &#8211; Sage', 'Preview Tema Premium Undangan Website Terbaru dengan nuansa Premium, Modern, dan Elegan yang memiliki warna dasar Sage dari bydreamy', 'premium', 12, 'Sage 03', '17655.html', 'post-17655.css', '/wp-content/uploads/2024/06/PREVIEW_Sage-2@500.webp', 'published', 'template', 179000, 358000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 2355, '2026-11-04T14:00:26'),
  (15983, 'demo-premium-04', '/demo-premium-04', 'Alyssa 04', 'DEMO: Premium 04 &#8211; Alyssa', 'Preview Tema Premium Undangan Website Terbaru dengan nuansa Premium, Minimalist, Modern, dan Elegan yang memiliki warna dasar Putih dan coklat', 'premium', 13, 'Alyssa 04', '15983.html', 'post-15983.css', '/wp-content/uploads/2024/06/PREVIEW_Alyssa@500.webp', 'published', 'template', 179000, 358000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3491, '2026-11-04T14:00:26'),
  (26683, 'demo-premium-05', '/demo-premium-05', 'Shakira 05', 'DEMO: Premium 05 &#8211; Shakira', 'Preview Tema Premium Undangan Website Terbaru dengan nuansa Premium, Modern, dan Elegan yang memiliki warna dasar cream dan pink dari bydreamy', 'premium', 14, 'Shakira 05', '26683.html', 'post-26683.css', '/wp-content/uploads/2024/06/PREVIEW_Shakira@500.webp', 'published', 'template', 179000, 358000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 391, '2026-11-04T14:00:26'),
  (287480, 'demo-premium-06-danila-redesign', '/demo-premium-06-danila-redesign', 'Danila Redesign 06', 'DEMO: Premium 06 &#8211; Danila Redesign', 'THE WEDDING OF Dessi & Prabu Minggu, 28 Desember 202x Kepada Yth. Tamu Undangan Tanpa mengurangi rasa hormat,kami mengundang anda untuk menghadiriacara pernikahan kami. BUKA UNDANGAN QR CHECK-IN Personalized for Tamu Undangan CLOSE Home Bride and Groom Wedding Event Gallery RSVP Gift Souvenir Card THE WEDDING OF Dessi & Prabu Minggu, 28 Desember 202x “Dan', 'premium', 15, 'Danila Redesign 06', '287480.html', 'post-287480.css', '/wp-content/uploads/2025/03/PREVIEW_Danila-2.webp', 'published', 'template', 199000, 398000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 2480, '2026-11-04T14:00:26'),
  (54578, 'demo-premium-07-ariya', '/demo-premium-07-ariya', 'Ariya 07', 'DEMO: Premium 07 &#8211; Ariya', 'Preview Tema Premium Undangan Website Terbaru dengan nuansa Premium, Modern, dan Elegan dari bydreamy', 'premium', 16, 'Ariya 07', '54578.html', 'post-54578.css', '/wp-content/uploads/2024/06/PREVIEW_Ariya@500.webp', 'published', 'template', 199000, 398000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3506, '2026-11-04T14:00:26'),
  (58253, 'demo-premium-08-beanca', '/demo-premium-08-beanca', 'Beanca 08', 'DEMO: Premium 08 &#8211; Beanca', 'Preview Tema Premium Undangan Website Terbaru dengan nuansa Premium, Modern, dan Elegan dari bydreamy', 'premium', 17, 'Beanca 08', '58253.html', 'post-58253.css', '/wp-content/uploads/2024/06/PREVIEW_Beanca-2@500.webp', 'published', 'template', 199000, 398000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 881, '2026-11-04T14:00:26'),
  (161634, 'demo-premium-09-ivanna', '/demo-premium-09-ivanna', 'Ivanna 09', 'DEMO: Premium 09 &#8211; Ivanna', 'Preview Tema Premium Undangan Website Terbaru dengan nuansa Premium, Modern, Minimalist, Peacefully, Classy dan Elegant dari bydreamy', 'premium', 18, 'Ivanna 09', '161634.html', 'post-161634.css', '/wp-content/uploads/2024/09/PREVIEW_Ivanna-1.webp', 'published', 'template', 199000, 398000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3978, '2026-11-04T14:00:26'),
  (162067, 'demo-premium-10-flara', '/demo-premium-10-flara', 'Flara 10', 'DEMO: Premium 10 &#8211; Flara', 'THE WEDDING OF FLARA & KELVIN SABTU, 23 SEPTEMBER 2024 THE WEDDING OF FLARA & KELVIN SABTU, 23 SEPTEMBER 2024 Yth. Bapak/Ibu/Saudara/i Tamu Undangan Tanpa mengurangi rasa hormat, kamimengundang anda untuk menghadiriacara pernikahan kami. BUKA UNDANGAN QR CHECK-IN THE WEDDING OF FLARA & KELVIN SABTU, 23 SEPTEMBER 2024 “Two are better than one, because they', 'premium', 19, 'Flara 10', '162067.html', 'post-162067.css', '/wp-content/uploads/2024/09/PREVIEW_Flara.webp', 'published', 'template', 199000, 398000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3199, '2026-11-04T14:00:26'),
  (322220, 'demo-premium-11-kila', '/demo-premium-11-kila', 'Kila 11', 'DEMO: Premium 11 &#8211; Kila', 'Preview Tema Premium Undangan Website Terbaru dengan nuansa Premium, Modern, dan Elegan dari bydreamy', 'premium', 20, 'Kila 11', '322220.html', 'post-322220.css', '/wp-content/uploads/2025/07/PREVIEW-KATALOG-KILA.webp', 'published', 'template', 199000, 398000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 2660, '2026-11-04T14:00:26'),
  (10755, 'demo-watercolor-01-dandelion', '/demo-watercolor-01-dandelion', 'Dandelion 01', 'DEMO: Watercolor 01 &#8211; Dandelion', 'Preview Tema Watercolor Dandelion Undangan Website Terbaru dengan nuansa Premium, Modern, dan Elegan dengan ornamen-ornamen bunga yang cantik menghiasai undangan anda dari bydreamy', 'watercolor', 21, 'Dandelion 01', '10755.html', 'post-10755.css', '/wp-content/uploads/2023/05/pexels-danu-hidayatur-rahman-2802482-scaled-1.jpg', 'published', 'template', 129000, 258000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3255, '2026-11-04T14:00:26'),
  (11323, 'demo-watercolor-02-alyssum', '/demo-watercolor-02-alyssum', 'Alyssum 02', 'DEMO: Watercolor 02 &#8211; Alyssum', 'Preview Tema Watercolor Alyssum Undangan Website Terbaru dengan nuansa Premium, Modern, dan Elegan dengan ornamen-ornamen bunga yang cantik menghiasai undangan anda dari bydreamy', 'watercolor', 22, 'Alyssum 02', '11323.html', 'post-11323.css', '/wp-content/uploads/2023/05/couple-5657196-min-scaled-1.jpg', 'published', 'template', 129000, 258000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3271, '2026-11-04T14:00:26'),
  (11938, 'demo-watercolor-03-lotus', '/demo-watercolor-03-lotus', 'Lotus 03', 'DEMO: Watercolor 03 &#8211; Lotus', 'Preview Tema Watercolor Lotus Undangan Website Terbaru dengan nuansa Premium, Modern, dan Elegan dengan ornamen-ornamen bunga yang cantik menghiasai undangan anda dari bydreamy', 'watercolor', 23, 'Lotus 03', '11938.html', 'post-11938.css', '/wp-content/uploads/2023/05/fahmi-ramadhan-lKKZ5nODio8-unsplash-1-scaled-1.jpg', 'published', 'template', 129000, 258000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 826, '2026-11-04T14:00:26'),
  (12008, 'demo-watercolor-04-bluebell', '/demo-watercolor-04-bluebell', 'Bluebell 04', 'DEMO: Watercolor 04 &#8211; Bluebell', 'Preview Tema Watercolor Bluebell Undangan Website Terbaru dengan nuansa Premium, Modern, dan Elegan dengan ornamen-ornamen bunga yang cantik menghiasai undangan anda dari bydreamy', 'watercolor', 24, 'Bluebell 04', '12008.html', 'post-12008.css', '/wp-content/uploads/2023/05/fahmi-ramadhan-HOYnvRn_qiM-unsplash-scaled-1.jpg', 'published', 'template', 129000, 258000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3416, '2026-11-04T14:00:26'),
  (12058, 'demo-watercolor-05-rainlily', '/demo-watercolor-05-rainlily', 'Rainlily 05', 'DEMO: Watercolor 05 &#8211; Rainlily', 'Preview Tema Watercolor Rainlily Undangan Website Terbaru dengan nuansa Premium, Modern, dan Elegan dengan ornamen-ornamen bunga yang cantik menghiasai undangan anda dari bydreamy', 'watercolor', 25, 'Rainlily 05', '12058.html', 'post-12058.css', '/wp-content/uploads/2023/05/galuh-hari-setiawan-ubxrY1M7cq4-unsplash-scaled-1.jpg', 'published', 'template', 129000, 258000, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 1066, '2026-11-04T14:00:26'),
  (80785, 'sales-page-2024', '/', 'Home', 'Sales Page 2024', 'Bagikan moment bahagia kamu bersama bydreamy. Solusi mudah sebar undangan pernikahan tanpa ribet, praktis, dan Up to Date dengan sentuhan digital!', null, 0, null, '80785.html', 'post-80785.css', '/wp-content/uploads/2025/01/WHY-CHOOSE-US-1024x684.webp', 'published', 'home', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 2965, '2026-11-04T14:00:26'),
  (212745, 'portfolio-bydreamy', '/portfolio-bydreamy', 'Portfolio', 'Sales Page 2024 &#8211; Portfolio Flara &amp; Ivanna', 'Portfolio Silahkan klik Preview untuk melihat detail tampilan HERITAGE PREMIUM MOODY ... UTARY ARUNA SANDHAYU AMEERA Heritage - Utary Adis & Haris PREVIEW SEMI CUSTOM TANPA FOTO Azzara & Fadil PREVIEW SEMI CUSTOM TANPA FOTO Dilla & Lucky PREVIEW Semi Custom TANPA FOTO Audry & Rizzam PREVIEW Semi Custom TANPA FOTO Anin & Dzaki PREVIEW', null, 0, null, '212745.html', 'post-212745.css', '/wp-content/uploads/2026/07/Adis-Haris.webp', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 885, '2026-11-04T14:00:26'),
  (111732, 'portfolio', '/portfolio', 'Portfolio Archive', 'Sales Page 2024 &#8211; Portfolio', 'Sederet Portofolio Digital Web Invitation by bydreamy', null, 0, null, '111732.html', 'post-111732.css', '/wp-content/uploads/2024/06/Bunga-Deradaka-Portofolio@400.webp', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 1404, '2026-11-04T14:00:26'),
  (95093, 'digital-guestbook', '/digital-guestbook', 'Digital Guestbook', 'Sales Page 2024 &#8211; Digital Guestbook', 'Produk Digital Guestbook dari bydreamy', null, 0, null, '95093.html', 'post-95093.css', '/wp-content/uploads/2024/06/GRATIS-KONSULTASI-01-1024x686.webp', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3161, '2026-11-04T14:00:26'),
  (93044, 'video-statik', '/video-statik', 'Video & Statik', 'Sales Page 2024 &#8211; Video &amp; Statik', 'Sederet Tema Undangan Video & Statik dari bydreamy', null, 0, null, '93044.html', 'post-93044.css', '/wp-content/uploads/elementor/thumbs/AW-002-qople7fv0kjkew31dgrmovj3p45kpp5f8tvgx27134.webp', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 2948, '2026-11-04T14:00:26'),
  (94871, 'wedding-frame', '/wedding-frame', 'Wedding Frame', 'Sales Page 2024 &#8211; Wedding Frame', 'Sederet Tema Wedding Frame dari bydreamy', null, 0, null, '94871.html', 'post-94871.css', '/wp-content/uploads/2024/04/PREVIEW-FILTER-UNTUK-KATALOG-04-864x1536.webp', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3347, '2026-11-04T14:00:26'),
  (10671, 'katalog-website', '/katalog-website', 'Katalog Undangan Website', 'Katalog Undangan Website', 'Aneka pilihan desain Undangan Digital Website dari bydreamy', null, 0, null, '10671.html', 'post-10671.css', '/wp-content/uploads/2023/08/BG-MOBILE.jpg', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 147, '2026-11-04T14:00:26'),
  (12993, 'katalog-video-statik', '/katalog-video-statik', 'Katalog Video & Statik', 'Katalog Undangan Video &#038; Statik', 'Aneka pilihan desain Undangan Digital Video & Statik dari bydreamy', null, 0, null, '12993.html', 'post-12993.css', '/wp-content/uploads/2023/08/PREVIEW-VIDEO-AW-2-min.png', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 2061, '2026-11-04T14:00:26'),
  (13031, 'katalog-buku-tamu-fix', '/katalog-buku-tamu-fix', 'Katalog Buku Tamu', 'Katalog Buku Tamu', 'Detail Fitur Aplikasi Buku Tamu Digital dari bydreamy', null, 0, null, '13031.html', 'post-13031.css', '/wp-content/uploads/2023/07/Promo-Banner-Background.png', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 3467, '2026-11-04T14:00:26'),
  (153033, 'contact-us', '/contact-us', 'Contact Us', 'Contact Us', 'bydreamy We provide Minimalist-Elegant Wedding Invitation and Spread Easily! ADMIN WHATSAPP Nama No WhatsApp Tanggal Acara CHAT ADMIN WHATSAPP! OFFICIAL WEBSITE PREWEDDING MOODBOARD TEMPLATE FREE E - BOOK WEDDING PLANNER Jam Operasional SENIN – JU’MAT08.00 – 17.00 WIBSABTU08.00-16.00 WIBMINGGU & TANGGAL MERAH LIBUR (SLOW RESPON) bydreamy bydreamy merupakan layanan undangan digital yang berdiri sejak 2021.', null, 0, null, '153033.html', 'post-153033.css', '', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 741, '2026-11-04T14:00:26'),
  (111735, '404-not-found', '/404-not-found', '404 Not Found', 'Sales Page 2024 &#8211; 404 Page', '404 Halaman Tidak Ditemukan Jika ini adalah link yang anda dapatkan dari rekan/keluarga/teman anda, silahkan hubungi mereka mengenai halaman ini. Namun, jika ini adalah link yang anda dapatkan dari Tim bydreamy, silahkan hubungi Admin terkait masalah ini.bydreamy', null, 0, null, '111735.html', 'post-111735.css', '', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 1515, '2026-11-04T14:00:26')
on conflict (id) do nothing;

insert into public.media (id, name, url, type, folder, size, created_at) values
  (1, 'AMEERA-SLIDE-1.webp', '/wp-content/uploads/2026/02/AMEERA-SLIDE-1.webp', 'image', 'images/2026/02', '1.2 MB', '2026-11-04T14:00:26'),
  (2, 'AMEERA-SLIDE-2.webp', '/wp-content/uploads/2026/02/AMEERA-SLIDE-2.webp', 'image', 'images/2026/02', '1.4 MB', '2026-11-04T14:00:26'),
  (3, 'UTARY-SLIDE-1.webp', '/wp-content/uploads/2026/02/UTARY-SLIDE-1.webp', 'image', 'images/2026/02', '980 KB', '2026-11-04T14:00:26'),
  (4, 'UTARY-SLIDE-2.webp', '/wp-content/uploads/2026/02/UTARY-SLIDE-2.webp', 'image', 'images/2026/02', '1.1 MB', '2026-11-04T14:00:26'),
  (5, 'ARUNA-SLIDE-1.webp', '/wp-content/uploads/2026/02/ARUNA-SLIDE-1.webp', 'image', 'images/2026/02', '1.3 MB', '2026-11-04T14:00:26'),
  (6, 'SANDHAYU-SLIDE-1.webp', '/wp-content/uploads/2026/02/SANDHAYU-SLIDE-1.webp', 'image', 'images/2026/02', '1.0 MB', '2026-11-04T14:00:26'),
  (7, 'PREVIEW_Endless-Love@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Endless-Love@500.webp', 'image', 'images/2024/06', '420 KB', '2026-11-04T14:00:26'),
  (8, 'PREVIEW_Flawless@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Flawless@500.webp', 'image', 'images/2024/06', '410 KB', '2026-11-04T14:00:26'),
  (9, 'PREVIEW_Sage-2@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Sage-2@500.webp', 'image', 'images/2024/06', '430 KB', '2026-11-04T14:00:26'),
  (10, 'PREVIEW_Alyssa@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Alyssa@500.webp', 'image', 'images/2024/06', '405 KB', '2026-11-04T14:00:26'),
  (11, 'PREVIEW_Shakira@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Shakira@500.webp', 'image', 'images/2024/06', '415 KB', '2026-11-04T14:00:26'),
  (12, 'PREVIEW_Danila-2.webp', '/wp-content/uploads/2025/03/PREVIEW_Danila-2.webp', 'image', 'images/2025/03', '520 KB', '2026-11-04T14:00:26'),
  (13, 'PREVIEW_Ariya@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Ariya@500.webp', 'image', 'images/2024/06', '390 KB', '2026-11-04T14:00:26'),
  (14, 'PREVIEW_Beanca-2@500.webp', '/wp-content/uploads/2024/06/PREVIEW_Beanca-2@500.webp', 'image', 'images/2024/06', '400 KB', '2026-11-04T14:00:26'),
  (15, 'PREVIEW_Ivanna-1.webp', '/wp-content/uploads/2024/09/PREVIEW_Ivanna-1.webp', 'image', 'images/2024/09', '610 KB', '2026-11-04T14:00:26'),
  (16, 'PREVIEW_Flara.webp', '/wp-content/uploads/2024/09/PREVIEW_Flara.webp', 'image', 'images/2024/09', '600 KB', '2026-11-04T14:00:26'),
  (17, 'PREVIEW-KATALOG-KILA.webp', '/wp-content/uploads/2025/07/PREVIEW-KATALOG-KILA.webp', 'image', 'images/2025/07', '580 KB', '2026-11-04T14:00:26'),
  (18, 'MOODY-PAPERCUT.webp', '/wp-content/uploads/2024/05/MOODY-PAPERCUT-1024x1024.webp', 'image', 'images/2024/05', '310 KB', '2026-11-04T14:00:26'),
  (19, 'MOODY-WAVE.webp', '/wp-content/uploads/2024/05/MOODY-WAVE-1024x1024.webp', 'image', 'images/2024/05', '305 KB', '2026-11-04T14:00:26'),
  (20, 'MOODY-SWEETPINK.webp', '/wp-content/uploads/2024/05/MOODY-SWEETPINK-1024x1024.webp', 'image', 'images/2024/05', '315 KB', '2026-11-04T14:00:26'),
  (21, 'WHY-CHOOSE-US.webp', '/wp-content/uploads/2025/01/WHY-CHOOSE-US-1024x684.webp', 'image', 'images/2025/01', '480 KB', '2026-11-04T14:00:26'),
  (22, 'bydreamy Logo', '/wp-content/uploads/2026/02/Logo-Invite-Me-150x150.webp', 'image', 'brand', '24 KB', '2026-11-04T14:00:26'),
  (23, 'Portfolio Astri & Ando', '/wp-content/uploads/2026/09/1.-Astri-Ando.webp', 'image', 'portfolio/2026', '720 KB', '2026-11-04T14:00:26'),
  (24, 'Portfolio Felivia & Jordie', '/wp-content/uploads/2026/09/2.-Felivia-Jordie.webp', 'image', 'portfolio/2026', '710 KB', '2026-11-04T14:00:26'),
  (25, 'Portfolio Denise & Farhan', '/wp-content/uploads/2026/09/3.-Denise-Farhan.webp', 'image', 'portfolio/2026', '730 KB', '2026-11-04T14:00:26'),
  (26, 'Portfolio Nida & Maulana', '/wp-content/uploads/2026/09/4.-Nida-Maulana.webp', 'image', 'portfolio/2026', '725 KB', '2026-11-04T14:00:26'),
  (27, 'Portfolio Nisrina & Tito', '/wp-content/uploads/2026/09/5.-Nisrina-Tito.webp', 'image', 'portfolio/2026', '740 KB', '2026-11-04T14:00:26'),
  (28, 'Portfolio Via & Hizkia', '/wp-content/uploads/2026/09/6.-Via-Hizkia-FI.jpg', 'image', 'portfolio/2026', '810 KB', '2026-11-04T14:00:26'),
  (29, 'Portfolio Tasha & Ali', '/wp-content/uploads/2026/09/7.-Tasha-Ali.webp', 'image', 'portfolio/2026', '715 KB', '2026-11-04T14:00:26'),
  (30, 'Belgiano Serif', '/wp-content/uploads/useanyfont/8543Belgiano-Serif.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (31, 'Garden Sans', '/wp-content/uploads/useanyfont/6976Garden-Sans.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (32, 'Wimberley', '/wp-content/uploads/useanyfont/2709Wimberley.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (33, 'Barriecito', '/wp-content/uploads/useanyfont/9932Barriecito.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (34, 'Brick Sans', '/wp-content/uploads/useanyfont/9409BrickSans.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (35, 'Alverata', '/wp-content/uploads/useanyfont/2961Alverata.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (36, 'Alverata Italic', '/wp-content/uploads/useanyfont/5762Alverata-Italic.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (37, 'GFS Didot', '/wp-content/uploads/useanyfont/2016GFS_Didot.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (38, 'Josefin Sans', '/wp-content/uploads/useanyfont/9712josefin-sans.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (39, 'Moontime', '/wp-content/uploads/useanyfont/255moontime.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (40, 'The Seasons', '/wp-content/uploads/useanyfont/8889The-Seasons-Font.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (41, 'Brittany', '/wp-content/uploads/useanyfont/5737brittany.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (42, 'Nostalgic Whispers', '/wp-content/uploads/useanyfont/5041NostalgicWhispers.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (43, 'Montserrat', '/wp-content/uploads/useanyfont/5493Montserrat.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (44, 'Montserrat Alternate', '/wp-content/uploads/useanyfont/4363Montserrat-Alternate.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (45, 'Northwest Family', '/wp-content/uploads/useanyfont/1555NORTHWEST-FAMILY.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (46, 'Northwest Bold', '/wp-content/uploads/useanyfont/9424NORTHWEST-BOLD.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (47, 'Pristina', '/wp-content/uploads/useanyfont/4480Pristina.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (48, 'Awesome Ways', '/wp-content/uploads/useanyfont/9461Awesome-Ways-Font.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (49, 'New York Regular', '/wp-content/uploads/useanyfont/6105NewYork.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (50, 'New York Light', '/wp-content/uploads/useanyfont/9175NewYork.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (51, 'Beatrice Light', '/wp-content/uploads/useanyfont/960Beatrice-Light.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (52, 'Myriad Pro Regular', '/wp-content/uploads/useanyfont/7459MyriadPro-Regular.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (53, 'Poppins Regular', '/wp-content/uploads/useanyfont/8095Poppins-Regular.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (54, 'Sande More', '/wp-content/uploads/useanyfont/8762SandeMoreDemo-Regula.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (55, 'Alta', '/wp-content/uploads/useanyfont/388Alta.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (56, 'Belleza', '/wp-content/uploads/useanyfont/7347Belleza.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (57, 'Anastasia Script', '/wp-content/uploads/useanyfont/3607-AnastasiaScript.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (58, 'Jawadwipa', '/wp-content/uploads/useanyfont/5493Jawadwipa.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (59, 'Restages', '/wp-content/uploads/useanyfont/4968Restages.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (60, 'Roman Capitals', '/wp-content/uploads/useanyfont/494Roman-Capitals.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (61, 'Watermint Script', '/wp-content/uploads/useanyfont/8675Watermint-Script.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (62, 'Gary Downley Script', '/wp-content/uploads/useanyfont/5210Gary-Downley-Script.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (63, 'Moana Rainy', '/wp-content/uploads/useanyfont/5199moana-rainy-font.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (64, 'Didot SSV', '/wp-content/uploads/useanyfont/8091didot-ssv.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (65, 'Glacial Indifference', '/wp-content/uploads/useanyfont/8780glacial-indifference.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (66, 'Aurelia', '/wp-content/uploads/useanyfont/5785Aurelia.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (67, 'Neutica Regular', '/wp-content/uploads/useanyfont/3858Neutica.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (68, 'Neutica Bold', '/wp-content/uploads/useanyfont/1697Neutica.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (69, 'Neutica Medium', '/wp-content/uploads/useanyfont/8439Neutica.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (70, 'Mozart', '/wp-content/uploads/useanyfont/5128Mozart.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (71, 'Perfect Harmony', '/wp-content/uploads/useanyfont/2690Perfect-Harmony.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (72, 'Perfect Harmony Italic', '/wp-content/uploads/useanyfont/6645Perfect-Harmony.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (73, 'Angsana Regular', '/wp-content/uploads/useanyfont/5403Angsana.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (74, 'Angsana Bold', '/wp-content/uploads/useanyfont/9952Angsana.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (75, 'Angsana Bold Italic', '/wp-content/uploads/useanyfont/9677Angsana.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (76, 'Angsana Italic', '/wp-content/uploads/useanyfont/9641Angsana.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (77, 'Futura Cyrillic Bold', '/wp-content/uploads/useanyfont/3000Futura-Cyrillic.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (78, 'Futura Cyrillic Regular', '/wp-content/uploads/useanyfont/60Futura-Cyrillic.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (79, 'Futura Cyrillic SemiBold', '/wp-content/uploads/useanyfont/6439Futura-Cyrillic.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (80, 'Futura Cyrillic ExtraBold', '/wp-content/uploads/useanyfont/4223Futura-Cyrillic.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (81, 'Futura Cyrillic Light', '/wp-content/uploads/useanyfont/9669Futura-Cyrillic.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (82, 'Futura Cyrillic Medium', '/wp-content/uploads/useanyfont/2434Futura-Cyrillic.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (83, 'Gabriola', '/wp-content/uploads/useanyfont/1704Gabriola.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (84, 'Thirsty Script', '/wp-content/uploads/useanyfont/8246Thirsty-Script-Regul.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (85, 'Wasted Vindey', '/wp-content/uploads/useanyfont/5445Wasted-Vindey.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26'),
  (86, 'Richardson Script', '/wp-content/uploads/useanyfont/4930Richardson-Script.woff2', 'font', 'fonts/useanyfont', '—', '2026-11-04T14:00:26')
on conflict (id) do nothing;

insert into public.orders (id, customer_name, email, phone, template_id, package_name, status, total, paid, paid_at, date, notes) values
  ('ATT-2401', 'Astri Prameswari', 'astri@example.com', '081234567890', 324486, 'Premium Duo', 'completed', 499000, null, null, '2026-10-02', 'Request revisi nama mempelai.'),
  ('ATT-2402', 'Felivia Jordie', 'felivia@example.com', '081234567891', 162067, 'Signature', 'completed', 899000, null, null, '2026-10-05', ''),
  ('ATT-2403', 'Denise Farhan', 'denise@example.com', '081234567892', 17655, 'Premium', 'in_progress', 399000, null, null, '2026-10-11', ''),
  ('ATT-2404', 'Nida Maulana', 'nida@example.com', '081234567893', 9014, 'Moody', 'paid', 299000, null, null, '2026-10-14', 'Request revisi nama mempelai.'),
  ('ATT-2405', 'Nisrina Tito', 'nisrina@example.com', '081234567894', 736, 'Premium Duo', 'pending', 499000, null, null, '2026-10-18', ''),
  ('ATT-2406', 'Via Hizkia', 'via@example.com', '081234567895', 324502, 'Heritage', 'paid', 349000, null, null, '2026-10-21', ''),
  ('ATT-2407', 'Tasha Ali', 'tasha@example.com', '081234567896', 322220, 'Signature', 'completed', 899000, null, null, '2026-10-24', 'Request revisi nama mempelai.'),
  ('ATT-2408', 'Raka Pradana', 'raka@example.com', '081234567897', 10755, 'Watercolor', 'cancelled', 249000, null, null, '2026-10-27', ''),
  ('ATT-2409', 'Sekar Ayu', 'sekar@example.com', '081234567898', 287480, 'Premium', 'pending', 399000, null, null, '2026-10-30', ''),
  ('ATT-2410', 'Bagas Naila', 'bagas@example.com', '081234567899', 324524, 'Heritage', 'in_progress', 349000, null, null, '2026-11-01', 'Request revisi nama mempelai.')
on conflict (id) do nothing;

insert into public.customers (id, name, email, phone, joined) values
  (1, 'Astri Prameswari', 'astri@example.com', '081234567890', '2026-10-02'),
  (2, 'Felivia Jordie', 'felivia@example.com', '081234567891', '2026-10-05'),
  (3, 'Denise Farhan', 'denise@example.com', '081234567892', '2026-10-11'),
  (4, 'Nida Maulana', 'nida@example.com', '081234567893', '2026-10-14'),
  (5, 'Nisrina Tito', 'nisrina@example.com', '081234567894', '2026-10-18'),
  (6, 'Via Hizkia', 'via@example.com', '081234567895', '2026-10-21'),
  (7, 'Tasha Ali', 'tasha@example.com', '081234567896', '2026-10-24'),
  (8, 'Raka Pradana', 'raka@example.com', '081234567897', '2026-10-27'),
  (9, 'Sekar Ayu', 'sekar@example.com', '081234567898', '2026-10-30'),
  (10, 'Bagas Naila', 'bagas@example.com', '081234567899', '2026-11-01')
on conflict (id) do nothing;

insert into public.users (id, name, email, role, status, last_login) values
  (1, 'Admin bydreamy', 'admin@bydreamy.local', 'admin', 'active', '2026-11-19T08:12:00'),
  (2, 'Rani Editor', 'rani@bydreamy.local', 'editor', 'active', '2026-11-18T16:40:00'),
  (3, 'Dimas Content', 'dimas@bydreamy.local', 'editor', 'active', '2026-11-17T11:05:00'),
  (4, 'Sari Viewer', 'sari@bydreamy.local', 'viewer', 'inactive', '2026-10-29T09:30:00')
on conflict (id) do nothing;

insert into public.navigation (id, label, href, visible, sort_order) values
  ('nav-home', 'Home', '/', true, 0),
  ('nav-katalog', 'Katalog', '/katalog', true, 1),
  ('nav-portfolio', 'Portfolio', '/portfolio', true, 2),
  ('nav-guestbook', 'Digital Guestbook', '/digital-guestbook', true, 3),
  ('nav-frame', 'Wedding Frame', '/wedding-frame', true, 4),
  ('nav-video', 'Video & Statik', '/video-statik', true, 5),
  ('nav-about', 'Tentang', '/tentang', true, 6),
  ('nav-contact', 'Kontak', '/contact-us', true, 7)
on conflict (id) do nothing;

insert into public.footer_columns (id, title, sort_order) values
  ('foot-katalog', 'Katalog', 0),
  ('foot-layanan', 'Layanan', 1),
  ('foot-perusahaan', 'bydreamy', 2)
on conflict (id) do nothing;

insert into public.footer_links (column_id, label, href, sort_order) values
  ('foot-katalog', 'Semua Template', '/katalog', 0),
  ('foot-katalog', 'Heritage Series', '/katalog/heritage', 1),
  ('foot-katalog', 'Premium Series', '/katalog/premium', 2),
  ('foot-katalog', 'Moody Series', '/katalog/moody', 3),
  ('foot-katalog', 'Watercolor Series', '/katalog/watercolor', 4),
  ('foot-layanan', 'Digital Guestbook', '/digital-guestbook', 0),
  ('foot-layanan', 'Wedding Frame', '/wedding-frame', 1),
  ('foot-layanan', 'Video & Statik', '/video-statik', 2),
  ('foot-layanan', 'Katalog Video', '/katalog-video-statik', 3),
  ('foot-layanan', 'Katalog Buku Tamu', '/katalog-buku-tamu-fix', 4),
  ('foot-perusahaan', 'Tentang Kami', '/tentang', 0),
  ('foot-perusahaan', 'Portfolio', '/portfolio', 1),
  ('foot-perusahaan', 'Kontak', '/contact-us', 2),
  ('foot-perusahaan', 'Admin Dashboard', '/admin', 3)
on conflict do nothing;

insert into public.site_settings (id, site_name, tagline, description, logo, whatsapp, instagram, email, address, announcement, announcement_enabled, seo_title, seo_description, seo_keywords, footer_text, primary_color, accent_color) values
  (1, 'bydreamy', 'Sebar Undangan dalam Genggaman', 'Bagikan momen bahagia kamu bersama bydreamy. Solusi mudah sebar undangan pernikahan tanpa ribet, praktis, dan up to date dengan sentuhan digital.', '/wp-content/uploads/2026/02/Logo-Invite-Me-150x150.webp', '62895406181407', 'https://www.instagram.com/bydreamy/', 'hello@bydreamy.local', 'Jakarta, Indonesia', 'FREE WEDDING REGISTRY & DISC UP TO 50% OFF!', false, 'bydreamy - Sebar Undangan dalam Genggaman', 'Undangan pernikahan digital dengan desain premium, heritage, dan moody. Sebar undangan dalam genggaman, lengkap dengan guestbook, wedding frame, dan video.', 'undangan digital, undangan pernikahan, wedding invitation, bydreamy, guestbook', '© 2026 bydreamy. Seluruh hak cipta dilindungi.', '#202020', '#AD8E70')
on conflict (id) do nothing;

-- Custom portfolio preview pages linked from the home page.
insert into public.pages (id, slug, route, label, title, description, category, sort_order, template_name, file, css, thumb, status, kind, price, price_compare, content_html, hidden_section_ids, text_overrides, image_overrides, link_overrides, extra_html, views, updated_at) values
  (326105, 'astri-ando', '/astri-ando', 'Astri & Ando', 'Astri & Ando · Wedding Invitation', 'Preview undangan digital custom Astri & Ando oleh bydreamy.', null, 0, null, '326105.html', '', '/wp-content/uploads/2026/09/1.-Astri-Ando.webp', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 120, '2026-11-25T13:00:00'),
  (326104, 'felivia-jordie', '/felivia-jordie', 'Felivia & Jordie', 'Felivia & Jordie · Wedding Invitation', 'Preview undangan digital custom Felivia & Jordie oleh bydreamy.', null, 0, null, '326104.html', '', '/wp-content/uploads/2026/09/2.-Felivia-Jordie.webp', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 137, '2026-11-25T13:00:00'),
  (326102, 'denisefarhan', '/denisefarhan', 'Denise & Farhan', 'Denise & Farhan · Wedding Invitation', 'Preview undangan digital custom Denise & Farhan oleh bydreamy.', null, 0, null, '326102.html', '', '/wp-content/uploads/2026/09/3.-Denise-Farhan.webp', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 154, '2026-11-25T13:00:00'),
  (326103, 'nida-maulana', '/nida-maulana', 'Nida & Maulana', 'Nida & Maulana · Wedding Invitation', 'Preview undangan digital custom Nida & Maulana oleh bydreamy.', null, 0, null, '326103.html', '', '/wp-content/uploads/2026/09/4.-Nida-Maulana.webp', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 171, '2026-11-25T13:00:00'),
  (326106, 'nisrina-tito', '/nisrina-tito', 'Nisrina & Tito', 'Nisrina & Tito · Wedding Invitation', 'Preview undangan digital custom Nisrina & Tito oleh bydreamy.', null, 0, null, '326106.html', '', '/wp-content/uploads/2026/09/5.-Nisrina-Tito.webp', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 188, '2026-11-25T13:00:00'),
  (326112, 'via-hizkia', '/via-hizkia', 'Via & Hizkia', 'Via & Hizkia · Wedding Invitation', 'Preview undangan digital custom Via & Hizkia oleh bydreamy.', null, 0, null, '326112.html', '', '/wp-content/uploads/2026/09/6.-Via-Hizkia-FI.jpg', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 205, '2026-11-25T13:00:00'),
  (326107, 'tasha-ali', '/tasha-ali', 'Tasha & Ali', 'Tasha & Ali · Wedding Invitation', 'Preview undangan digital custom Tasha & Ali oleh bydreamy.', null, 0, null, '326107.html', '', '/wp-content/uploads/2026/09/7.-Tasha-Ali.webp', 'published', 'page', null, null, null, '{}'::text[], '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, null, 222, '2026-11-25T13:00:00')
on conflict (id) do nothing;
