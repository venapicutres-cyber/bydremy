import type { ReactNode } from 'react';

export function Field({
  label,
  hint,
  children,
  full,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`adm-field ${full ? 'adm-field--full' : ''}`}>
      <span className="adm-field__label">{label}</span>
      {children}
      {hint && <span className="adm-field__hint">{hint}</span>}
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`adm-toggle ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="adm-toggle__track">
        <span className="adm-toggle__thumb" />
      </span>
      <span>{label}</span>
    </button>
  );
}

export function ConfirmButton({
  onConfirm,
  children,
  className = 'adm-btn adm-btn--danger-ghost',
  message = 'Hapus item ini? Tindakan tidak bisa dibatalkan.',
}: {
  onConfirm: () => void;
  children: ReactNode;
  className?: string;
  message?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (window.confirm(message)) onConfirm();
      }}
    >
      {children}
    </button>
  );
}
