import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { useDatabase, updateFooter, updateNavigation } from '../../services/store';
import type { FooterColumn, NavItem } from '../../data/types';
import { PageHeader, Toggle } from '../ui';

const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 999)}`;

export function NavigationPage() {
  const db = useDatabase();
  const [tab, setTab] = useState<'nav' | 'footer'>('nav');
  const [nav, setNav] = useState<NavItem[]>(db.navigation);
  const [footer, setFooter] = useState<FooterColumn[]>(db.footer);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNav(db.navigation);
    setFooter(db.footer);
  }, [db.navigation, db.footer]);

  const moveNav = (index: number, direction: -1 | 1) => {
    const next = [...nav];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setNav(next);
  };

  const moveColumn = (index: number, direction: -1 | 1) => {
    const next = [...footer];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFooter(next);
  };

  const moveLink = (columnIndex: number, linkIndex: number, direction: -1 | 1) => {
    setFooter((current) =>
      current.map((column, index) => {
        if (index !== columnIndex) return column;
        const links = [...column.links];
        const target = linkIndex + direction;
        if (target < 0 || target >= links.length) return column;
        [links[linkIndex], links[target]] = [links[target], links[linkIndex]];
        return { ...column, links };
      }),
    );
  };

  const save = () => {
    updateNavigation(nav);
    updateFooter(footer);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="adm-page">
      <PageHeader
        eyebrow="Website"
        title="Navigasi & Footer"
        description="Atur menu utama website dan tautan pada footer."
        actions={
          <button type="button" className="adm-btn adm-btn--dark" onClick={save}>
            <Save size={15} /> Simpan Perubahan
          </button>
        }
      />

      <div className="adm-tabs adm-tabs--page">
        <button type="button" className={tab === 'nav' ? 'is-active' : undefined} onClick={() => setTab('nav')}>
          Menu Navigasi ({nav.length})
        </button>
        <button type="button" className={tab === 'footer' ? 'is-active' : undefined} onClick={() => setTab('footer')}>
          Footer ({footer.length} kolom)
        </button>
        {saved && <span className="adm-saved">Tersimpan ✓</span>}
      </div>

      {tab === 'nav' && (
        <section className="adm-panel">
          <div className="adm-nav-edit">
            {nav.map((item, index) => (
              <div key={item.id} className="adm-nav-row">
                <span className="adm-nav-row__index">{index + 1}</span>
                <input
                  className="adm-input-plain"
                  value={item.label}
                  onChange={(event) =>
                    setNav((current) => current.map((entry, i) => (i === index ? { ...entry, label: event.target.value } : entry)))
                  }
                  aria-label="Label menu"
                />
                <input
                  className="adm-input-plain"
                  value={item.href}
                  onChange={(event) =>
                    setNav((current) => current.map((entry, i) => (i === index ? { ...entry, href: event.target.value } : entry)))
                  }
                  aria-label="URL menu"
                />
                <Toggle
                  checked={item.visible}
                  label={item.visible ? 'Tampil' : 'Sembunyi'}
                  onChange={(value) =>
                    setNav((current) => current.map((entry, i) => (i === index ? { ...entry, visible: value } : entry)))
                  }
                />
                <div className="adm-actions">
                  <button type="button" onClick={() => moveNav(index, -1)} title="Naikkan" disabled={index === 0}>
                    <ArrowUp size={15} />
                  </button>
                  <button type="button" onClick={() => moveNav(index, 1)} title="Turunkan" disabled={index === nav.length - 1}>
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    className="adm-icon-btn--danger"
                    title="Hapus"
                    onClick={() => setNav((current) => current.filter((_, i) => i !== index))}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="adm-btn adm-btn--ghost adm-btn--sm"
            onClick={() => setNav((current) => [...current, { id: newId('nav'), label: 'Menu Baru', href: '/', visible: true }])}
          >
            <Plus size={14} /> Tambah item menu
          </button>
          <div className="adm-note">
            Menu tampil di header website React (katalog, tentang, dan halaman brand). Halaman hasil clone tetap memakai
            navigasi aslinya agar desain tidak berubah.
          </div>
        </section>
      )}

      {tab === 'footer' && (
        <div className="adm-footer-edit">
          {footer.map((column, columnIndex) => (
            <section key={column.id} className="adm-panel">
              <header className="adm-panel__head">
                <input
                  className="adm-input-plain adm-input-plain--title"
                  value={column.title}
                  onChange={(event) =>
                    setFooter((current) =>
                      current.map((entry, i) => (i === columnIndex ? { ...entry, title: event.target.value } : entry)),
                    )
                  }
                  aria-label="Judul kolom footer"
                />
                <div className="adm-actions">
                  <button type="button" onClick={() => moveColumn(columnIndex, -1)} title="Geser kiri" disabled={columnIndex === 0}>
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveColumn(columnIndex, 1)}
                    title="Geser kanan"
                    disabled={columnIndex === footer.length - 1}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    className="adm-icon-btn--danger"
                    onClick={() => setFooter((current) => current.filter((_, i) => i !== columnIndex))}
                    title="Hapus kolom"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </header>
              <div className="adm-link-list">
                {column.links.map((link, linkIndex) => (
                  <div key={`${column.id}-${linkIndex}`} className="adm-link-row">
                    <input
                      className="adm-input-plain"
                      value={link.label}
                      onChange={(event) =>
                        setFooter((current) =>
                          current.map((entry, i) =>
                            i === columnIndex
                              ? {
                                  ...entry,
                                  links: entry.links.map((item, j) => (j === linkIndex ? { ...item, label: event.target.value } : item)),
                                }
                              : entry,
                          ),
                        )
                      }
                      aria-label="Label tautan"
                    />
                    <input
                      className="adm-input-plain"
                      value={link.href}
                      onChange={(event) =>
                        setFooter((current) =>
                          current.map((entry, i) =>
                            i === columnIndex
                              ? {
                                  ...entry,
                                  links: entry.links.map((item, j) => (j === linkIndex ? { ...item, href: event.target.value } : item)),
                                }
                              : entry,
                          ),
                        )
                      }
                      aria-label="URL tautan"
                    />
                    <div className="adm-actions">
                      <button type="button" onClick={() => moveLink(columnIndex, linkIndex, -1)} disabled={linkIndex === 0} title="Naik">
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveLink(columnIndex, linkIndex, 1)}
                        disabled={linkIndex === column.links.length - 1}
                        title="Turun"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        className="adm-icon-btn--danger"
                        title="Hapus tautan"
                        onClick={() =>
                          setFooter((current) =>
                            current.map((entry, i) =>
                              i === columnIndex ? { ...entry, links: entry.links.filter((_, j) => j !== linkIndex) } : entry,
                            ),
                          )
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="adm-btn adm-btn--ghost adm-btn--sm"
                onClick={() =>
                  setFooter((current) =>
                    current.map((entry, i) =>
                      i === columnIndex ? { ...entry, links: [...entry.links, { label: 'Tautan Baru', href: '/' }] } : entry,
                    ),
                  )
                }
              >
                <Plus size={14} /> Tambah tautan
              </button>
            </section>
          ))}
          <button
            type="button"
            className="adm-btn adm-btn--dark adm-btn--block"
            onClick={() => setFooter((current) => [...current, { id: newId('foot'), title: 'Kolom Baru', links: [] }])}
          >
            <Plus size={15} /> Tambah kolom footer
          </button>
        </div>
      )}
    </div>
  );
}
