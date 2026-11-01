import type { Db, Role, User, Session, Id } from './types';
import { commit, getDb, logAudit, SESSION_KEY, subscribe } from '../mock/db';

export class ApiError extends Error {
  status: number;
  code: string;
  params: Record<string, string | number>;
  constructor(status: number, code: string, params: Record<string, string | number> = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.params = params;
  }
}

// ----- Forced page state (demo toolbar) -----
export type ForcedState = 'none' | 'loading' | 'empty' | 'server-error' | 'ai-error' | 'conflict';
let forced: ForcedState = 'none';
const forcedListeners = new Set<() => void>();
export const getForced = (): ForcedState => forced;
export const setForced = (s: ForcedState): void => {
  forced = s;
  forcedListeners.forEach((l) => l());
};
export const subscribeForced = (l: () => void): (() => void) => {
  forcedListeners.add(l);
  return () => forcedListeners.delete(l);
};

// ----- Session = the selected persona -----
export const getSessionUserId = (): Id | null => {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};
export const setSessionUserId = (id: Id | null): void => {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  sessionListeners.forEach((l) => l());
};
const sessionListeners = new Set<() => void>();
export const subscribeSession = (l: () => void): (() => void) => {
  sessionListeners.add(l);
  return () => sessionListeners.delete(l);
};
export { subscribe as subscribeDb };

export const toSession = (d: Db, u: User): Session => ({
  userId: u.id,
  fullName: u.fullName,
  role: u.role,
  entityId: u.entityId,
  entityName: u.entityId ? d.entities.find((e) => e.id === u.entityId)?.name ?? '' : d.group.name,
  approvalLevel: u.approvalLevel,
});

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const latency = () => 200 + Math.floor(Math.random() * 300);

interface CallOpts {
  /** Roles that may call. Omit for any signed-in user. */
  roles?: Role[];
  /** A change: runs inside commit() and may be refused with 409 in the forced conflict state. */
  write?: boolean;
  /** No session needed. */
  open?: boolean;
  /** Skip the latency (used by cheap lookups). */
  fast?: boolean;
}

/** Wrap one mock operation: latency, session, role, forced states. */
export async function call<T>(opts: CallOpts, fn: (d: Db, u: User) => T): Promise<T> {
  if (!opts.fast) await sleep(latency());
  const d = getDb();
  let user: User | undefined;
  if (!opts.open) {
    const id = getSessionUserId();
    user = d.users.find((u) => u.id === id);
    if (!user) throw new ApiError(401, 'UNAUTHENTICATED');
    if (user.status !== 'ACTIVE') throw new ApiError(401, 'DEACTIVATED');
    if (opts.roles && !opts.roles.includes(user.role)) {
      commit((db) =>
        logAudit(db, { entityId: user!.entityId, hand: 'SYSTEM', eventType: 'ACCESS_DENIED', objectType: 'SESSION', objectId: user!.id, objectLabel: user!.fullName, event: { code: 'EV_ACCESS_DENIED' }, actorName: user!.fullName, actorId: user!.id }),
      );
      throw new ApiError(403, 'FORBIDDEN');
    }
  }
  if (forced === 'server-error' && !opts.write) throw new ApiError(500, 'SERVER_ERROR');
  if (forced === 'conflict' && opts.write) throw new ApiError(409, 'CONFLICT');
  const u = user as User;
  return opts.write ? commit((db) => fn(db, u)) : fn(d, u);
}

// ----- Shared guards -----
/** Entity scope (BR-09): a record of another entity looks like it does not exist. */
export function inScope<T extends { entityId: Id | null }>(u: User, rec: T | undefined): T {
  if (!rec || (u.entityId && rec.entityId !== u.entityId)) throw new ApiError(404, 'NOT_FOUND');
  return rec;
}

export function paginate<T>(rows: T[], page = 1, pageSize = 50): { items: T[]; total: number; page: number; pageSize: number } {
  const start = (page - 1) * pageSize;
  return { items: rows.slice(start, start + pageSize), total: rows.length, page, pageSize };
}

export const FINANCE_ROLES: Role[] = ['AP_ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'PAYMENT_APPROVER'];
export const AP: Role[] = ['AP_ACCOUNTANT'];
