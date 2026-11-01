// Domain rules shared by the mock operations: BR-03 levels, BR-33/34/35 transitions, helpers.
import type { ApprovalLevel, Batch, Db, Invoice, PaymentRequest, User, Id, Coded } from './types';
import { ApiError } from './client';
import { logAudit, nextSeq, notify, pad } from '../mock/db';
import { MOCK_TEXT, periodLabel } from '../mock/labels';

export const entityOf = (d: Db, id: Id) => d.entities.find((e) => e.id === id)!;
export const supplierName = (d: Db, id: Id | null) => (id ? d.suppliers.find((s) => s.id === id)?.name ?? '' : '');
export const userName = (d: Db, id: Id | null | undefined) => (id ? d.users.find((u) => u.id === id)?.fullName ?? '' : '');

/** BR-03: the approval level a total needs. */
export function levelFor(d: Db, entityId: Id, total: number): ApprovalLevel {
  const m = d.matrices.find((x) => x.entityId === entityId);
  const tier = m?.tiers.find((t) => total >= t.from && (t.upTo === null || total < t.upTo));
  return tier?.level ?? (total >= 50_000_000 ? 'CFO' : 'DEPARTMENT_HEAD');
}

export const isDueSoon = (d: Db, due: string): boolean => {
  const diff = (Date.parse(due) - Date.parse(d.now.slice(0, 10))) / 86_400_000;
  return diff >= 0 && diff <= 7;
};

/** BR-37: refuse a change made on an outdated view. */
export function checkVersion(current: number, given?: number): void {
  if (given !== undefined && given !== current) throw new ApiError(409, 'STALE_VERSION');
}

export function findInvoice(d: Db, id: Id): Invoice {
  const inv = d.invoices.find((i) => i.id === id);
  if (!inv) throw new ApiError(404, 'NOT_FOUND');
  return inv;
}

export function findInvoiceFor(d: Db, u: User, id: Id): Invoice {
  const inv = findInvoice(d, id);
  if (u.entityId && inv.entityId !== u.entityId) throw new ApiError(404, 'NOT_FOUND');
  return inv;
}

export const bump = (r: { version: number }) => {
  r.version += 1;
};

export function personEvent(d: Db, u: User, inv: Invoice, code: string, params?: Coded['params'], note?: string | null, eventType: 'PERSON_DECISION' | 'SAMPLE_CHECK' = 'PERSON_DECISION') {
  logAudit(d, { entityId: inv.entityId, hand: 'PERSON', actorName: u.fullName, actorId: u.id, eventType, objectType: 'INVOICE', objectId: inv.id, objectLabel: inv.invoiceNumber, event: { code, params }, note });
}
export function ruleEvent(d: Db, inv: Invoice, code: string, params?: Coded['params']) {
  logAudit(d, { entityId: inv.entityId, hand: 'RULE', eventType: 'RULE_DECISION', objectType: 'INVOICE', objectId: inv.id, objectLabel: inv.invoiceNumber, event: { code, params } });
}
export function systemEvent(d: Db, inv: Invoice, code: string, params?: Coded['params']) {
  logAudit(d, { entityId: inv.entityId, hand: 'SYSTEM', eventType: 'RULE_DECISION', objectType: 'INVOICE', objectId: inv.id, objectLabel: inv.invoiceNumber, event: { code, params } });
}


