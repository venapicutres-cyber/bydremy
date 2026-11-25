import type { ReactNode } from 'react';

export function StatusPill({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s+/g, '-');
  return <span className={`adm-pill adm-pill--${key}`}>{status}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="adm-empty">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  meta,
  icon,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  meta?: string;
  icon?: ReactNode;
  tone?: 'default' | 'gold' | 'green' | 'red';
}) {
  return (
    <article className={`adm-stat adm-stat--${tone}`}>
      <div className="adm-stat__top">
        <span>{label}</span>
        {icon && <span className="adm-stat__icon">{icon}</span>}
      </div>
      <strong>{value}</strong>
      {meta && <small>{meta}</small>}
    </article>
  );
}
