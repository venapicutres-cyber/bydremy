import { useEffect, useMemo, useState } from 'react';
import { Check, Clipboard, MessageCircle, Users } from 'lucide-react';
import { whatsappLink } from '../utils/nota';

interface GreetingTemplate {
  id: string;
  label: string;
  message: string;
}

const TEMPLATES: GreetingTemplate[] = [
  {
    id: 'hangat',
    label: 'Hangat',
    message: [
      "Assalamu'alaikum wr. wb.",
      '',
      'Semoga Bapak/Ibu/Saudara/i senantiasa sehat dan dilimpahi berkah.',
      '',
      'Dengan penuh syukur kami mengundang:',
      '',
      '{daftar}',
      '',
      'untuk hadir dan mendoakan kami di hari bahagia kami.',
      '',
      'Atas kehadiran dan doanya kami ucapkan terima kasih.',
      '',
      "Wassalamu'alaikum wr. wb.",
    ].join('\n'),
  },
  {
    id: 'singkat',
    label: 'Singkat',
    message: [
      'Halo semuanya! 💍',
      '',
      'Kami dengan bahagia mengundang kalian ke acara pernikahan kami:',
      '',
      '{daftar}',
      '',
      'Jangan lupa hadir ya, kami tunggu kehadiran kalian! ✨',
    ].join('\n'),
  },
  {
    id: 'formal',
    label: 'Formal',
    message: [
      "Assalamu'alaikum wr. wb.",
      '',
      'Dengan hormat,',
      '',
      'Kami mengundang Bapak/Ibu/Saudara/i yang tersebut di bawah ini untuk menghadiri acara pernikahan kami:',
      '',
      '{daftar}',
      '',
      'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu berkenan hadir.',
      '',
      "Wassalamu'alaikum wr. wb.",
    ].join('\n'),
  },
  {
    id: 'doa',
    label: 'Doa & Berkah',
    message: [
      "Assalamu'alaikum wr. wb.",
      '',
      'Semoga Allah senantiasa menjaga langkah kita semua.',
      '',
      'Kami sampaikan undangan hangat kepada:',
      '',
      '{daftar}',
      '',
      'Semoga kebersamaan ini menjadi awal dari banyak hal baik. Aamiin.',
      '',
      'Jazakallah khairan. 🌿',
    ].join('\n'),
  },
];

export function ShareWaPage() {
  const [namesInput, setNamesInput] = useState('');
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [message, setMessage] = useState(TEMPLATES[0].message);
  const [copied, setCopied] = useState(false);

  const names = useMemo(
    () => namesInput.split(/\r?\n/).map((name) => name.trim()).filter(Boolean),
    [namesInput],
  );
  const daftar = names.length ? names.map((name) => `• ${name}`).join('\n') : '{daftar}';
  const composed = useMemo(() => {
    if (!message.includes('{daftar}')) return `${message.trim()}\n\n${daftar}`.trim();
    return message.replace('{daftar}', daftar);
  }, [message, daftar]);

  const shareHref = names.length ? whatsappLink('', composed) : '';
  const canAct = names.length > 0;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  function chooseTemplate(next: GreetingTemplate) {
    setTemplateId(next.id);
    setMessage(next.message);
  }

  async function copyMessage() {
    if (!canAct) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(composed);
      } else {
        throw new Error('Clipboard API tidak tersedia');
      }
    } catch {
      const helper = document.createElement('textarea');
      helper.value = composed;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      document.body.removeChild(helper);
    }
    setCopied(true);
  }

  return (
    <div className="share-wa">
      <section className="share-wa__hero">
        <div className="site-container">
          <p className="site-eyebrow">Bagikan ucapan</p>
          <h1>Sebar ucapan ke WhatsApp, <em>sekali klik.</em></h1>
          <p>
            Tulis daftar nama tamu satu per baris, pilih template ucapan, lalu bagikan seluruh pesan
            melalui tombol WhatsApp. Teksnya bisa Anda edit sebelum dibagikan.
          </p>
        </div>
      </section>

      <section className="share-wa__body">
        <div className="site-container share-wa__grid">
          <div className="share-wa-card">
            <div className="share-wa-card__head">
              <h2>Daftar tamu</h2>
              <span className="share-wa-badge"><Users size={13} /> {names.length} nama</span>
            </div>
            <p className="share-wa-card__hint">Satu nama per baris. Baris kosong diabaikan.</p>
            <label className="share-wa-label" htmlFor="share-wa-names">Nama tamu</label>
            <textarea
              id="share-wa-names"
              className="share-wa-textarea share-wa-textarea--names"
              value={namesInput}
              onChange={(event) => setNamesInput(event.target.value)}
              placeholder={'Angelina Risa Gramida\nRaka Pradana\nNida Maulana'}
              spellCheck={false}
            />
            <p className="share-wa-count">
              {canAct
                ? `${names.length} nama siap dimasukkan ke dalam pesan.`
                : 'Belum ada nama. Tambahkan minimal satu nama untuk mengaktifkan tombol bagikan.'}
            </p>

            <div className="share-wa-divider" />

            <span className="share-wa-label">Template ucapan</span>
            <div className="share-wa-templates" role="group" aria-label="Pilih template ucapan">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`share-wa-chip${template.id === templateId ? ' is-active' : ''}`}
                  aria-pressed={template.id === templateId}
                  onClick={() => chooseTemplate(template)}
                >
                  {template.label}
                </button>
              ))}
            </div>

            <label className="share-wa-label" htmlFor="share-wa-message">Teks pesan</label>
            <textarea
              id="share-wa-message"
              className="share-wa-textarea share-wa-textarea--message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              spellCheck={false}
            />
            <p className="share-wa-count">
              Gunakan <code>{'{daftar}'}</code> untuk menaruh posisi daftar nama dalam pesan.
            </p>
          </div>

          <div className="share-wa-card">
            <div className="share-wa-card__head">
              <h2>Preview pesan</h2>
              <span className="share-wa-badge">{composed.length} karakter</span>
            </div>
            <p className="share-wa-card__hint">Inilah teks yang akan dibagikan ke WhatsApp.</p>
            <div className="share-wa-preview" aria-live="polite">{composed}</div>

            <div className="share-wa-actions">
              <a
                className={`site-btn site-btn--gold${canAct ? '' : ' is-disabled'}`}
                href={shareHref || undefined}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!canAct}
                tabIndex={canAct ? undefined : -1}
                onClick={(event) => { if (!canAct) event.preventDefault(); }}
              >
                <MessageCircle size={15} /> Bagikan ke WhatsApp
              </a>
              <button
                type="button"
                className="site-btn site-btn--ghost"
                onClick={copyMessage}
                disabled={!canAct}
              >
                {copied ? <Check size={15} /> : <Clipboard size={15} />}
                {copied ? 'Tersalin' : 'Salin teks'}
              </button>
            </div>
            <p className="share-wa-footnote">
              Tombol membuka WhatsApp dengan pesan sudah terisi. Pilih kontak atau grup tujuan lalu kirim.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
