import type { Delegation, Id, Invoice, PaymentRequest, Signature, User } from './types';
import { ApiError, call, inScope } from './client';
import { apOf, bump, checkVersion, levelFor, notify, recomputeBatchState, removeFromRequest, requestTotal, ruleEvent, supplierName, userName, newException, entityOf, personEvent } from './domain';
import { logAudit } from '../mock/db';

export const REAUTH_CODE = '246810';
const SIGNERS = ['CHIEF_ACCOUNTANT' as const, 'PAYMENT_APPROVER' as const];

export type DelegationState = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'REVOKED';
export const delegationState = (nowDate: string, x: Delegation): DelegationState =>
  x.revokedAt ? 'REVOKED' : nowDate < x.from ? 'SCHEDULED' : nowDate > x.to ? 'ENDED' : 'ACTIVE';

export interface SignCheck {
  canSign: boolean;
  /** Reason code when the signer cannot sign (shown in Vietnamese by the UI). */
  reason: string | null;
  onBehalfOf: string | null;
  /** The request waits for a signer of the other role. */
  visibleOnly: boolean;
}

/** The signing rules of DF-01, BR-03, BR-36 and the delegation (BR-38) for one signer and one request. */
function checkSign(d: Db0, u: User, r: PaymentRequest): SignCheck {
  const today = d.now.slice(0, 10);
  const active = d.delegations.filter((x) => x.entityId === r.entityId && delegationState(today, x) === 'ACTIVE');
  const delegatedAway = active.some((x) => x.delegatorId === u.id);
  const received = active.filter((x) => x.delegateId === u.id).map((x) => d.users.find((y) => y.id === x.delegatorId)!);
  const needs = r.state === 'AWAITING_CHIEF_ACCOUNTANT' ? 'CHIEF_ACCOUNTANT' : r.state === 'AWAITING_PAYMENT_APPROVER' ? 'PAYMENT_APPROVER' : null;
  if (!needs) return { canSign: false, reason: 'NOT_AWAITING', onBehalfOf: null, visibleOnly: false };
  // Own capacity or a delegated one.
  let onBehalfOf: string | null = null;
  const ownFits = u.role === needs && (needs === 'CHIEF_ACCOUNTANT' || u.approvalLevel === r.level);
  let fits = ownFits;
  if (!fits) {
    const del = received.find((x) => x.role === needs && (needs === 'CHIEF_ACCOUNTANT' || x.approvalLevel === r.level));
    if (del) {
      fits = true;
      onBehalfOf = del.fullName;
    }
  }
  if (!fits) {
    if (u.role === 'PAYMENT_APPROVER' && needs === 'CHIEF_ACCOUNTANT') return { canSign: false, reason: 'CHIEF_FIRST', onBehalfOf: null, visibleOnly: true };
    if (u.role === 'PAYMENT_APPROVER' && needs === 'PAYMENT_APPROVER') return { canSign: false, reason: 'WRONG_LEVEL', onBehalfOf: null, visibleOnly: true };
    return { canSign: false, reason: 'WAITING_OTHER', onBehalfOf: null, visibleOnly: true };
  }
  if (ownFits && delegatedAway) return { canSign: false, reason: 'DELEGATED_AWAY', onBehalfOf: null, visibleOnly: false };
  const batch = d.batches.find((b) => b.id === r.batchId);
  if (batch && (batch.preparedBy === u.id || batch.releasedBy === u.id)) return { canSign: false, reason: 'PREPARED_BATCH', onBehalfOf, visibleOnly: false };
  if (r.invoiceIds.some((id) => d.invoices.find((i) => i.id === id)?.processedBy.includes(u.id))) return { canSign: false, reason: 'PROCESSED_INVOICE', onBehalfOf, visibleOnly: false };
  const already = r.signatures.some((s) => s.userId === u.id);
  if (already) return { canSign: false, reason: 'ALREADY_SIGNED', onBehalfOf, visibleOnly: false };
  if (onBehalfOf && r.signatures.some((s) => s.onBehalfOfName === onBehalfOf)) return { canSign: false, reason: 'ALREADY_SIGNED', onBehalfOf, visibleOnly: false };
  return { canSign: true, reason: null, onBehalfOf, visibleOnly: false };
}
type Db0 = Parameters<typeof levelFor>[0];

export interface RequestRow extends PaymentRequest {
  supplierName: string;
  sign: SignCheck;
  batchLabel: string;
  invoiceNumbers: string[];
}

const rowOf = (d: Db0, u: User, r: PaymentRequest): RequestRow => ({
  ...r,
  supplierName: supplierName(d, r.supplierId),
  sign: checkSign(d, u, r),
  batchLabel: d.batches.find((b) => b.id === r.batchId)?.label ?? '',
  invoiceNumbers: r.invoiceIds.map((id) => d.invoices.find((i) => i.id === id)?.invoiceNumber ?? id),
});

