import type { Batch, BatchOverview, Db, Id, Invoice, PaymentRequest, SampleItem, SendAttempt, User } from './types';
import { ApiError, AP, call, inScope } from './client';
import { bump, checkVersion, entityOf, levelFor, notify, recomputeBatchState, ruleEvent, withdrawInvoice, chiefOf, personEvent } from './domain';
import { logAudit, nextSeq, pad } from '../mock/db';
import { MOCK_TEXT } from '../mock/labels';

const batchOf = (d: Db, u: User, id: Id): Batch => inScope(u, d.batches.find((b) => b.id === id));

const sampleSizeFor = (d: Db, b: Batch, n: number): number => Math.max(1, Math.ceil((entityOf(d, b.entityId).sampleRate / 100) * n));

const overviewOf = (d: Db, b: Batch): BatchOverview => {
  const invoices = d.invoices.filter((i) => i.batchId === b.id).sort((a, c) => a.sellerName.localeCompare(c.sellerName) || a.dueDate.localeCompare(c.dueDate));
  const requests = d.requests.filter((r) => r.batchId === b.id).sort((a, c) => a.id.localeCompare(c.id));
  const ent = entityOf(d, b.entityId);
  const inSample = new Set(b.sample.map((s) => s.invoiceId));
  const suppliers = new Set(invoices.map((i) => i.supplierId));
  return {
    batch: b,
    invoices,
    sampleInvoices: b.sample.map((s) => d.invoices.find((i) => i.id === s.invoiceId)!).filter(Boolean),
    requests,
    total: invoices.reduce((s, i) => s + i.totalAmount, 0),
    requestCountOnRelease: ent.grouping === 'BY_SUPPLIER' ? suppliers.size : invoices.length,
    sampleSizeOnClose: sampleSizeFor(d, b, invoices.length),
    sampleRemaining: b.sample.filter((s) => s.mark === null).length,
    notInSample: invoices.filter((i) => !inSample.has(i.id)).length,
    canResend: requests.filter((r) => r.state === 'SIGNED' && r.sendStatus === 'FAILED').map((r) => r.id),
    hasSignature: requests.some((r) => r.signatures.length > 0 && r.state !== 'CANCELLED'),
  };
};

/** Order of risk (BR-07): a gate opened in the last 30 days first, then the highest value. */
function riskOrder(d: Db, b: Batch, invs: Invoice[]): Invoice[] {
  const recent = (i: Invoice) => {
    const g = d.gates.find((x) => x.supplierId === i.supplierId && x.entityId === i.entityId && x.state === 'OPEN' && x.openSince);
    return g?.openSince ? (Date.parse(d.now.slice(0, 10)) - Date.parse(g.openSince)) / 86_400_000 <= 30 : false;
  };
  void b;
  return [...invs].sort((a, c) => Number(recent(c)) - Number(recent(a)) || c.totalAmount - a.totalAmount);
}

const whyFor = (d: Db, inv: Invoice, first: boolean, expansionNo: number): SampleItem['why'] => {
  const g = d.gates.find((x) => x.supplierId === inv.supplierId && x.entityId === inv.entityId && x.state === 'OPEN' && x.openSince);
  if (expansionNo > 0) return { code: 'WHY_EXPANSION' };
  if (first) return { code: 'WHY_HIGH_VALUE', params: { since: g?.openSince ? g.openSince.split('-').reverse().join('/') : '' } };
  return { code: 'WHY_NEXT_RISK' };
};

export const getCurrentBatch = () =>
  call<BatchOverview | null>({ roles: AP }, (d, u) => {
    const mine = d.batches.filter((b) => b.entityId === u.entityId);
    const pick = mine.find((b) => b.state === 'IN_REVIEW') ?? mine.find((b) => b.state === 'OPEN') ?? [...mine].sort((a, c) => c.period.localeCompare(a.period))[0];
    return pick ? overviewOf(d, pick) : null;
  });

