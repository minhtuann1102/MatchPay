import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { fmtDate, fmtDateTime, fmtMoney } from '../lib/format';
import { t } from '../i18n/vi';
import { Icon, type IconName } from './Icon';

export const Money = ({ value }: { value: number }) => <span className="nowrap">{fmtMoney(value)}</span>;
export const DateText = ({ value, time }: { value: string | null | undefined; time?: boolean }) => <span className="nowrap">{time ? fmtDateTime(value) : fmtDate(value)}</span>;
export const DueSoon = () => <span className="due-soon"><Icon name="clock" small />{t.common.dueSoon}</span>;

export function Skeleton({ rows = 6, label }: { rows?: number; label?: string }) {
  const widths = [100, 92, 96, 88, 94, 90];
  return (
    <div className="card-b" role="status" aria-busy="true">
      <div className="stack">{Array.from({ length: rows }, (_, i) => <span key={i} className="sk" style={{ width: `${widths[i % widths.length]}%` }} />)}</div>
      <p className="xs muted" style={{ marginTop: 12 }}>{label ?? t.common.loading}</p>
    </div>
  );
}

export function EmptyState({ icon = 'file', title, text, action }: { icon?: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name={icon} /></span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ text, onRetry }: { text?: string; onRetry?: () => void }) {
  return (
    <div className="notice n-err" role="alert" style={{ margin: 16 }}>
      <Icon name="alert" />
      <div className="grow"><b>{text ?? t.errors.LOAD_FAILED}</b><span>{t.errors.LOAD_FAILED_HINT}</span></div>
      {onRetry && <button type="button" className="btn btn-sm" onClick={onRetry}>{t.common.retry}</button>}
    </div>
  );
}

type NoticeKind = 'err' | 'warn' | 'ok' | 'ai' | 'rule' | 'info';
export function Notice({ kind = 'info', icon, title, children, action }: { kind?: NoticeKind; icon?: IconName; title?: string; children?: ReactNode; action?: ReactNode }) {
  const ic: IconName = icon ?? (kind === 'err' || kind === 'warn' ? 'alert' : kind === 'ok' ? 'check' : kind === 'ai' ? 'ai' : kind === 'rule' ? 'rule' : 'info');
  return (
    <div className={`notice n-${kind}`} role={kind === 'err' ? 'alert' : 'status'}>
      <Icon name={ic} />
      <div className="grow">{title && <b>{title}</b>}{children && <span>{children}</span>}</div>
      {action}
    </div>
  );
}

export function Field({ label, htmlFor, hint, error, children, wide }: { label: string; htmlFor: string; hint?: string; error?: string | null; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`field${wide ? ' wide' : ''}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err-msg" id={`${htmlFor}-err`}><Icon name="alert" small />{error}</span>}
    </div>
  );
}

/** Overflow menu (progressive disclosure). Closes on an outside click and on Esc. */
export function Menu({ label, items }: { label?: string; items: { label: string; onClick?: () => void; to?: string; danger?: boolean; disabled?: boolean; separatorBefore?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  const visible = items.filter((i) => i.label);
  if (!visible.length) return null;
  return (
    <div className="menu" ref={ref}>
      <button type="button" className="btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="dots" />
        {label ?? t.common.moreActions}
      </button>
      {open && (
        <div className="menu-list" role="menu">
          {visible.map((it, i) => (
            <div key={i}>
              {it.separatorBefore && <hr />}
              {it.to ? (
                <Link to={it.to} role="menuitem" onClick={() => setOpen(false)}>{it.label}</Link>
              ) : (
                <button type="button" role="menuitem" className={it.danger ? 'danger' : ''} disabled={it.disabled} onClick={() => { setOpen(false); it.onClick?.(); }}>{it.label}</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, meta, actions, readOnly }: { title: string; meta?: ReactNode; actions?: ReactNode; readOnly?: boolean }) {
  return (
    <header className="ph">
      <div className="ph-top">
        <div className="ph-title">
          <h1>{title}</h1>
          {readOnly && <span className="ro-tag"><Icon name="lock" small />{t.common.readOnly}</span>}
        </div>
        {actions && <div className="ph-actions">{actions}</div>}
      </div>
      {meta && <p className="ph-meta">{meta}</p>}
    </header>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string; count?: number; tone?: 'warn' | 'err' }[]; value: T; onChange: (id: T) => void; label: string }) {
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = tabs.findIndex((x) => x.id === value);
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]!;
    onChange(n.id);
    requestAnimationFrame(() => document.getElementById(`tab-${n.id}`)?.focus());
  };
  return (
    <div className="tabs in-card" role="tablist" aria-label={label} onKeyDown={onKey}>
      {tabs.map((x) => (
        <button key={x.id} id={`tab-${x.id}`} className="tab" role="tab" type="button" aria-selected={x.id === value} tabIndex={x.id === value ? 0 : -1} onClick={() => onChange(x.id)}>
          {x.label}
          {x.count !== undefined && <span className={`pill${x.tone ? ` p-${x.tone}` : ''}`}>{x.count}</span>}
        </button>
      ))}
    </div>
  );
}