export const listPaymentRequests = (q: { state?: string } = {}) =>
  call<RequestRow[]>({ roles: SIGNERS }, (d, u) => {
    let rs = d.requests.filter((r) => r.entityId === u.entityId && (r.state !== 'CANCELLED' || r.signatures.length > 0 || true));
    if (q.state) rs = rs.filter((r) => r.state === q.state);
    return rs.map((r) => rowOf(d, u, r)).sort((a, b) => b.id.localeCompare(a.id));
  });

export interface RequestDetail {
  request: RequestRow;
  invoices: (Invoice & { sampleMark: 'OK' | 'ERROR' | null })[];
  attempts: PaymentRequest['attempts'];
  largeInvoices: string[];
  canResend: boolean;
  delegations: { delegateName: string; delegatorName: string; to: string }[];
  summary: { byEntity: { name: string; total: number }[]; bySupplier: { name: string; total: number }[]; sampleOk: number; sampleTotal: number } | null;
  /** Active delegation given by the signer, shown above their disabled sign control. */
  delegatedUntil: string | null;
}

export const getPaymentRequest = (id: Id) =>
  call<RequestDetail>({ roles: SIGNERS }, (d, u) => {
    const r = inScope(u, d.requests.find((x) => x.id === id));
    const invs = r.invoiceIds.map((iid) => d.invoices.find((i) => i.id === iid)!).filter(Boolean);
    const batch = d.batches.find((b) => b.id === r.batchId);
    const today = d.now.slice(0, 10);
    const given = d.delegations.find((x) => x.delegatorId === u.id && delegationState(today, x) === 'ACTIVE');
    return {
      request: rowOf(d, u, r),
      invoices: invs.map((i) => ({ ...i, sampleMark: batch?.sample.find((s) => s.invoiceId === i.id)?.mark ?? null })),
      attempts: r.attempts,
      largeInvoices: invs.filter((i) => i.totalAmount >= 50_000_000).map((i) => i.invoiceNumber),
      canResend: u.role === 'CHIEF_ACCOUNTANT' && r.state === 'SIGNED' && r.sendStatus === 'FAILED',
      delegations: [],
      summary: r.summaryAvailable ? {
        byEntity: [{ name: entityOf(d, r.entityId).name, total: r.total }],
        bySupplier: [{ name: supplierName(d, r.supplierId), total: r.total }],
        sampleOk: batch?.sample.filter((s) => r.invoiceIds.includes(s.invoiceId) && s.mark === 'OK').length ?? 0,
        sampleTotal: batch?.sample.filter((s) => r.invoiceIds.includes(s.invoiceId)).length ?? 0,
      } : null,
      delegatedUntil: given?.to ?? null,
    };
  });

export interface SignOutcome {
  requestId: Id;
  result: 'SIGNED' | 'REFUSED';
  reason: string | null;
  newState: PaymentRequest['state'] | null;
}

const hashOf = (r: PaymentRequest): string => `${(0x31c0de47 + r.version * 2654435 + r.total).toString(16).slice(-8)}...9b05`;