export const listBatches = () =>
  call<{ id: Id; label: string; state: Batch['state']; period: string }[]>({ roles: AP, fast: true }, (d, u) =>
    d.batches.filter((b) => b.entityId === u.entityId).sort((a, c) => c.period.localeCompare(a.period) || a.state.localeCompare(c.state)).map((b) => ({ id: b.id, label: b.label, state: b.state, period: b.period })),
  );

export const getBatch = (id: Id) => call<BatchOverview>({ roles: AP }, (d, u) => overviewOf(d, batchOf(d, u, id)));

export const listBatchRequests = (id: Id) => call<PaymentRequest[]>({ roles: AP }, (d, u) => overviewOf(d, batchOf(d, u, id)).requests);

export const closeBatchForReview = (id: Id, body: { version?: number } = {}) =>
  call<BatchOverview>({ roles: AP, write: true }, (d, u) => {
    const b = batchOf(d, u, id);
    checkVersion(b.version, body.version);
    if (b.state !== 'OPEN') throw new ApiError(409, 'STALE_VERSION');
    const invs = d.invoices.filter((i) => i.batchId === b.id);
    if (!invs.length) throw new ApiError(422, 'EMPTY_BATCH');
    const size = sampleSizeFor(d, b, invs.length);
    const ordered = riskOrder(d, b, invs).slice(0, size);
    b.sample = ordered.map((i, n) => ({ invoiceId: i.id, why: whyFor(d, i, n === 0, 0), mark: null, errorReason: null, markedBy: null, markedAt: null, expansionNo: 0 }));
    b.selectedWithoutAi = false;
    b.state = 'IN_REVIEW';
    b.closedAt = d.now;
    b.preparedBy = u.id;
    bump(b);
    logAudit(d, { entityId: b.entityId, hand: 'PERSON', actorName: u.fullName, actorId: u.id, eventType: 'PERSON_DECISION', objectType: 'BATCH', objectId: b.id, objectLabel: b.label, event: { code: 'EV_BATCH_CLOSED', params: { invoices: invs.length, sample: size } } });
    return overviewOf(d, b);
  });

export const getBatchSample = (id: Id) => call<SampleItem[]>({ roles: AP }, (d, u) => batchOf(d, u, id).sample);

export const markSampleItem = (id: Id, body: { invoiceId: Id; mark: 'OK' | 'ERROR'; reason?: string; version?: number }) =>
  call<BatchOverview>({ roles: AP, write: true }, (d, u) => {
    const b = batchOf(d, u, id);
    checkVersion(b.version, body.version);
    if (b.state !== 'IN_REVIEW') throw new ApiError(409, 'STALE_VERSION');
    const item = b.sample.find((s) => s.invoiceId === body.invoiceId);
    const inv = d.invoices.find((i) => i.id === body.invoiceId);
    if (!item || !inv) throw new ApiError(404, 'NOT_FOUND');
    if (body.mark === 'ERROR' && !(body.reason ?? '').trim()) throw new ApiError(422, 'REASON_REQUIRED');
    item.mark = body.mark;
    item.markedBy = u.fullName;
    item.markedAt = d.now;
    item.errorReason = body.mark === 'ERROR' ? body.reason!.trim() : null;
    if (!inv.processedBy.includes(u.id)) inv.processedBy.push(u.id);
    const gate = d.gates.find((g) => g.supplierId === inv.supplierId && g.entityId === inv.entityId);
    if (gate) {
      gate.sampled += 1;
      if (body.mark === 'ERROR') gate.sampleErrors += 1;
      bump(gate);
    }
    personEvent(d, u, inv, body.mark === 'OK' ? 'EV_SAMPLE_OK' : 'EV_SAMPLE_ERROR', {}, item.errorReason, 'SAMPLE_CHECK');
    if (body.mark === 'ERROR') withdrawInvoice(d, inv, 'SAMPLE_ERROR');
    bump(b);
    return overviewOf(d, b);
  });

