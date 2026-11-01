import type { AuditEntry, AuditEventType, DashboardData, ExceptionState, GroupOverviewRow, Notification, Page, Session } from './types';
import { ApiError, call, FINANCE_ROLES, inScope, paginate, toSession, setSessionUserId } from './client';
import { ageBucket } from './invoices';
import { entityOf } from './domain';
import { SEED_COUNTS } from '../mock/seed';

// ----- Session -----
export const login = (userId: string) =>
  call<Session>({ open: true }, (d) => {
    const u = d.users.find((x) => x.id === userId);
    if (!u) throw new ApiError(401, 'BAD_CREDENTIALS');
    if (u.status !== 'ACTIVE') throw new ApiError(401, 'DEACTIVATED');
    setSessionUserId(u.id);
    return toSession(d, u);
  });

export const loginWithPassword = (email: string, password: string) =>
  call<Session>({ open: true }, (d) => {
    const u = d.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || password.length < 8) throw new ApiError(401, 'BAD_CREDENTIALS');
    if (u.status !== 'ACTIVE') throw new ApiError(401, 'DEACTIVATED');
    setSessionUserId(u.id);
    return toSession(d, u);
  });

export const logout = () =>
  call<void>({ open: true, fast: true }, () => {
    setSessionUserId(null);
  });

export const getSession = () =>
  call<Session | null>({ open: true, fast: true }, (d) => {
    try {
      const id = localStorage.getItem('matchpay-proto-v1-session');
      const u = d.users.find((x) => x.id === id && x.status === 'ACTIVE');
      return u ? toSession(d, u) : null;
    } catch {
      return null;
    }
  });

export const listPersonas = () =>
  call<{ id: string; fullName: string; role: Session['role']; entityName: string; approvalLevel: Session['approvalLevel'] }[]>({ open: true, fast: true }, (d) =>
    d.users.filter((u) => u.status === 'ACTIVE' && ['u-alice', 'u-carol', 'u-dan', 'u-fiona', 'u-rowan', 'u-evan', 'u-gina', 'u-dina'].includes(u.id)).map((u) => ({
      id: u.id, fullName: u.fullName, role: u.role, entityName: u.entityId ? entityOf(d, u.entityId).name : d.group.name, approvalLevel: u.approvalLevel,
    })),
  );

// ----- Notifications (SCR-62) -----
const NOTIFY_ROLES = FINANCE_ROLES;

export const listNotifications = (q: { unreadOnly?: boolean } = {}) =>
  call<Notification[]>({ roles: NOTIFY_ROLES }, (d, u) =>
    d.notifications.filter((n) => n.userId === u.id && (!q.unreadOnly || !n.read)).sort((a, b) => b.at.localeCompare(a.at)),
  );

export const getUnreadNotificationCount = () =>
  call<number>({ fast: true }, (d, u) => (NOTIFY_ROLES.includes(u.role) ? d.notifications.filter((n) => n.userId === u.id && !n.read).length : 0));

export const markNotificationRead = (id: string) =>
  call<Notification>({ roles: NOTIFY_ROLES, write: true, fast: true }, (d, u) => {
    const n = d.notifications.find((x) => x.id === id && x.userId === u.id);
    if (!n) throw new ApiError(404, 'NOT_FOUND');
    n.read = true;
    return n;
  });

export const markAllNotificationsRead = () =>
  call<number>({ roles: NOTIFY_ROLES, write: true }, (d, u) => {
    const mine = d.notifications.filter((n) => n.userId === u.id && !n.read);
    mine.forEach((n) => (n.read = true));
    return mine.length;
  });

// ----- Dashboard (SCR-60) -----
export const getDashboard = (q: { period?: string } = {}) =>
  call<DashboardData>({ roles: [...FINANCE_ROLES, 'ENTITY_ADMIN'] }, (d, u) => {
    const period = q.period ?? d.now.slice(0, 7);
    return dashboardFor(d, u.entityId!, period);
  });

