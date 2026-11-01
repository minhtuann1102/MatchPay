import { useState, type ReactNode } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { NAV } from '../auth/nav';
import { getSessionUserId } from '../api/client';
import * as dec from '../api/decisions';
import * as sign from '../api/signing';
import * as acc from '../api/acceptance';
import * as inv from '../api/invoices';
import * as adm from '../api/admin';
import { useUnreadCount } from '../api/hooks';
import { t } from '../i18n/vi';
import { Icon } from './Icon';
import { DemoToolbar } from './DemoToolbar';

function useNavCounts(): Record<string, number | undefined> {
  const { session } = useAuth();
  const role = session?.role;
  const sid = getSessionUserId();
  const on = (roles: string[]) => !!role && roles.includes(role);
  const needs = useQuery({ queryKey: ['worklistSummary', sid], queryFn: inv.getWorklistSummary, enabled: on(['AP_ACCOUNTANT']) });
  const decisions = useQuery({ queryKey: ['decisions', sid], queryFn: dec.getDecisionQueue, enabled: on(['CHIEF_ACCOUNTANT', 'PAYMENT_APPROVER']) });
  const requests = useQuery({ queryKey: ['requests', sid], queryFn: () => sign.listPaymentRequests(), enabled: on(['CHIEF_ACCOUNTANT', 'PAYMENT_APPROVER']) });
  const acceptance = useQuery({ queryKey: ['acceptance', sid, {}], queryFn: () => acc.listAcceptanceQueue({}), enabled: on(['REQUESTING_DEPARTMENT']) });
  const gates = useQuery({ queryKey: ['gates', sid], queryFn: adm.listGates, enabled: on(['GROUP_ADMIN']) });
  return {
    needs: needs.data?.views.needs,
    decisions: decisions.data?.length,
    signing: requests.data?.filter((r) => r.sign.canSign).length,
    acceptance: acceptance.data?.totalAll,
    gateAlerts: gates.data?.filter((g) => g.alert).length,
  };
}

function Bell() {
  const q = useUnreadCount();
  const n = q.data ?? 0;
  return (
    <NavLink className="bell" to="/notifications" aria-label={n ? t.shell.bellUnread.replace('{n}', String(n)) : t.shell.bell}>
      <Icon name="bell" />
      <span className="btn-label">{t.nav.notifications}</span>
      {n > 0 && <span className="unread-badge" aria-hidden="true">{n}</span>}
    </NavLink>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const counts = useNavCounts();
  const navigate = useNavigate();
  if (!session) return null;
  const items = NAV[session.role];
  const demo = session.role === 'DEMO_OPERATOR';
  const finance = ['AP_ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'PAYMENT_APPROVER'].includes(session.role);
  return (
    <div className="shell">
      <a className="skip-link" href="#main">{t.shell.skip}</a>
      {open && <button type="button" className="scrim" aria-label={t.shell.closeMenu} tabIndex={-1} onClick={() => setOpen(false)} />}
      <aside className={`sidebar${open ? ' open' : ''}`} id="side-nav">
        <div className="brand">
          <span className="brand-name">MatchPay</span>
        </div>
        <div className="side-entity">
          <b>{session.entityName}</b>
          {session.entityTaxCode && <span>{t.shell.mst} {session.entityTaxCode}</span>}
        </div>
        <nav aria-label={t.shell.mainNav}>
          <ul className="nav">
            {items.map((it) => {
              const c = it.badge ? counts[it.badge] : undefined;
              return (
                <li key={it.id}>
                  <NavLink to={it.to} end={it.to === '/group'} onClick={() => setOpen(false)}>
                    <Icon name={it.icon} />
                    <span>{it.label}</span>
                    {c ? <span className="count"><span className="sr">{t.shell.count} </span>{c}</span> : null}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="top-left">
          <button className="menu-btn" type="button" aria-label={t.shell.menu} aria-expanded={open} aria-controls="side-nav" onClick={() => setOpen((o) => !o)}>
            <Icon name="menu" />
            <span>{t.shell.menu}</span>
          </button>
          <div className="top-entity">
            <span className="entity-name">{session.entityName}</span>
            {session.entityTaxCode && <span className="entity-mst">{t.shell.mst} {session.entityTaxCode}</span>}
            {demo && <span className="demo-mark">{t.shell.demoOnly}</span>}
          </div>
          </div>
          <div className="top-user">
            {finance && <Bell />}
            <span className="avatar" aria-hidden="true" title={session.fullName}>{session.fullName.slice(0, 1)}</span>
            <span className="who"><b>{session.fullName}</b>, {t.roles[session.role]}{session.approvalLevel ? ` (${t.approvalLevel[session.approvalLevel]})` : ''}</span>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => { void signOut().then(() => navigate('/login')); }}>
              <Icon name="logout" small />
              <span className="btn-label">{t.shell.logout}</span>
            </button>
          </div>
        </header>
        <main id="main" className="page" tabIndex={-1}>{children}</main>
      </div>
      <DemoToolbar />
    </div>
  );
}

export const HomeLink = ({ to, children }: { to: string; children: ReactNode }) => <Link className="btn btn-primary" to={to}>{children}</Link>;
