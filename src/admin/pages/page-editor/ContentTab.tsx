import { RotateCcw } from 'lucide-react';
import type { PageRecord } from '../../../data/types';
import { Field, Toggle } from '../../ui';

interface ContentTabProps {
  page: PageRecord | undefined;
  useCustomHtml: boolean;
  setUseCustomHtml: (value: boolean) => void;
  customHtml: string;
  setCustomHtml: (value: string) => void;
  extraHtml: string;
  setExtraHtml: (value: string) => void;
}

export function ContentTab({
  page,
  useCustomHtml,
  setUseCustomHtml,
  customHtml,
  setCustomHtml,
  extraHtml,
  setExtraHtml,
}: ContentTabProps) {
  return (
    <div className="adm-stack">
      <div className="adm-note">
        Konten asli halaman dimuat dari file <code>{page?.file || '—'}</code>. Kamu bisa mengedit teks per section pada
        tab <strong>Section &amp; Teks</strong>, atau mengganti seluruh HTML di bawah.
      </div>
      <Toggle
        checked={useCustomHtml}
        label="Gunakan HTML kustom untuk halaman ini"
        onChange={(value) => setUseCustomHtml(value)}
      />
      {useCustomHtml ? (
        <>
          <textarea
            className="adm-textarea adm-textarea--code"
            rows={22}
            value={customHtml}
            onChange={(event) => setCustomHtml(event.target.value)}
            placeholder="<section>…</section>"
          />
          <div className="adm-inline">
            <button
              type="button"
              className="adm-btn adm-btn--ghost adm-btn--sm"
              onClick={() => {
                if (window.confirm('Kembalikan halaman ke konten asli? HTML kustom akan dihapus.')) {
                  setCustomHtml('');
                  setUseCustomHtml(false);
                }
              }}
            >
              <RotateCcw size={14} /> Kembalikan ke konten asli
            </button>
            <span className="adm-muted">{customHtml.length.toLocaleString('id-ID')} karakter</span>
          </div>
        </>
      ) : (
        <p className="adm-muted">Halaman memakai konten asli. Aktifkan sakelar di atas bila ingin menimpa seluruh markup.</p>
      )}

      <Field
        label="Blok HTML tambahan"
        hint="Ditambahkan setelah konten utama. Berguna untuk banner promo atau form baru."
      >
        <textarea
          className="adm-textarea adm-textarea--code"
          rows={6}
          value={extraHtml}
          onChange={(event) => setExtraHtml(event.target.value)}
          placeholder="<section style='padding:48px'>…</section>"
        />
      </Field>
    </div>
  );
}
