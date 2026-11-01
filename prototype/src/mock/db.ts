import type { AuditEntry, Coded, Db, Hand, Notification, AuditEventType } from '../api/types';
import { buildSeed, DEMO_START, SCHEMA_VERSION } from './seed';

export const STORAGE_KEY = 'matchpay-proto-v1';
export const SESSION_KEY = 'matchpay-proto-v1-session';

let db: Db | null = null;
const listeners = new Set<() => void>();

const load = (): Db => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Db;
      if (parsed.schema === SCHEMA_VERSION) return parsed;
    }
  } catch {
    /* fall through to the seed */
  }
  return buildSeed();
};

export const getDb = (): Db => {
  if (!db) {
    db = load();
    persist();
  }
  return db;
};

const persist = (): void => {
  try {
    if (db) localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* storage full or blocked: the in-memory copy keeps working */
  }
};

/** Run a change on the store, save it and tell subscribers. */
export const commit = <T>(fn: (d: Db) => T): T => {
  const d = getDb();
  const out = fn(d);
  persist();
  listeners.forEach((l) => l());
  return out;
};

export const subscribe = (l: () => void): (() => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const resetDemoData = (): void => {
  db = buildSeed();
  persist();
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
};

// ----- Clock: fixed demo time, one minute per change -----
export const nowIso = (): string => getDb().now;
export const tick = (minutes = 1): string => {
  const d = getDb();
  const t = new Date(Date.parse(d.now + 'Z') + minutes * 60_000);
  d.now = t.toISOString().slice(0, 19);
  return d.now;
};
export const today = (): string => getDb().now.slice(0, 10);
export { DEMO_START };

// ----- Sequences -----
export const nextSeq = (d: Db, key: string): number => {
  const n = d.seq[key] ?? 1;
  d.seq[key] = n + 1;
  return n;
};
export const pad = (n: number, w = 4): string => String(n).padStart(w, '0');

// ----- Audit and notifications -----
interface LogOpts {
  entityId: string | null;
  hand: Hand;
  actorName?: string | null;
  actorId?: string | null;
  eventType: AuditEventType;
  objectType: AuditEntry['objectType'];
  objectId: string;
  objectLabel: string;
  event: Coded;
  note?: string | null;
  task?: string;
  model?: string;
}

export const logAudit = (d: Db, o: LogOpts): AuditEntry => {
  const entry: AuditEntry = {
    id: `aud-${pad(nextSeq(d, 'audit'))}`,
    at: d.now,
    entityId: o.entityId,
    hand: o.hand,
    actorName: o.actorName ?? null,
    actorId: o.actorId ?? null,
    eventType: o.eventType,
    objectType: o.objectType,
    objectId: o.objectId,
    objectLabel: o.objectLabel,
    event: o.event,
    note: o.note ?? null,
    task: o.task,
    model: o.model,
  };
  d.audit.push(entry);
  return entry;
};

export const notify = (
  d: Db,
  userIds: string[],
  kind: Notification['kind'],
  objectType: Notification['objectType'],
  objectId: string,
  params: Notification['params'],
): void => {
  for (const userId of userIds) {
    d.notifications.push({ id: `ntf-${pad(nextSeq(d, 'notification'), 3)}`, userId, kind, at: d.now, read: false, objectType, objectId, params });
  }
};
