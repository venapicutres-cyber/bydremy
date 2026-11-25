import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Heart, Sparkles, ShieldCheck, Users } from 'lucide-react';
import { useDatabase } from '../services/store';
import { assetUrl } from '../utils/assetUrl';
import { portfolioItems } from '../data/portfolio';

export function AboutPage() {
  const db = useDatabase();
  return (
    <div className="about">
      <section className="about-hero">
        <div className="site-container about-hero__inner">
          <div className="about-hero__copy">
            <p className="site-eyebrow">Tentang bydreamy</p>
            <h1>
              Undangan yang terasa <em>seperti kamu.</em>
            </h1>
            <p>
              bydreamy merupakan layanan undangan digital yang berdiri sejak 2021. Menawarkan desain yang eksklusif dan
              minimalis di kelasnya. Rasakan pengalaman sebar undangan dengan mengedepankan kenyamanan dalam satu
              genggaman.
            </p>
            <Link className="site-btn site-btn--dark" to="/katalog">
              Lihat Koleksi Desain <ArrowUpRight size={15} />
            </Link>
          </div>
          <figure className="about-hero__figure">
            <img src={assetUrl('/wp-content/uploads/2025/01/WHY-CHOOSE-US-1024x684.webp')} alt="bydreamy" />
            <figcaption>Est. 2021 · Jakarta, Indonesia</figcaption>
          </figure>
        </div>
      </section>

      <section className="about-stats">
        <div className="site-container about-stats__grid">
          <div>
            <strong>2021</strong>
            <span>Berdiri sejak</span>
          </div>
          <div>
            <strong>{db.pages.filter((item) => item.kind === 'template').length}</strong>
            <span>Desain orisinal</span>
          </div>
          <div>
            <strong>∞</strong>
            <span>Nama tamu</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>Undangan aktif</span>
          </div>
        </div>
      </section>

      <section className="about-why">
        <div className="site-container">
          <div className="about-why__head">
            <p className="site-eyebrow">Why Choose Us?</p>
            <h2>Detail yang dijaga, kenyamanan yang dirancang.</h2>
          </div>
          <div className="about-why__grid">
            <article>
              <ShieldCheck size={22} />
              <h3>Server terbaik</h3>
              <p>
                Menggunakan server terbaik menjadi hal prioritas kami dalam kelancaran mengirimkan undangan.
              </p>
            </article>
            <article>
              <Users size={22} />
              <h3>Unlimited nama tamu</h3>
              <p>Unlimited nama tamu dengan fitur dashboard kirim kit yang mudah digunakan.</p>
            </article>
            <article>
              <Sparkles size={22} />
              <h3>Desain original</h3>
              <p>
                Desain undangan original dari bydreamy, yang disesuaikan dengan tema foto pre-wedding orang-orang
                Indonesia.
              </p>
            </article>
            <article>
              <Heart size={22} />
              <h3>Privasi terjaga</h3>
              <p>Semua data klien kami jaga dan tidak terdaftar dalam pencarian Google.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="about-manifesto">
        <div className="site-container about-manifesto__inner">
          <p className="site-eyebrow">Our Approach</p>
          <h2>
            Segala informasi dalam isi undangan disusun secara sistematis agar mudah terbaca — tanpa kehilangan
            keindahan desainnya.
          </h2>
          <ul>
            <li>
              <Check size={16} /> Desain dikerjakan satu per satu, bukan hasil template generik.
            </li>
            <li>
              <Check size={16} /> Tipografi, ornamen, dan animasi dipilih untuk karakter setiap seri.
            </li>
            <li>
              <Check size={16} /> Konten undangan dapat diperbarui kapan saja lewat dashboard.
            </li>
          </ul>
        </div>
      </section>

      <section className="about-portfolio">
        <div className="site-container">
          <div className="about-portfolio__head">
            <div>
              <p className="site-eyebrow">Portfolio</p>
              <h2>Cerita yang sudah kami bingkai.</h2>
            </div>
            <Link to="/portfolio" className="site-link">
              Lihat portfolio <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="about-portfolio__grid">
            {portfolioItems.map((item, index) => (
              <figure key={item.name} className={index % 5 === 0 ? 'is-tall' : undefined}>
                <img src={item.image} alt={item.name} loading="lazy" />
                <figcaption>{item.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="catalog-cta catalog-cta--light">
        <div className="site-container catalog-cta__inner">
          <p className="site-eyebrow">Mulai dari sini</p>
          <h2>Siap membuat undangan yang terasa personal?</h2>
          <p>Pilih desain, kirim data mempelai, dan tim bydreamy akan menyiapkan undanganmu.</p>
          <a
            className="site-btn site-btn--gold"
            href={`https://api.whatsapp.com/send?phone=${db.settings.whatsapp}`}
            target="_blank"
            rel="noreferrer"
          >
            Konsultasi Gratis
          </a>
        </div>
      </section>
    </div>
  );
}