function dashboardFor(d: Parameters<typeof entityOf>[0], entityId: string, period: string): DashboardData {
  const inv = d.invoices.filter((i) => i.entityId === entityId && i.receivedAt.slice(0, 7) === period);
  const separated = inv.filter((i) => i.state === 'SEPARATED').length;
  const base = inv.length - separated;
  const touchless = inv.filter((i) => ['IN_BATCH', 'SIGNED', 'SENT', 'PAID'].includes(i.state) && i.processedBy.length === 0 && !i.exception).length;
  const sampled = d.batches.filter((b) => b.entityId === entityId).flatMap((b) => b.sample).filter((s) => s.mark !== null);
  const errors = sampled.filter((s) => s.mark === 'ERROR').length;
  const rate = sampled.length ? (errors / sampled.length) * 100 : 0;
  const exc = d.invoices.filter((i) => i.entityId === entityId && i.state === 'EXCEPTION');
  const states: ExceptionState[] = ['OPEN', 'IN_REVIEW', 'WAITING_FOR_SUPPLIER', 'WAITING_FOR_DATA_FIX', 'WAITING_FOR_DECISION'];
  return {
    period, received: inv.length, touchless, touchlessBase: base, touchlessRate: base ? (touchless / base) * 100 : 0, touchlessValid: rate <= 1,
    misplacementRate: rate, sampled: sampled.length, sampleErrors: errors, openExceptions: exc.length,
    waitingForGoods: d.invoices.filter((i) => i.entityId === entityId && i.state === 'WAITING_FOR_GOODS').length,
    byState: states.map((s) => ({ state: s, count: exc.filter((i) => i.exception?.state === s).length })),
    byAge: (['0-2', '3-7', '7+'] as const).map((b) => ({ bucket: b, count: exc.filter((i) => ageBucket(d as never, i) === b).length })),
  };
}

export const getGroupDashboard = (q: { period?: string } = {}) =>
  call<{ period: string; rows: (DashboardData & { entityId: string; name: string })[] }>({ roles: ['GROUP_ADMIN'] }, (d) => {
    const period = q.period ?? d.now.slice(0, 7);
    return { period, rows: d.entities.map((e) => ({ ...dashboardFor(d, e.id, period), entityId: e.id, name: e.name })) };
  });

// ----- Audit log (SCR-61) -----
export interface AuditQuery {
  from?: string;
  to?: string;
  document?: string;
  eventType?: AuditEventType | '';
  userId?: string;
  page?: number;
  pageSize?: number;
}

export const listAuditEntries = (q: AuditQuery = {}) =>
  call<Page<AuditEntry>>({ roles: ['CHIEF_ACCOUNTANT', 'ENTITY_ADMIN', 'GROUP_ADMIN'] }, (d, u) => {
    let rows = d.audit.filter((a) => (u.role === 'GROUP_ADMIN' ? a.entityId === null : a.entityId === u.entityId));
    if (q.from) rows = rows.filter((a) => a.at.slice(0, 10) >= q.from!);
    if (q.to) rows = rows.filter((a) => a.at.slice(0, 10) <= q.to!);
    if (q.document) rows = rows.filter((a) => a.objectLabel.toLowerCase().includes(q.document!.toLowerCase()));
    if (q.eventType) rows = rows.filter((a) => a.eventType === q.eventType);
    if (q.userId) rows = rows.filter((a) => a.actorId === q.userId);
    rows = [...rows].sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
    return paginate(rows, q.page, q.pageSize);
  });

export const getAuditEntry = (id: string) =>
  call<AuditEntry>({ roles: ['CHIEF_ACCOUNTANT', 'ENTITY_ADMIN', 'GROUP_ADMIN'] }, (d, u) => {
    const a = d.audit.find((x) => x.id === id);
    return inScope(u, a ? { ...a } : undefined);
  });

export const getGroupOverview = () =>
  call<GroupOverviewRow[]>({ roles: ['GROUP_ADMIN'] }, (d) =>
    d.entities.map((e) => {
      const gs = d.gates.filter((g) => g.entityId === e.id);
      return {
        entityId: e.id, name: e.name, taxCode: e.taxCode, openGates: gs.filter((g) => g.state === 'OPEN').length, closedGates: gs.filter((g) => g.state === 'CLOSED').length,
        alerts: gs.filter((g) => g.state === 'OPEN' && g.sampled > 0 && (g.sampleErrors / g.sampled) * 100 > 2).map((g) => ({ supplierName: d.suppliers.find((s) => s.id === g.supplierId)!.name, rate: (g.sampleErrors / g.sampled) * 100, errors: g.sampleErrors, sampled: g.sampled })),
        lastSyncAt: e.lastSyncAt, lastSyncFailed: e.lastSyncFailed,
      };
    }),
  );

/** Demo helper used by the toolbar: counts of the seed data. */
export const seedCounts = SEED_COUNTS;
