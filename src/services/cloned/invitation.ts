import {
  fetchGuestbook,
  hasGuestbookBackend,
  mergeGuestbookEntry,
  submitGuestbook,
  subscribeGuestbook,
  type GuestbookEntry,
} from '../guestbook';
import type { ClonedPageContext } from './types';

type OpenMessage = (title: string, message: string) => void;

interface StoredWish {
  name: string;
  message: string;
  attendance?: string;
  date: string;
}

const wishesKey = (pageId: number) => `bydreamy.guestbook.${pageId}`;
const MAX_LOCAL = 100;

/**
 * Ucapan lama (sebelum ada backend) masih tersimpan di localStorage. Dipakai
 * sebagai fallback saat Supabase tidak dikonfigurasi atau sedang tidak bisa
 * dihubungi, supaya buku tamu tidak tampil kosong.
 */
function readLocalWishes(pageId: number): GuestbookEntry[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(wishesKey(pageId)) || '[]') as StoredWish[];
    return raw.slice(0, MAX_LOCAL).map((wish, index) => ({
      id: -(index + 1),
      pageId,
      name: wish.name || 'Tamu Undangan',
      message: wish.message || '',
      attendance: wish.attendance || '',
      createdAt: wish.date || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

function normalizeAttendance(value: string): string {
  const text = value.trim();
  if (!text) return '';
  if (/tidak|belum|ragu/i.test(text)) return 'Tidak Hadir';
  if (/hadir/i.test(text)) return 'Hadir';
  return '';
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

/** Render ucapan dengan textContent, bukan innerHTML, karena isinya dari tamu. */
function renderWishes(container: HTMLElement, entries: GuestbookEntry[], note?: string) {
  container.replaceChildren();

  if (note) {
    const meta = document.createElement('p');
    meta.className = 'bydreamy-wishes__note';
    meta.textContent = note;
    container.append(meta);
  }

  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'bydreamy-wishes__empty';
    empty.textContent = 'Belum ada ucapan. Jadilah tamu pertama yang memberi doa dan restu.';
    container.append(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'bydreamy-wishes';

  entries.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'bydreamy-wish';

    const head = document.createElement('div');
    head.className = 'bydreamy-wish__head';

    const name = document.createElement('strong');
    name.textContent = entry.name || 'Tamu Undangan';
    head.append(name);

    if (entry.attendance) {
      const badge = document.createElement('span');
      badge.className = `bydreamy-wish__badge ${entry.attendance === 'Hadir' ? 'is-present' : 'is-absent'}`;
      badge.textContent = entry.attendance;
      head.append(badge);
    }

    const message = document.createElement('p');
    message.textContent = entry.message;

    item.append(head, message);

    const when = formatWhen(entry.createdAt);
    if (when) {
      const time = document.createElement('small');
      time.textContent = when;
      item.append(time);
    }

    list.append(item);
  });

  container.append(list);
  container.scrollTop = 0;
}

function showSuccess(root: HTMLElement, openMessage: OpenMessage, name: string) {
  const success = root.querySelector<HTMLElement>('.custom-sucess-message');
  if (success) {
    success.style.display = 'block';
    window.setTimeout(() => {
      success.style.display = '';
    }, 4500);
    return;
  }
  openMessage('RSVP terkirim', `Terima kasih ${name}, konfirmasi dan ucapan kamu sudah tersimpan.`);
}

export function initInvitation({ page, root, cleanups }: ClonedPageContext, openMessage: OpenMessage) {
  const coverButton = root.querySelector<HTMLElement>('#tombol-buka');
  const openCover = (event: Event) => {
    event.preventDefault();
    const header = root.querySelector<HTMLElement>('#header');
    if (header) header.style.display = 'none';
    root.querySelectorAll<HTMLElement>('.layercover').forEach((element) => {
      element.style.display = 'none';
    });
    root.querySelectorAll<HTMLElement>('.home-title, .invitation-menu').forEach((element) => {
      element.style.display = 'flex';
    });
    document.body.style.overflowY = 'unset';
    document.body.style.overflow = '';
    window.onscroll = null;
    const audio = root.querySelector<HTMLAudioElement>('audio#song, audio');
    audio?.play().catch(() => undefined);
  };

  if (coverButton) {
    coverButton.addEventListener('click', openCover);
    cleanups.push(() => coverButton.removeEventListener('click', openCover));
  }

  // Music control fallback (the original script normally handles this).
  const audioButton = root.querySelector<HTMLElement>('#btn-audio');
  if (audioButton) {
    const toggleAudio = () => {
      const audio = root.querySelector<HTMLAudioElement>('audio#song, audio');
      if (!audio) return;
      if (audio.paused) audio.play().catch(() => undefined);
      else audio.pause();
    };
    audioButton.addEventListener('click', toggleAudio);
    cleanups.push(() => audioButton.removeEventListener('click', toggleAudio));
  }

  const comments = root.querySelector<HTMLElement>('#realtime-comments');
  let entries: GuestbookEntry[] = [];

  if (comments) {
    const local = readLocalWishes(page.id);
    comments.textContent = hasGuestbookBackend ? 'Memuat ucapan…' : '';
    if (!hasGuestbookBackend) {
      renderWishes(comments, local);
    } else {
      // Dengarkan lebih dulu supaya ucapan yang masuk saat fetch tidak terlewat.
      const unsubscribe = subscribeGuestbook(page.id, (entry) => {
        entries = mergeGuestbookEntry(entries, entry);
        if (root.contains(comments)) renderWishes(comments, entries);
      });
      cleanups.push(unsubscribe);

      fetchGuestbook(page.id)
        .then((rows) => {
          entries = rows;
          if (!rows.length && local.length) {
            renderWishes(comments, local, 'Ucapan tersimpan di perangkat ini belum terkirim ke server.');
            return;
          }
          renderWishes(comments, rows);
        })
        .catch(() => {
          renderWishes(
            comments,
            local,
            local.length ? 'Server tidak bisa dihubungi. Menampilkan ucapan yang tersimpan di perangkat ini.' : undefined,
          );
        });
    }
  }

  const forms = Array.from(root.querySelectorAll<HTMLFormElement>('form.elementor-form'));

  /**
   * Template demo membawa skrip WordPress yang menempelkan handler klik pada
   * tombol submit untuk menampilkan "Maaf, halaman ini hanya untuk demo!" dan
   * membatalkan submit. Handler itu berjalan di fase bubble pada tombol, jadi
   * hentikan klik di fase capture pada form agar submit tetap berjalan.
   */
  const guardDemoSubmit = (event: Event) => {
    const form = event.currentTarget as HTMLFormElement;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const control = target.closest<HTMLElement>(
      'button[type="submit"], input[type="submit"], #submit-formRSVP, #symbutton[type="submit"]',
    );
    if (control && form.contains(control)) event.stopPropagation();
  };
  forms.forEach((form) => form.addEventListener('click', guardDemoSubmit, true));
  cleanups.push(() => forms.forEach((form) => form.removeEventListener('click', guardDemoSubmit, true)));

  const onSubmit = async (event: Event) => {
    const form = event.target as HTMLFormElement;
    event.preventDefault();
    event.stopImmediatePropagation();

    const data = new FormData(form);
    const name =
      ((data.get('form_fields[form_namalengkap]') as string) ||
        (data.get('form_fields[nama]') as string) ||
        (data.get('wdp-form-nama') as string) ||
        '').trim() || 'Tamu Undangan';
    const message = (
      (data.get('form_fields[form_ucapan]') as string) ||
      (data.get('wdp-form-pesan') as string) ||
      ''
    ).trim();
    const attendance = normalizeAttendance(
      (data.get('form_fields[form_konfkehadiran]') as string) || (data.get('form_fields[kehadiran]') as string) || '',
    );

    if (name === 'Tamu Undangan' && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Tanpa backend, pertahankan perilaku lama: simpan di perangkat tamu.
    if (!hasGuestbookBackend) {
      try {
        const stored = readLocalWishes(page.id).map((wish) => ({
          name: wish.name,
          message: wish.message,
          attendance: wish.attendance,
          date: wish.createdAt,
        }));
        stored.unshift({ name, message: message || 'Terima kasih atas undangannya.', attendance, date: new Date().toISOString() });
        window.localStorage.setItem(wishesKey(page.id), JSON.stringify(stored.slice(0, MAX_LOCAL)));
        if (comments) renderWishes(comments, readLocalWishes(page.id));
      } catch {
        /* ignore quota errors */
      }
      form.reset();
      showSuccess(root, openMessage, name);
      return;
    }

    const submitButton =
      form.querySelector<HTMLButtonElement>('button[type="submit"]') ||
      form.querySelector<HTMLInputElement>('input[type="submit"]');
    const originalHtml = submitButton?.innerHTML;
    const originalValue = submitButton instanceof HTMLInputElement ? submitButton.value : '';
    if (submitButton) {
      submitButton.disabled = true;
      if (submitButton instanceof HTMLInputElement) submitButton.value = 'Mengirim…';
      else submitButton.textContent = 'Mengirim…';
    }

    try {
      const entry = await submitGuestbook({
        pageId: page.id,
        name,
        message: message || 'Terima kasih atas undangannya.',
        attendance,
      });
      entries = mergeGuestbookEntry(entries, entry);
      if (comments) renderWishes(comments, entries);
      form.reset();
      showSuccess(root, openMessage, name);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const duplicate = /baru saja dikirim/i.test(detail);
      openMessage(
        duplicate ? 'Ucapan sudah terkirim' : 'Ucapan belum terkirim',
        duplicate
          ? 'Ucapan yang sama baru saja masuk. Tunggu sebentar sebelum mengirim lagi.'
          : 'Koneksi ke server terputus. Isian kamu masih ada — periksa jaringan lalu tekan kirim lagi.',
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        if (submitButton instanceof HTMLInputElement) submitButton.value = originalValue;
        else if (originalHtml !== undefined) submitButton.innerHTML = originalHtml;
      }
    }
  };
  forms.forEach((form) => form.addEventListener('submit', onSubmit, true));
  cleanups.push(() => forms.forEach((form) => form.removeEventListener('submit', onSubmit, true)));
}
