import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Breadcrumb, Button, Dropdown, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { CheckCircleFilled, ClockCircleOutlined, EllipsisOutlined, LockOutlined } from '@ant-design/icons';
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

/** The signed line (D-216): a check icon, "signed", the role, and the date and time. Replaces the red seal. */
export function SignedMark({ role, at }: { role: Role; at: string }) {
  return <span className="signed-mark"><CheckCircleFilled aria-hidden="true" /> {t.seal.signed} {'\u00B7'} {t.roles[role]} {'\u00B7'} {fmtDateTime(at)}</span>;
}

/** A small grey count next to a label (tab, nav item). Strong when it marks work to do. Renders nothing while the number is unknown. */
export function Count({ n, strong }: { n: number | undefined; strong?: boolean }) {
  if (n === undefined) return null;
  return <span className={strong ? 'count count-strong' : 'count'}>{n}</span>;
}

export const Money = ({ value }: { value: number }) => <span className="nowrap">{fmtMoney(value)}</span>;
export const DateText = ({ value, time }: { value: string | null | undefined; time?: boolean }) => <span className="nowrap">{time ? fmtDateTime(value) : fmtDate(value)}</span>;
export const DueSoon = () => <Typography.Text className="xs due-soon"><ClockCircleOutlined aria-hidden="true" /> {t.common.dueSoon}</Typography.Text>;

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
    <div className="empty-state">
      <Typography.Text strong>{title}</Typography.Text>
      {text && <Typography.Text type="secondary">{text}</Typography.Text>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
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
