-- Setiap template yang tampil di katalog harus memiliki harga agar kartu,
-- halaman detail, dan checkout tidak menampilkan "Rp0". Harga awal mengikuti
-- seri masing-masing dan tetap bisa diubah dari Admin → Kelola Harga.

with defaults(slug, price, price_compare) as (
  values
    ('demo-heritage-series-sandhayu-v2', 299000, 598000),
    ('demo-heritage-series-aruna-v2', 299000, 598000),
    ('demo-watercolor-01-dandelion', 129000, 258000),
    ('demo-watercolor-02-alyssum', 129000, 258000),
    ('demo-watercolor-03-lotus', 129000, 258000),
    ('demo-watercolor-04-bluebell', 129000, 258000),
    ('demo-watercolor-05-rainlily', 129000, 258000)
)
update public.pages p
set price = d.price,
    price_compare = d.price_compare
from defaults d
where p.slug = d.slug
  and p.price is null;