/** The open batch of the entity, created for the next period when none is open (DF-18). */
export function openBatchFor(d: Db, entityId: Id): Batch {
  const open = d.batches.find((b) => b.entityId === entityId && b.state === 'OPEN');
  if (open) return open;
  const periods = d.batches.filter((b) => b.entityId === entityId).map((b) => b.period).sort();
  const last = periods[periods.length - 1] ?? d.now.slice(0, 7);
  const [y, m] = last.split('-').map(Number) as [number, number];
  const next = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1, 2)}`;
  const b: Batch = {
    id: `bat-${entityId}-${next}`, entityId, period: next, label: periodLabel(next), state: 'OPEN', closedAt: null, releasedAt: null, releasedBy: null, preparedBy: null,
    sample: [], selectedWithoutAi: false, expansions: [], reopenedNote: null, version: 1,
  };
  d.batches.push(b);
  return b;
}

export function admitToBatch(d: Db, inv: Invoice, note: Coded = { code: 'NOTE_ADMITTED' }): Batch {
  const b = openBatchFor(d, inv.entityId);
  inv.state = 'IN_BATCH';
  inv.batchId = b.id;
  inv.note = note;
  inv.exception = inv.exception ? { ...inv.exception, state: 'CLOSED', outcome: 'ADMITTED' } : null;
  inv.conditions = inv.conditions.map((c) => (c.result === 'PASS' ? c : { ...c, result: 'PASS', detail: { code: 'C_PASS_RECHECK' } }));
  bump(inv);
  return b;
}

export function newException(d: Db, inv: Invoice, reasons: NonNullable<Invoice['exception']>['reasons']): void {
  inv.state = 'EXCEPTION';
  inv.exception = {
    id: `exc-${pad(nextSeq(d, 'exception'), 3)}`, state: 'OPEN', reasons, openedAt: d.now, takenBy: null, route: null, requiredLevel: null, sentForDecisionAt: null,
    outcome: null, linkedGroup: null, individuallyApproved: false, decisionNote: null,
  };
  inv.batchId = null;
  inv.requestId = null;
  bump(inv);
}

export const requestTotal = (d: Db, r: PaymentRequest): number =>
  r.invoiceIds.reduce((s, id) => s + (d.invoices.find((i) => i.id === id)?.totalAmount ?? 0), 0);

/** Batch state follows its requests (BR-35 B3 to B6). */
export function recomputeBatchState(d: Db, batchId: Id): void {
  const b = d.batches.find((x) => x.id === batchId);
  if (!b || b.state === 'OPEN' || b.state === 'IN_REVIEW') return;
  const rs = d.requests.filter((r) => r.batchId === batchId);
  const live = rs.filter((r) => r.state !== 'CANCELLED');
  if (live.length && live.some((r) => r.state === 'AWAITING_CHIEF_ACCOUNTANT' || r.state === 'AWAITING_PAYMENT_APPROVER')) b.state = 'IN_SIGNING';
  else if (live.length && live.every((r) => r.state === 'PAID')) b.state = 'COMPLETED';
  else if (live.length && live.every((r) => r.state === 'SENT' || r.state === 'PAID')) b.state = 'SENT';
  else b.state = 'SIGNED';
  bump(b);
}

/** BR-35 R5/R6: take one invoice out of its payment request and recompute total, level and signatures. */
export function removeFromRequest(d: Db, inv: Invoice, why: 'REMOVED_BY_SIGNER' | 'WITHDRAWN_BY_AP' | 'SAMPLE_ERROR' | 'CANCELLATION_NOTICE'): PaymentRequest | null {
  const r = d.requests.find((x) => x.id === inv.requestId);
  if (!r) return null;
  r.invoiceIds = r.invoiceIds.filter((id) => id !== inv.id);
  r.removedInvoiceIds.push(inv.id);
  r.total = requestTotal(d, r);
  if (r.invoiceIds.length === 0) {
    r.state = 'CANCELLED';
    r.declineReason = MOCK_TEXT.removedAllLines;
  } else {
    r.level = levelFor(d, r.entityId, r.total);
    if (r.signatures.length) {
      r.signatures = [];
      r.state = 'AWAITING_CHIEF_ACCOUNTANT';
    }
  }
  bump(r);
  void why;
  return r;
}

export function withdrawInvoice(d: Db, inv: Invoice, why: 'WITHDRAWN_BY_AP' | 'SAMPLE_ERROR' | 'REMOVED_BY_SIGNER' | 'CANCELLATION_NOTICE'): PaymentRequest | null {
  const r = removeFromRequest(d, inv, why);
  const batch = d.batches.find((b) => b.id === inv.batchId);
  if (batch) {
    batch.sample = batch.sample.filter((s) => s.invoiceId !== inv.id || s.mark === 'ERROR');
    bump(batch);
  }
  newException(d, inv, [{ code: 'WITHDRAWN_FROM_BATCH', withdrawReason: why }]);
  if (r) recomputeBatchState(d, r.batchId);
  return r;
}

export const chiefOf = (d: Db, entityId: Id): string[] => d.users.filter((u) => u.entityId === entityId && u.role === 'CHIEF_ACCOUNTANT' && u.status === 'ACTIVE').map((u) => u.id);
export const apOf = (d: Db, entityId: Id): string[] => d.users.filter((u) => u.entityId === entityId && u.role === 'AP_ACCOUNTANT' && u.status === 'ACTIVE').map((u) => u.id);
export const approversOf = (d: Db, entityId: Id, level?: ApprovalLevel | null): string[] =>
  d.users.filter((u) => u.entityId === entityId && u.role === 'PAYMENT_APPROVER' && u.status === 'ACTIVE' && (!level || u.approvalLevel === level)).map((u) => u.id);

export { notify };
