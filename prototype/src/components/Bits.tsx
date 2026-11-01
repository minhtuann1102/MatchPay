import { useId, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Breadcrumb, Button, Dropdown, Empty, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { ClockCircleOutlined, EllipsisOutlined, LockOutlined } from '@ant-design/icons';
import { fmtDate, fmtDateTime, fmtMoney } from '../lib/format';
import { t } from '../i18n/vi';
import type { Role } from '../api/types';

/** An e-invoice number the way it prints: the series (ky hieu) small and muted, then the number in weight 600. */
export function InvNo({ value }: { value: string }) {
  const i = value.indexOf('-');
  if (i < 0) return <span className="invno"><span className="invno-n">{value}</span></span>;
  return <span className="invno"><span className="invno-s">{value.slice(0, i + 1)}</span><span className="invno-n">{value.slice(i + 1)}</span></span>;
}

/** A payment request number: PR- muted, then the number. */
export const ReqNo = InvNo;

/** The company seal (con dau do): red, round, stamped on a request once a person has signed. */
export function SealStamp({ role, at, fresh, small, large }: { role: Role; at: string; fresh?: boolean; small?: boolean; large?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const roleText = t.roles[role].toLocaleUpperCase('vi');
  return (
    <span className={`seal-stamp${small ? ' sm' : ''}${large ? ' lg' : ''}${fresh ? ' fresh' : ''}`} role="img" aria-label={`${t.seal.signed}: ${t.roles[role]}, ${fmtDate(at)}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <path id={`top-${uid}`} d="M 17,60 a 43,43 0 1,1 86,0" />
          <path id={`bot-${uid}`} d="M 13,60 a 47,47 0 0,0 94,0" />
        </defs>
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="3.5" />
        <circle cx="60" cy="60" r="31" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <text fontSize="10.5" fontWeight="700" letterSpacing="0.4" textAnchor="middle"><textPath href={`#top-${uid}`} startOffset="50%">{roleText}</textPath></text>
        <text fontSize="10.5" fontWeight="600" letterSpacing="0.4" textAnchor="middle"><textPath href={`#bot-${uid}`} startOffset="50%">{fmtDate(at)}</textPath></text>
        <text x="60" y="66" fontSize="17" fontWeight="700" textAnchor="middle">{t.seal.signed}</text>
      </svg>
    </span>
  );
}

export const Money = ({ value }: { value: number }) => <span className="nowrap">{fmtMoney(value)}</span>;
export const DateText = ({ value, time }: { value: string | null | undefined; time?: boolean }) => <span className="nowrap">{time ? fmtDateTime(value) : fmtDate(value)}</span>;
export const DueSoon = () => <Tag color="warning" icon={<ClockCircleOutlined />} style={{ marginInlineEnd: 0 }}>{t.common.dueSoon}</Tag>;

/** A notice on a page or in a dialog. `err` is announced as an alert. */
export function Notice({ kind = 'info', title, children, action, icon, className }: { kind?: 'err' | 'warn' | 'ok' | 'info' | 'ai' | 'rule'; title?: ReactNode; children?: ReactNode; action?: ReactNode; icon?: ReactNode; className?: string }) {
  const type = kind === 'err' ? 'error' : kind === 'warn' ? 'warning' : kind === 'ok' ? 'success' : 'info';
  return (
    <Alert
      className={className}
      type={type}
      showIcon
      icon={icon}
      message={title ?? children}
      description={title && children ? children : undefined}
      action={action}
      role={kind === 'err' ? 'alert' : 'status'}
    />
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <Empty className="empty-state" image={Empty.PRESENTED_IMAGE_SIMPLE} description={<><Typography.Text strong>{title}</Typography.Text>{text && <><br /><Typography.Text type="secondary">{text}</Typography.Text></>}</>}>
      {action}
    </Empty>
  );
}

export function ErrorState({ text, onRetry }: { text?: string; onRetry?: () => void }) {
  return (
    <div className="pad">
      <Alert
        type="error"
        showIcon
        role="alert"
        message={text ?? t.errors.LOAD_FAILED}
        description={t.errors.LOAD_FAILED_HINT}
        action={onRetry ? <Button size="small" onClick={onRetry}>{t.common.retry}</Button> : undefined}
      />
    </div>
  );
}

export function MoreMenu({ items, label }: { items: { label: string; onClick?: () => void; to?: string; danger?: boolean; disabled?: boolean; separatorBefore?: boolean }[]; label?: string }) {
  const visible = items.filter((i) => i.label);
  if (!visible.length) return null;
  const menuItems: MenuProps['items'] = visible.flatMap((it, i) => {
    const entry = {
      key: String(i),
      label: it.to ? <Link to={it.to}>{it.label}</Link> : it.label,
      danger: it.danger,
      disabled: it.disabled,
      onClick: () => it.onClick?.(),
    };
    return it.separatorBefore ? [{ type: 'divider' as const, key: `d${i}` }, entry] : [entry];
  });
  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <Button icon={<EllipsisOutlined />}>{label ?? t.common.moreActions}</Button>
    </Dropdown>
  );
}

export function PageHeader({ title, meta, actions, readOnly, crumbs, extra }: {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  readOnly?: boolean;
  crumbs?: { label: ReactNode; to?: string }[];
  extra?: ReactNode;
}) {
  return (
    <header className="ph">
      {crumbs && (
        <Breadcrumb
          className="ph-crumbs"
          items={crumbs.map((c) => ({ title: c.to ? <Link to={c.to}>{c.label}</Link> : c.label }))}
        />
      )}
      <div className="ph-top">
        <div className="ph-title">
          <Typography.Title level={3} style={{ margin: 0 }}>{title}</Typography.Title>
          {readOnly && <Tag icon={<LockOutlined />} style={{ marginInlineEnd: 0 }}>{t.common.readOnly}</Tag>}
          {extra}
        </div>
        {actions && <Space wrap>{actions}</Space>}
      </div>
      {meta && <Typography.Text type="secondary" className="ph-meta">{meta}</Typography.Text>}
    </header>
  );
}