export const signPaymentRequests = (body: { items: { id: Id; version: number }[]; code: string }) =>
  call<SignOutcome[]>({ roles: SIGNERS, write: true }, (d, u) => {
    if (body.code.trim() !== REAUTH_CODE) throw new ApiError(401, 'WRONG_CODE');
    return body.items.map((it): SignOutcome => {
      const r = d.requests.find((x) => x.id === it.id && x.entityId === u.entityId);
      if (!r) return { requestId: it.id, result: 'REFUSED', reason: 'NOT_FOUND', newState: null };
      if (r.version !== it.version) return { requestId: r.id, result: 'REFUSED', reason: 'STALE_VERSION', newState: r.state };
      const chk = checkSign(d, u, r);
      if (!chk.canSign) return { requestId: r.id, result: 'REFUSED', reason: chk.reason, newState: r.state };
      const sig: Signature = {
        userId: u.id, name: u.fullName, role: u.role, at: d.now, onBehalfOfName: chk.onBehalfOf, contentHash: hashOf(r),
        step: r.state === 'AWAITING_CHIEF_ACCOUNTANT' ? 1 : 2,
      };
      r.signatures.push(sig);
      if (r.state === 'AWAITING_CHIEF_ACCOUNTANT' && !r.individuallyApproved) {
        r.state = 'AWAITING_PAYMENT_APPROVER';
        notify(d, d.users.filter((x) => x.entityId === r.entityId && x.role === 'PAYMENT_APPROVER' && x.approvalLevel === r.level).map((x) => x.id), 'SIGNATURE_WAITING', 'REQUEST', r.id, { request: r.id, by: u.fullName, at: d.now.slice(8, 10) + '/' + d.now.slice(5, 7) + '/' + d.now.slice(0, 4) + ' ' + d.now.slice(11, 16), level: r.level });
      } else {
        r.state = 'SIGNED';
        r.invoiceIds.forEach((iid) => {
          const i = d.invoices.find((x) => x.id === iid)!;
          i.state = 'SIGNED';
          ruleEvent(d, i, 'EV_REQUEST_SIGNED', { request: r.id });
          bump(i);
        });
        // Automatic send to the Entity ERP: a changed bank account makes the ERP refuse (demo of SCR-57).
        const fail = r.flags.bankChanged;
        r.attempts = [1, 2, 3].slice(0, fail ? 3 : 1).map((n) => ({ no: n, at: d.now, manual: false, byName: null, result: fail ? ('FAILED' as const) : ('ACCEPTED' as const) }));
        if (fail) r.sendStatus = 'FAILED';
        else {
          r.state = 'SENT';
          r.sendStatus = 'IN_ERP';
          r.invoiceIds.forEach((iid) => {
            const i = d.invoices.find((x) => x.id === iid)!;
            i.state = 'SENT';
            bump(i);
          });
        }
      }
      bump(r);
      logAudit(d, { entityId: r.entityId, hand: 'PERSON', actorName: u.fullName, actorId: u.id, eventType: 'SIGNATURE', objectType: 'REQUEST', objectId: r.id, objectLabel: r.id, event: { code: chk.onBehalfOf ? 'EV_SIGNED_ON_BEHALF' : 'EV_SIGNED', params: { version: r.version, hash: sig.contentHash, for: chk.onBehalfOf ?? '' } } });
      recomputeBatchState(d, r.batchId);
      return { requestId: r.id, result: 'SIGNED', reason: null, newState: r.state };
    });
  });

export const removeRequestLine = (requestId: Id, body: { invoiceId: Id; reason: string; version?: number }) =>
  call<RequestRow>({ roles: SIGNERS, write: true }, (d, u) => {
    const r = inScope(u, d.requests.find((x) => x.id === requestId));
    checkVersion(r.version, body.version);
    if (!body.reason.trim()) throw new ApiError(422, 'REASON_REQUIRED');
    if (!r.state.startsWith('AWAITING')) throw new ApiError(422, 'REQUEST_SIGNED');
    const inv = d.invoices.find((i) => i.id === body.invoiceId && r.invoiceIds.includes(i.id));
    if (!inv) throw new ApiError(404, 'NOT_FOUND');
    removeFromRequest(d, inv, 'REMOVED_BY_SIGNER');
    newException(d, inv, [{ code: 'WITHDRAWN_FROM_BATCH', withdrawReason: 'REMOVED_BY_SIGNER' }]);
    personEvent(d, u, inv, 'EV_LINE_REMOVED', { request: r.id }, body.reason.trim());
    r.total = requestTotal(d, r);
    recomputeBatchState(d, r.batchId);
    notify(d, apOf(d, r.entityId), 'REQUEST_RETURNED', 'INVOICE', inv.id, { request: r.id, by: u.fullName, reason: body.reason.trim() });
    return rowOf(d, u, r);
  });

export const declineRequest = (requestId: Id, body: { reason: string; version?: number }) =>
  call<RequestRow>({ roles: SIGNERS, write: true }, (d, u) => {
    const r = inScope(u, d.requests.find((x) => x.id === requestId));
    checkVersion(r.version, body.version);
    if (!body.reason.trim()) throw new ApiError(422, 'REASON_REQUIRED');
    if (!r.state.startsWith('AWAITING')) throw new ApiError(422, 'REQUEST_SIGNED');
    for (const iid of r.invoiceIds) {
      const inv = d.invoices.find((i) => i.id === iid)!;
      newException(d, inv, [{ code: 'APPROVAL_DECLINED', withdrawReason: 'REQUEST_DECLINED' }]);
      personEvent(d, u, inv, 'EV_REQUEST_DECLINED', { request: r.id }, body.reason.trim());
    }
    r.removedInvoiceIds.push(...r.invoiceIds);
    r.invoiceIds = [];
    r.state = 'CANCELLED';
    r.declineReason = body.reason.trim();
    r.declinedByName = u.fullName;
    r.signatures = [];
    bump(r);
    recomputeBatchState(d, r.batchId);
    notify(d, apOf(d, r.entityId), 'REQUEST_RETURNED', 'REQUEST', r.id, { request: r.id, by: u.fullName, reason: body.reason.trim() });
    return rowOf(d, u, r);
  });

// ----- Delegations (SCR-55, SCR-56) -----
export interface DelegationRow extends Delegation {
  delegatorName: string;
  delegateName: string;
  state: DelegationState;
  mine: 'GAVE' | 'RECEIVED' | null;
}