export const expandSample = (id: Id, body: { reason: string; all?: boolean; version?: number }) =>
  call<BatchOverview>({ roles: AP, write: true }, (d, u) => {
    const b = batchOf(d, u, id);
    checkVersion(b.version, body.version);
    if (b.state !== 'IN_REVIEW') throw new ApiError(409, 'STALE_VERSION');
    if (!body.reason.trim()) throw new ApiError(422, 'REASON_REQUIRED');
    const inSample = new Set(b.sample.map((s) => s.invoiceId));
    const remaining = riskOrder(d, b, d.invoices.filter((i) => i.batchId === b.id && !inSample.has(i.id)));
    if (!remaining.length) throw new ApiError(422, 'SAMPLE_FULL');
    const original = Math.max(1, b.sample.filter((s) => s.expansionNo === 0).length);
    const add = body.all ? remaining : remaining.slice(0, original);
    const no = b.expansions.length + 1;
    add.forEach((i) => b.sample.push({ invoiceId: i.id, why: whyFor(d, i, false, no), mark: null, errorReason: null, markedBy: null, markedAt: null, expansionNo: no }));
    b.expansions.push({ no, at: d.now, byName: u.fullName, reason: body.reason.trim(), added: add.length });
    bump(b);
    logAudit(d, { entityId: b.entityId, hand: 'PERSON', actorName: u.fullName, actorId: u.id, eventType: 'PERSON_DECISION', objectType: 'BATCH', objectId: b.id, objectLabel: b.label, event: { code: 'EV_SAMPLE_EXPANDED', params: { added: add.length } }, note: body.reason.trim() });
    return overviewOf(d, b);
  });

export const releaseBatch = (id: Id, body: { version?: number } = {}) =>
  call<BatchOverview>({ roles: AP, write: true }, (d, u) => {
    const b = batchOf(d, u, id);
    checkVersion(b.version, body.version);
    if (b.state !== 'IN_REVIEW') throw new ApiError(409, 'STALE_VERSION');
    const left = b.sample.filter((s) => s.mark === null).length;
    if (left > 0) throw new ApiError(422, 'SAMPLE_UNMARKED', { left });
    const invs = d.invoices.filter((i) => i.batchId === b.id && i.state === 'IN_BATCH');
    if (!invs.length) throw new ApiError(422, 'EMPTY_BATCH');
    const ent = entityOf(d, b.entityId);
    const groups = new Map<string, Invoice[]>();
    for (const i of invs) {
      const key = ent.grouping === 'BY_SUPPLIER' ? i.supplierId ?? i.id : i.id;
      groups.set(key, [...(groups.get(key) ?? []), i]);
    }
    const created: PaymentRequest[] = [];
    for (const list of groups.values()) {
      const first = list[0]!;
      const total = list.reduce((s, i) => s + i.totalAmount, 0);
      const sup = d.suppliers.find((s) => s.id === first.supplierId);
      const r: PaymentRequest = {
        id: `PR-${pad(nextSeq(d, 'request'))}`, entityId: b.entityId, batchId: b.id, supplierId: first.supplierId ?? '', invoiceIds: list.map((i) => i.id), removedInvoiceIds: [], total,
        level: levelFor(d, b.entityId, total), state: 'AWAITING_CHIEF_ACCOUNTANT', signatures: [], flags: { newSupplier: !(sup?.paidBefore[b.entityId]), bankChanged: false },
        sendStatus: 'NOT_SENT', attempts: [], paymentRef: null, declineReason: null, declinedByName: null, individuallyApproved: list.some((i) => i.exception?.individuallyApproved),
        summaryAvailable: true, releasedAt: d.now, releasedBy: u.id, version: 1,
      };
      d.requests.push(r);
      list.forEach((i) => {
        i.requestId = r.id;
        bump(i);
      });
      created.push(r);
    }
    b.state = 'IN_SIGNING';
    b.releasedAt = d.now;
    b.releasedBy = u.id;
    b.reopenedNote = null;
    bump(b);
    logAudit(d, { entityId: b.entityId, hand: 'PERSON', actorName: u.fullName, actorId: u.id, eventType: 'PERSON_DECISION', objectType: 'BATCH', objectId: b.id, objectLabel: b.label, event: { code: 'EV_BATCH_RELEASED', params: { requests: created.length } } });
    notify(d, chiefOf(d, b.entityId), 'BATCH_RELEASED', 'SIGNING', 'signing', { count: created.length, batch: b.label });
    return overviewOf(d, b);
  });