export const listDelegations = () =>
  call<DelegationRow[]>({ roles: [...SIGNERS, 'ENTITY_ADMIN'] }, (d, u) => {
    const today = d.now.slice(0, 10);
    return d.delegations
      .filter((x) => x.entityId === u.entityId)
      .filter((x) => u.role === 'ENTITY_ADMIN' || x.delegatorId === u.id || x.delegateId === u.id)
      .map((x): DelegationRow => ({ ...x, delegatorName: userName(d, x.delegatorId), delegateName: userName(d, x.delegateId), state: delegationState(today, x), mine: x.delegatorId === u.id ? 'GAVE' : x.delegateId === u.id ? 'RECEIVED' : null }))
      .sort((a, b) => b.from.localeCompare(a.from));
  });

export const getDelegation = (id: Id) =>
  call<DelegationRow>({ roles: [...SIGNERS, 'ENTITY_ADMIN'] }, (d, u) => {
    const x = inScope(u, d.delegations.find((y) => y.id === id));
    return { ...x, delegatorName: userName(d, x.delegatorId), delegateName: userName(d, x.delegateId), state: delegationState(d.now.slice(0, 10), x), mine: x.delegatorId === u.id ? 'GAVE' : x.delegateId === u.id ? 'RECEIVED' : null };
  });

export const listDelegateCandidates = () =>
  call<User[]>({ roles: SIGNERS, fast: true }, (d, u) => d.users.filter((x) => x.entityId === u.entityId && x.id !== u.id && x.status === 'ACTIVE' && SIGNERS.includes(x.role as 'CHIEF_ACCOUNTANT')));

export const createDelegation = (body: { delegateId: Id; from: string; to: string; reason: string }) =>
  call<Delegation>({ roles: SIGNERS, write: true }, (d, u) => {
    const delegate = d.users.find((x) => x.id === body.delegateId);
    if (!delegate || delegate.entityId !== u.entityId || delegate.status !== 'ACTIVE' || !SIGNERS.includes(delegate.role as 'CHIEF_ACCOUNTANT') || delegate.id === u.id) throw new ApiError(422, 'DELEGATE_INVALID');
    if (!body.from || !body.to) throw new ApiError(422, 'DATES_REQUIRED');
    if (body.to < body.from) throw new ApiError(422, 'END_BEFORE_START');
    if (body.from < d.now.slice(0, 10)) throw new ApiError(422, 'START_IN_PAST');
    if ((Date.parse(body.to) - Date.parse(body.from)) / 86_400_000 + 1 > 30) throw new ApiError(422, 'MAX_30_DAYS');
    if (!body.reason.trim()) throw new ApiError(422, 'REASON_REQUIRED');
    const overlap = d.delegations.some((x) => x.delegatorId === u.id && !x.revokedAt && x.from <= body.to && body.from <= x.to);
    if (overlap) throw new ApiError(422, 'OVERLAP');
    const x: Delegation = { id: `del-${d.seq.delegation++}`, entityId: u.entityId!, delegatorId: u.id, delegateId: delegate.id, from: body.from, to: body.to, reason: body.reason.trim(), revokedAt: null };
    d.delegations.push(x);
    logAudit(d, { entityId: u.entityId, hand: 'PERSON', actorName: u.fullName, actorId: u.id, eventType: 'DELEGATION', objectType: 'DELEGATION', objectId: x.id, objectLabel: `${u.fullName} - ${delegate.fullName}`, event: { code: 'EV_DELEGATION_CREATED', params: { to: delegate.fullName, from: body.from.split('-').reverse().join('/'), until: body.to.split('-').reverse().join('/') } }, note: x.reason });
    return x;
  });

export const revokeDelegation = (id: Id) =>
  call<Delegation>({ roles: [...SIGNERS, 'ENTITY_ADMIN'], write: true }, (d, u) => {
    const x = inScope(u, d.delegations.find((y) => y.id === id));
    if (u.role !== 'ENTITY_ADMIN' && x.delegatorId !== u.id) throw new ApiError(403, 'FORBIDDEN');
    const st = delegationState(d.now.slice(0, 10), x);
    if (st === 'REVOKED' || st === 'ENDED') throw new ApiError(422, 'NOT_ALLOWED');
    x.revokedAt = d.now;
    logAudit(d, { entityId: u.entityId, hand: 'PERSON', actorName: u.fullName, actorId: u.id, eventType: 'DELEGATION', objectType: 'DELEGATION', objectId: x.id, objectLabel: `${userName(d, x.delegatorId)} - ${userName(d, x.delegateId)}`, event: { code: 'EV_DELEGATION_REVOKED' } });
    return x;
  });