export const reopenBatch = (id: Id, body: { reason: string; version?: number }) =>
  call<BatchOverview>({ roles: AP, write: true }, (d, u) => {
    const b = batchOf(d, u, id);
    checkVersion(b.version, body.version);
    if (b.state !== 'IN_SIGNING') throw new ApiError(409, 'STALE_VERSION');
    if (!body.reason.trim()) throw new ApiError(422, 'REASON_REQUIRED');
    const rs = d.requests.filter((r) => r.batchId === b.id && r.state !== 'CANCELLED');
    const signed = rs.find((r) => r.signatures.length > 0);
    if (signed) throw new ApiError(422, 'REQUEST_ALREADY_SIGNED', { request: signed.id, by: signed.signatures[0]!.name });
    rs.forEach((r) => {
      r.state = 'CANCELLED';
      r.declineReason = MOCK_TEXT.batchReopened;
      bump(r);
      r.invoiceIds.forEach((iid) => {
        const i = d.invoices.find((x) => x.id === iid);
        if (i) i.requestId = null;
      });
      r.invoiceIds = [];
    });
    b.state = 'IN_REVIEW';
    b.reopenedNote = body.reason.trim();
    bump(b);
    logAudit(d, { entityId: b.entityId, hand: 'PERSON', actorName: u.fullName, actorId: u.id, eventType: 'PERSON_DECISION', objectType: 'BATCH', objectId: b.id, objectLabel: b.label, event: { code: 'EV_BATCH_REOPENED', params: { requests: rs.length } }, note: body.reason.trim() });
    return overviewOf(d, b);
  });

export const listErpSendAttempts = (requestId: Id) =>
  call<SendAttempt[]>({ roles: ['AP_ACCOUNTANT', 'CHIEF_ACCOUNTANT'], fast: true }, (d, u) => inScope(u, d.requests.find((r) => r.id === requestId)).attempts);

/** SCR-57: AP Accountant (from SCR-30) or Chief Accountant (from SCR-51). The same request number is the idempotency key. */
export const resendToErp = (requestId: Id, body: { version?: number } = {}) =>
  call<PaymentRequest>({ roles: ['AP_ACCOUNTANT', 'CHIEF_ACCOUNTANT'], write: true }, (d, u) => {
    const r = inScope(u, d.requests.find((x) => x.id === requestId));
    checkVersion(r.version, body.version);
    if (r.state !== 'SIGNED' || r.sendStatus !== 'FAILED') throw new ApiError(422, 'RESEND_NOT_ALLOWED');
    r.attempts.push({ no: r.attempts.length + 1, at: d.now, manual: true, byName: u.fullName, result: 'ACCEPTED' });
    r.state = 'SENT';
    r.sendStatus = 'IN_ERP';
    bump(r);
    r.invoiceIds.forEach((iid) => {
      const i = d.invoices.find((x) => x.id === iid);
      if (i) {
        i.state = 'SENT';
        ruleEvent(d, i, 'EV_SENT_ERP', { request: r.id });
        bump(i);
      }
    });
    logAudit(d, { entityId: r.entityId, hand: 'PERSON', actorName: u.fullName, actorId: u.id, eventType: 'PERSON_DECISION', objectType: 'REQUEST', objectId: r.id, objectLabel: r.id, event: { code: 'EV_RESENT', params: { request: r.id } } });
    recomputeBatchState(d, r.batchId);
    return r;
  });
