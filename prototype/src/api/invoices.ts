import type {
  CancellationNotice, CorrectionRequest, Db, Invoice, InvoiceActions, InvoiceDetail, InvoiceFlow, InvoiceQuery, MessageTemplate, Page, Supplier, UploadItemResult, User, WorklistSummary, ExceptionReasonItem, Id, ReasonCode,
} from './types';
import { ApiError, AP, call, FINANCE_ROLES, getForced, paginate } from './client';
import {
  admitToBatch, apOf, approversOf, bump, chiefOf, entityOf, findInvoiceFor, isDueSoon, levelFor, newException, notify, personEvent, recomputeBatchState,
  removeFromRequest, requestTotal, ruleEvent, supplierName, systemEvent, withdrawInvoice, checkVersion,
} from './domain';
import { logAudit, nextSeq, pad } from '../mock/db';
import { MOCK_TEXT } from '../mock/labels';

export interface InvoiceRow extends Invoice {
  dueSoon: boolean;
  reminderDue: boolean;
}

const rowOf = (d: Db, i: Invoice): InvoiceRow => ({
  ...i,
  dueSoon: isDueSoon(d, i.dueDate) && !['PAID', 'SENT', 'SIGNED', 'REJECTED', 'SEPARATED', 'SUPERSEDED'].includes(i.state),
  reminderDue: !!i.replyDue && i.replyDue <= d.now.slice(0, 10) && i.exception?.state === 'WAITING_FOR_SUPPLIER',
});

const VIEW: Record<string, (i: Invoice) => boolean> = {
  needs: (i) => i.state === 'EXCEPTION',
  waiting: (i) => ['WAITING_FOR_GOODS', 'IN_CHECK', 'RECEIVED'].includes(i.state),
  batch: (i) => i.state === 'IN_BATCH',
  done: (i) => ['PAID', 'SENT', 'SIGNED', 'REJECTED', 'SEPARATED', 'SUPERSEDED'].includes(i.state),
  all: () => true,
};

const scopeInvoices = (d: Db, u: User): Invoice[] => d.invoices.filter((i) => !u.entityId || i.entityId === u.entityId);

export const listSuppliers = () =>
  call<Supplier[]>({ roles: FINANCE_ROLES, fast: true }, (d, u) => {
    const ids = new Set(scopeInvoices(d, u).map((i) => i.supplierId));
    return d.suppliers.filter((s) => ids.has(s.id)).sort((a, b) => a.name.localeCompare(b.name));
  });

export const getWorklistSummary = () =>
  call<WorklistSummary>({ roles: FINANCE_ROLES }, (d, u) => {
    const mine = scopeInvoices(d, u);
    const views = Object.fromEntries(Object.entries(VIEW).map(([k, f]) => [k, mine.filter(f).length])) as WorklistSummary['views'];
    const exc = mine.filter(VIEW.needs!);
    const batch = mine.filter(VIEW.batch!);
    const soon = mine.filter((i) => !['PAID', 'SENT', 'SIGNED', 'REJECTED', 'SEPARATED', 'SUPERSEDED'].includes(i.state) && isDueSoon(d, i.dueDate));
    const ent = entityOf(d, u.entityId!);
    return {
      views,
      openExceptions: exc.length,
      waitingDecision: exc.filter((i) => i.exception?.state === 'WAITING_FOR_DECISION').length,
      waitingSupplier: exc.filter((i) => i.exception?.state === 'WAITING_FOR_SUPPLIER').length,
      dueWithin7Days: soon.length,
      dueDates: soon.map((i) => i.dueDate).sort(),
      inBatch: batch.length,
      inBatchTotal: batch.reduce((s, i) => s + i.totalAmount, 0),
      waitingForGoods: mine.filter((i) => i.state === 'WAITING_FOR_GOODS').length,
      lastSyncAt: ent.lastSyncAt,
      lastSyncFailed: ent.lastSyncFailed,
    };
  });

export const listInvoices = (q: InvoiceQuery) =>
  call<Page<InvoiceRow> & { anyStateCount: number }>({ roles: FINANCE_ROLES }, (d, u) => {
    let rows = scopeInvoices(d, u);
    const search = (q.search ?? '').trim().toLowerCase();
    if (search) {
      const digits = search.replace(/[^\d]/g, '');
      rows = rows.filter(
        (i) => i.invoiceNumber.toLowerCase().includes(search) || i.sellerName.toLowerCase().includes(search) || (digits.length >= 6 && String(i.totalAmount) === digits),
      );
    } else if (q.view && !q.figure) {
      rows = rows.filter(VIEW[q.view] ?? VIEW.all!);
    }
    if (q.figure) rows = rows.filter(figureFilter(d, q.figure));
    const anyStateCount = rows.length;
    if (q.state) rows = rows.filter((i) => i.state === q.state);
    if (q.supplierId) rows = rows.filter((i) => i.supplierId === q.supplierId);
    if (q.flow) rows = rows.filter((i) => i.flow === q.flow);
    if (q.source) rows = rows.filter((i) => i.source === q.source);
    if (q.reminderDue) rows = rows.filter((i) => rowOf(d, i).reminderDue);
    if (q.dueSoon) rows = rows.filter((i) => rowOf(d, i).dueSoon);
    rows = [...rows].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.invoiceNumber.localeCompare(b.invoiceNumber));
    const p = paginate(rows.map((i) => rowOf(d, i)), q.page, q.pageSize);
    return { ...p, anyStateCount };
  });

function figureFilter(d: Db, figure: string): (i: Invoice) => boolean {
  switch (figure) {
    case 'touchless':
      return (i) => ['IN_BATCH', 'SIGNED', 'SENT', 'PAID'].includes(i.state) && i.processedBy.length === 0 && !i.exception;
    case 'open-exceptions':
      return (i) => i.state === 'EXCEPTION';
    case 'waiting-for-goods':
      return (i) => i.state === 'WAITING_FOR_GOODS';
    case 'age-0-2':
    case 'age-3-7':
    case 'age-7+':
      return (i) => i.state === 'EXCEPTION' && ageBucket(d, i) === figure.slice(4);
    default:
      if (figure.startsWith('exc-')) return (i) => i.state === 'EXCEPTION' && i.exception?.state === figure.slice(4).toUpperCase().replace(/-/g, '_');
      return () => true;
  }
}
export const ageBucket = (d: Db, i: Invoice): '0-2' | '3-7' | '7+' => {
  const days = (Date.parse(d.now.slice(0, 10)) - Date.parse((i.exception?.openedAt ?? i.receivedAt).slice(0, 10))) / 86_400_000;
  return days <= 2 ? '0-2' : days <= 7 ? '3-7' : '7+';
};

// ----- Detail with the actions the role may take -----
const NOT_INDIVIDUAL: ReasonCode[] = ['UNSUPPORTED_FOREIGN_INVOICE', 'AI_UNAVAILABLE', 'WRONG_ENTITY_REPORTED', 'WRONG_BUYER_TAX_CODE', 'SERVICE_ACCEPTANCE_REJECTED'];

function actionsFor(d: Db, u: User, inv: Invoice): InvoiceActions {
  const none: InvoiceActions = {
    rerunChecks: false, takeException: false, confirmLine: false, correctFlow: false, requestCorrection: false, sendForDecision: false, reject: false,
    recordCancellation: false, withdraw: false, decideTaxRisk: false, decideApproval: false, approvalBlockedReason: null,
  };
  const e = inv.exception;
  const open = !!e && e.state !== 'CLOSED';
  const req = d.requests.find((r) => r.id === inv.requestId);
  if (u.role === 'AP_ACCOUNTANT') {
    const waitingDecision = e?.state === 'WAITING_FOR_DECISION';
    return {
      ...none,
      rerunChecks: ['IN_CHECK', 'WAITING_FOR_GOODS'].includes(inv.state) || (open && !waitingDecision),
      takeException: !!e && e.state === 'OPEN',
      confirmLine: open && !waitingDecision && inv.lines.some((l) => (l.probability ?? 1) < 0.9 && !l.confirmedBy),
      correctFlow: open && !waitingDecision && inv.flow !== 'UNSUPPORTED_FOREIGN',
      requestCorrection: open && !waitingDecision && inv.flow !== 'UNSUPPORTED_FOREIGN',
      sendForDecision: open && !waitingDecision && !e!.reasons.some((r) => NOT_INDIVIDUAL.includes(r.code)),
      reject: (open && !waitingDecision) || inv.state === 'WAITING_FOR_GOODS',
      recordCancellation: inv.state === 'WAITING_FOR_GOODS' || open || (inv.state === 'IN_BATCH' && (!req || req.state.startsWith('AWAITING'))) || (inv.state === 'SIGNED' && req?.state === 'SIGNED'),
      withdraw: inv.state === 'IN_BATCH' && (!req || req.state.startsWith('AWAITING')),
    };
  }
  if (u.role === 'CHIEF_ACCOUNTANT') {
    return { ...none, decideTaxRisk: e?.state === 'WAITING_FOR_DECISION' && e.route === 'CHIEF_ACCOUNTANT' };
  }
  if (u.role === 'PAYMENT_APPROVER') {
    const mine = e?.state === 'WAITING_FOR_DECISION' && e.route === 'PAYMENT_APPROVER' && e.requiredLevel === u.approvalLevel;
    const blocked = mine && inv.processedBy.includes(u.id) ? 'PROCESSED_BY_YOU' : null;
    return { ...none, decideApproval: !!mine, approvalBlockedReason: blocked };
  }
  return none;
}

export const getInvoice = (id: Id) =>
  call<InvoiceDetail>({ roles: FINANCE_ROLES }, (d, u) => {
    const inv = findInvoiceFor(d, u, id);
    const history = d.audit.filter((a) => a.objectType === 'INVOICE' && a.objectId === inv.id).sort((a, b) => a.at.localeCompare(b.at));
    const erpItems: InvoiceDetail['erpItems'] = [];
    const ent = entityOf(d, inv.entityId);
    if (inv.poRef) {
      const po = d.purchaseOrders.find((p) => p.id === inv.poRef);
      po?.lines.forEach((l) => erpItems.push({ doc: po.id, item: l.item, quantity: `${l.quantity} ${l.unit}`, price: String(l.price), syncedAt: ent.lastSyncAt }));
      d.receipts.filter((r) => r.poId === inv.poRef).forEach((r) => erpItems.push({ doc: r.id, item: '', quantity: String(r.quantity), price: '', syncedAt: ent.lastSyncAt }));
    }
    const group = inv.exception?.linkedGroup;
    const linked = group ? d.invoices.filter((i) => i.exception?.linkedGroup === group && i.entityId === inv.entityId) : [];
    const level = inv.exception?.requiredLevel ?? null;
    const combined = linked.length ? linked.reduce((s, i) => s + i.totalAmount, 0) : inv.totalAmount;
    return {
      invoice: inv,
      supplierName: supplierName(d, inv.supplierId) || inv.sellerName,
      entityName: ent.name,
      history,
      request: d.requests.find((r) => r.id === inv.requestId) ?? null,
      batch: d.batches.find((b) => b.id === inv.batchId) ?? null,
      erpItems,
      actions: actionsFor(d, u, inv),
      linkedGroup: linked,
      requiredLevel: inv.exception?.route === 'PAYMENT_APPROVER' ? level ?? levelFor(d, inv.entityId, combined) : null,
      tax: d.taxRiskList.some((x) => x.supplierId === inv.supplierId) && inv.exception?.reasons.some((r) => r.code === 'TAX_RISK_HOLD')
        ? { listedAt: d.taxRiskList.find((x) => x.supplierId === inv.supplierId)!.listedAt } : null,
      corrections: d.corrections.filter((c) => c.invoiceId === inv.id),
      cancellation: d.cancellationNotices.find((n) => n.invoiceId === inv.id) ?? null,
      readOnly: u.role !== 'AP_ACCOUNTANT',
      dueSoon: isDueSoon(d, inv.dueDate),
    };
  });

export const downloadInvoiceDocument = (id: Id) =>
  call<{ fileName: string; xml: string }>({ roles: FINANCE_ROLES }, (d, u) => {
    const i = findInvoiceFor(d, u, id);
    return { fileName: `${i.invoiceNumber}.xml`, xml: `<Invoice><Series>${i.series}</Series><Number>${i.number}</Number><Seller>${i.sellerName}</Seller><Total>${i.totalAmount}</Total></Invoice>` };
  });

// ----- Upload (SCR-11) -----
interface UploadTemplate { supplierId: string; flow: InvoiceFlow; total: number; outcome: Invoice['plannedOutcome']; po: string | null }
const UPLOAD_TEMPLATES: UploadTemplate[] = [
  { supplierId: 's-harbor', flow: 'GOODS_WITH_ORDER', total: 11_000_000, outcome: 'IN_BATCH', po: 'PO-CF-1022' },
  { supplierId: 's-bright', flow: 'GOODS_WITH_ORDER', total: 6_600_000, outcome: 'EXCEPTION_GATE', po: 'PO-CF-1007' },
  { supplierId: 's-cloud', flow: 'SERVICES_WITH_ORDER', total: 3_300_000, outcome: 'WAITING_FOR_GOODS', po: 'PO-CF-1040' },
  { supplierId: 's-sunrise', flow: 'RECURRING', total: 4_200_000, outcome: 'IN_BATCH', po: null },
];

/** Create one accepted invoice and run the first check (shared by upload and the mailbox fetch). */
export function createReceivedInvoice(d: Db, entityId: Id, source: 'UPLOAD' | 'EMAIL', mailboxMessageId: string | null, tplIndex: number): Invoice {
  const tpl = UPLOAD_TEMPLATES[tplIndex % UPLOAD_TEMPLATES.length]!;
  const sup = d.suppliers.find((s) => s.id === tpl.supplierId)!;
  const ent = entityOf(d, entityId);
  const no = nextSeq(d, 'invoice');
  const number = pad(no, 7);
  const lineAmt = Math.round(tpl.total / 1.1);
  const inv: Invoice = {
    id: `inv-${no}`, entityId, series: 'C26TAA', number, invoiceNumber: `C26TAA-${number}`, supplierId: sup.id, sellerName: sup.name, sellerTaxCode: sup.taxCode,
    buyerTaxCode: ent.taxCode, buyerName: ent.name, invoiceDate: d.now.slice(0, 10), dueDate: new Date(Date.parse(d.now.slice(0, 10)) + 21 * 86_400_000).toISOString().slice(0, 10),
    totalAmount: tpl.total, vatAmount: tpl.total - lineAmt, state: 'RECEIVED', source, flow: tpl.flow, flowConfidence: 0.96, flowReason: { code: 'FLOW_GOODS_PO', params: { po: tpl.po ?? '' } },
    kind: 'ORIGINAL', authorityStatus: 'VALID', authorityCheckedAt: d.now, poRef: tpl.po, receiptRef: null,
    lines: [{ lineNo: 1, text: sup.name, matchedItem: sup.name, method: 'MAPPING_TABLE', probability: 1, amount: lineAmt }],
    conditions: [], anomalies: [{ code: 'AN_SUPPLIER_PAID', params: { n: sup.paidBefore[entityId] ?? 0 }, flagged: false }], exception: null, rejection: null, note: null,
    batchId: null, requestId: null, paymentRef: null, serviceAcceptance: null, processedBy: [], receivedAt: d.now, hash: `${(0x1a2b3c4d + no * 104729).toString(16)}...f0e1`,
    trust: 'HIGH', aiAvailable: true, plannedOutcome: tpl.outcome, replyDue: null, supersededBy: null, mailboxMessageId, version: 1,
  };
  d.invoices.push(inv);
  systemEvent(d, inv, mailboxMessageId ? 'EV_RECEIVED_MAIL' : 'EV_RECEIVED', { hash: inv.hash, msg: mailboxMessageId ?? '' });
  ruleEvent(d, inv, 'EV_SIGNATURE_VALID', { trust: 'HIGH' });
  logAudit(d, { entityId, hand: 'AI', eventType: 'AI_DECISION', objectType: 'INVOICE', objectId: inv.id, objectLabel: inv.invoiceNumber, event: { code: 'EV_AI_FLOW', params: { flow: inv.flow, conf: 0.96, detail: 'ALL_MATCHED' } }, task: 'classify flow', model: 'model 2026.10 - prompt v14' });
  applyOutcome(d, inv);
  return inv;
}

const allPass = (inv: Invoice): void => {
  inv.conditions = [
    { no: 1, result: 'PASS', detail: { code: inv.poRef ? 'C1_OK_SERVICE' : 'C1_OK_PROFILE', params: { po: inv.poRef ?? '', grn: '', contract: '' } } },
    { no: 2, result: 'PASS', detail: { code: 'C2_OK', params: { p: 0.96 } } },
    { no: 3, result: 'PASS', detail: { code: 'C3_OK', params: { price: 0.5, qty: '1' } } },
    { no: 4, result: 'PASS', detail: { code: 'C4_OK', params: { total: inv.totalAmount, thr: 200_000_000 } } },
    { no: 5, result: 'PASS', detail: { code: 'C5_OPEN', params: { since: '12/10/2026', supplier: '' } } },
    { no: 6, result: 'PASS', detail: { code: 'C6_OK' } },
  ];
};

function applyOutcome(d: Db, inv: Invoice): void {
  if (inv.plannedOutcome === 'WAITING_FOR_GOODS') {
    inv.state = 'WAITING_FOR_GOODS';
    inv.note = { code: 'NOTE_WAIT_GOODS' };
    ruleEvent(d, inv, 'EV_RULE_WAIT_GOODS', { po: inv.poRef ?? '' });
  } else if (inv.plannedOutcome === 'EXCEPTION_GATE') {
    allPass(inv);
    inv.conditions[4] = { no: 5, result: 'FAIL', detail: { code: 'C5_CLOSED', params: { supplier: inv.sellerName, entity: entityOf(d, inv.entityId).name } } };
    newException(d, inv, [{ code: 'GATE_CLOSED', conditionNo: 5 }]);
    ruleEvent(d, inv, 'EV_RULE_EXCEPTION', { conds: '5' });
    notify(d, apOf(d, inv.entityId), 'EXCEPTION_OPENED', 'INVOICE', inv.id, { invoice: inv.invoiceNumber, reason: 'GATE_CLOSED', supplier: inv.sellerName, amount: inv.totalAmount, more: 0 });
  } else {
    allPass(inv);
    const b = admitToBatch(d, inv);
    ruleEvent(d, inv, 'EV_RULE_ADMITTED', { batch: b.label });
  }
}

export const uploadInvoices = (files: { name: string }[]) =>
  call<UploadItemResult[]>({ roles: AP, write: true }, (d, u) => {
    if (!files.length) throw new ApiError(422, 'NO_FILES');
    return files.map((f): UploadItemResult => {
      const n = f.name.toLowerCase();
      const reject = (code: string, params?: Record<string, string | number>): UploadItemResult => ({ fileName: f.name, result: 'REJECTED', reason: { code, params } });
      if (!n.endsWith('.xml')) return reject('UP_NOT_XML');
      if (n.includes('sig')) return reject('UP_SIGNATURE');
      if (n.includes('dup')) return reject('UP_DUPLICATE');
      if (n.includes('replace')) return reject('UP_REPLACED', { by: 'C26TAA-0000141' });
      if (n.includes('cancel')) return reject('UP_CANCELLED', { date: '03/11/2026' });
      if (n.includes('buyer')) return reject('UP_BUYER');
      const idx = nextSeq(d, 'upload');
      const inv = createReceivedInvoice(d, u.entityId!, 'UPLOAD', null, idx - 1);
      return { fileName: f.name, result: 'ACCEPTED', invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, state: inv.state };
    });
  });

// ----- Checks -----
export const rerunChecks = (id: Id) =>
  call<Invoice>({ roles: AP, write: true }, (d, u) => {
    const inv = findInvoiceFor(d, u, id);
    if (!['IN_CHECK', 'WAITING_FOR_GOODS', 'EXCEPTION'].includes(inv.state)) throw new ApiError(422, 'NOT_ALLOWED');
    if (getForced() === 'ai-error') {
      logAudit(d, { entityId: inv.entityId, hand: 'RULE', eventType: 'RULE_DECISION', objectType: 'INVOICE', objectId: inv.id, objectLabel: inv.invoiceNumber, event: { code: 'EV_AI_FAILED' } });
      throw new ApiError(503, 'AI_UNAVAILABLE');
    }
    personEvent(d, u, inv, 'EV_RERUN');
    if (!inv.aiAvailable) {
      inv.aiAvailable = true;
      inv.flow = 'GOODS_WITH_ORDER';
      inv.flowConfidence = 0.95;
      inv.flowReason = { code: 'FLOW_GOODS_PO', params: { po: inv.poRef ?? '' } };
      inv.poRef = inv.poRef ?? 'PO-CF-1022';
      inv.lines = [{ lineNo: 1, text: inv.sellerName, matchedItem: inv.sellerName, method: 'MAPPING_TABLE', probability: 1, amount: inv.totalAmount - inv.vatAmount }];
      logAudit(d, { entityId: inv.entityId, hand: 'AI', eventType: 'AI_DECISION', objectType: 'INVOICE', objectId: inv.id, objectLabel: inv.invoiceNumber, event: { code: 'EV_AI_FLOW', params: { flow: inv.flow, conf: 0.95, detail: 'ALL_MATCHED' } }, task: 'classify flow', model: 'model 2026.10 - prompt v14' });
      if (inv.plannedOutcome === 'IN_BATCH') {
        allPass(inv);
        const b = admitToBatch(d, inv);
        ruleEvent(d, inv, 'EV_RULE_ADMITTED', { batch: b.label });
      }
    } else if (inv.state === 'EXCEPTION') {
      const failing = inv.conditions.filter((c) => c.result === 'FAIL').map((c) => c.no);
      if (failing.length === 0) {
        const b = admitToBatch(d, inv);
        ruleEvent(d, inv, 'EV_RULE_ADMITTED', { batch: b.label });
      } else {
        ruleEvent(d, inv, 'EV_RERUN_STILL_FAILS', { conds: failing.join(', ') });
        bump(inv);
      }
    } else {
      applyOutcome(d, inv);
    }
    return inv;
  });

export const runAuthorityLookup = (id: Id) =>
  call<Invoice>({ roles: AP, write: true }, (d, u) => {
    const inv = findInvoiceFor(d, u, id);
    inv.authorityCheckedAt = d.now;
    inv.authorityStatus = inv.authorityStatus ?? 'VALID';
    ruleEvent(d, inv, 'EV_AUTHORITY_LOOKUP', { status: inv.authorityStatus });
    bump(inv);
    return inv;
  });

// ----- Exception work (SCR-12) -----
export const takeException = (id: Id) =>
  call<Invoice>({ roles: AP, write: true }, (d, u) => {
    const inv = findInvoiceFor(d, u, id);
    if (!inv.exception || inv.exception.state !== 'OPEN') throw new ApiError(422, 'NOT_ALLOWED');
    inv.exception.state = 'IN_REVIEW';
    inv.exception.takenBy = u.id;
    personEvent(d, u, inv, 'EV_OPENED_EXCEPTION');
    bump(inv);
    return inv;
  });

export const confirmLineMatch = (id: Id, body: { lineNo: number; version?: number }) =>
  call<Invoice>({ roles: AP, write: true }, (d, u) => {
    const inv = findInvoiceFor(d, u, id);
    checkVersion(inv.version, body.version);
    const line = inv.lines.find((l) => l.lineNo === body.lineNo);
    if (!line || !inv.exception) throw new ApiError(422, 'NOT_ALLOWED');
    line.probability = 1;
    line.method = 'PERSON';
    line.confirmedBy = u.fullName;
    delete line.doubtNote;
    if (!inv.processedBy.includes(u.id)) inv.processedBy.push(u.id);
    inv.exception.reasons = inv.exception.reasons.filter((r) => r.code !== 'LINE_NOT_MATCHED');
    const c2 = inv.conditions.find((c) => c.no === 2);
    if (c2) {
      c2.result = 'PASS';
      c2.detail = { code: 'C2_OK', params: { p: 1 } };
    }
    personEvent(d, u, inv, 'EV_CONFIRM_LINE', { line: body.lineNo });
    ruleEvent(d, inv, 'EV_RECHECK', { left: inv.conditions.filter((c) => c.result === 'FAIL').length });
    if (!inv.conditions.some((c) => c.result === 'FAIL')) {
      const b = admitToBatch(d, inv);
      ruleEvent(d, inv, 'EV_RULE_ADMITTED', { batch: b.label });
    } else bump(inv);
    return inv;
  });

export const correctFlow = (id: Id, body: { flow: InvoiceFlow; version?: number }) =>
  call<Invoice>({ roles: AP, write: true }, (d, u) => {
    const inv = findInvoiceFor(d, u, id);
    checkVersion(inv.version, body.version);
    if (inv.flow === 'UNSUPPORTED_FOREIGN') throw new ApiError(422, 'NOT_ALLOWED');
    inv.flow = body.flow;
    inv.flowConfidence = 1;
    if (!inv.processedBy.includes(u.id)) inv.processedBy.push(u.id);
    personEvent(d, u, inv, 'EV_CORRECT_FLOW', { flow: body.flow });
    bump(inv);
    return inv;
  });

export const reportWrongEntity = (id: Id, body: { note: string; version?: number }) =>
  call<Invoice>({ roles: AP, write: true }, (d, u) => {
    const inv = findInvoiceFor(d, u, id);
    checkVersion(inv.version, body.version);
    if (!body.note.trim()) throw new ApiError(422, 'NOTE_REQUIRED');
    if (!inv.exception) throw new ApiError(422, 'NOT_ALLOWED');
    if (!inv.exception.reasons.some((r) => r.code === 'WRONG_ENTITY_REPORTED')) inv.exception.reasons.push({ code: 'WRONG_ENTITY_REPORTED' });
    personEvent(d, u, inv, 'EV_WRONG_ENTITY', {}, body.note);
    bump(inv);
    return inv;
  });

export const sendForDecision = (id: Id, body: { version?: number } = {}) =>
  call<Invoice[]>({ roles: AP, write: true }, (d, u) => {
    const inv = findInvoiceFor(d, u, id);
    checkVersion(inv.version, body.version);
    const e = inv.exception;
    if (!e || e.state === 'CLOSED' || e.state === 'WAITING_FOR_DECISION') throw new ApiError(422, 'NOT_ALLOWED');
    if (e.reasons.some((r) => NOT_INDIVIDUAL.includes(r.code))) throw new ApiError(422, 'NOT_ALLOWED_FOR_REASON');
    const tax = e.reasons.some((r) => r.code === 'TAX_RISK_HOLD');
    const group = e.linkedGroup ? d.invoices.filter((i) => i.exception?.linkedGroup === e.linkedGroup) : [inv];
    const total = group.reduce((s, i) => s + i.totalAmount, 0);
    const level = tax ? null : levelFor(d, inv.entityId, total);
    for (const g of group) {
      const ge = g.exception!;
      ge.state = 'WAITING_FOR_DECISION';
      ge.route = tax ? 'CHIEF_ACCOUNTANT' : 'PAYMENT_APPROVER';
      ge.requiredLevel = level;
      ge.sentForDecisionAt = d.now;
      ge.takenBy = ge.takenBy ?? u.id;
      if (!g.processedBy.includes(u.id)) g.processedBy.push(u.id);
      personEvent(d, u, g, 'EV_SENT_FOR_DECISION', { to: ge.route, level: level ?? '' });
      bump(g);
    }
    notify(d, tax ? chiefOf(d, inv.entityId) : approversOf(d, inv.entityId, level), 'DECISION_WAITING', 'INVOICE', inv.id, { invoice: inv.invoiceNumber, supplier: inv.sellerName, amount: total });
    return group;
  });

export const rejectInvoice = (id: Id, body: { reason: string; version?: number }) =>
  call<Invoice>({ roles: AP, write: true }, (d, u) => {
    const inv = findInvoiceFor(d, u, id);
    checkVersion(inv.version, body.version);
    if (!body.reason.trim()) throw new ApiError(422, 'REASON_REQUIRED');
    if (!(inv.exception && inv.exception.state !== 'CLOSED') && inv.state !== 'WAITING_FOR_GOODS') throw new ApiError(422, 'NOT_ALLOWED');
    if (inv.exception) {
      inv.exception.state = 'CLOSED';
      inv.exception.outcome = 'REJECTED';
    }
    inv.state = 'REJECTED';
    inv.rejection = { code: 'REJECTED_BY_PERSON', note: body.reason.trim() };
    inv.note = { code: 'NOTE_REJECTED_BY_PERSON' };
    if (!inv.processedBy.includes(u.id)) inv.processedBy.push(u.id);
    personEvent(d, u, inv, 'EV_REJECTED', {}, body.reason.trim());
    bump(inv);
    return inv;
  });

export const withdrawInvoiceFromBatch = (id: Id, body: { reason: string; version?: number }) =>
  call<Invoice>({ roles: AP, write: true }, (d, u) => {
    const inv = findInvoiceFor(d, u, id);
    checkVersion(inv.version, body.version);
    if (inv.state !== 'IN_BATCH') throw new ApiError(422, 'NOT_ALLOWED');
    if (!body.reason.trim()) throw new ApiError(422, 'REASON_REQUIRED');
    const r = d.requests.find((x) => x.id === inv.requestId);
    if (r && !r.state.startsWith('AWAITING')) throw new ApiError(422, 'REQUEST_SIGNED');
    withdrawInvoice(d, inv, 'WITHDRAWN_BY_AP');
    personEvent(d, u, inv, 'EV_WITHDRAWN', {}, body.reason.trim());
    return inv;
  });

// ----- Correction requests (SCR-14) -----
export const listMessageTemplates = () => call<MessageTemplate[]>({ roles: AP, fast: true }, (d) => d.templates);

export const draftCorrectionRequest = (id: Id, kind: MessageTemplate['kind']) =>
  call<CorrectionRequest>({ roles: AP, write: true }, (d, u) => {
    const inv = findInvoiceFor(d, u, id);
    const tpl = d.templates.find((t) => t.kind === kind)!;
    const ai = getForced() !== 'ai-error';
    const fill = (s: string) => s.replace(/\{invoice\}/g, inv.invoiceNumber).replace(/\{supplier\}/g, inv.sellerName).replace(/\{sender\}/g, u.fullName);
    const c: CorrectionRequest = {
      id: `cor-${nextSeq(d, 'correction')}`, invoiceId: inv.id, kind, recipient: `ketoan@${inv.sellerName.split(' ')[0]!.toLowerCase()}.example`,
      subject: ai ? fill(tpl.subject) : '', body: ai ? fill(tpl.body) : '', status: 'DRAFT', sentAt: null, aiDraft: ai,
    };
    d.corrections.push(c);
    return c;
  });

export const sendCorrectionRequest = (id: Id, body: { subject: string; body: string; recipient: string }) =>
  call<CorrectionRequest>({ roles: AP, write: true }, (d, u) => {
    const c = d.corrections.find((x) => x.id === id);
    if (!c) throw new ApiError(404, 'NOT_FOUND');
    const inv = findInvoiceFor(d, u, c.invoiceId);
    if (!/^\S+@\S+\.\S+$/.test(body.recipient.trim())) throw new ApiError(422, 'RECIPIENT_INVALID');
    if (!body.subject.trim() || !body.body.trim()) throw new ApiError(422, 'MESSAGE_REQUIRED');
    c.subject = body.subject;
    c.body = body.body;
    c.recipient = body.recipient.trim();
    // Demo: an address with "fail" simulates an email failure; the draft stays "not sent".
    if (c.recipient.toLowerCase().includes('fail')) throw new ApiError(502, 'EMAIL_FAILED');
    c.status = 'SENT';
    c.sentAt = d.now;
    if (inv.exception && inv.exception.state !== 'CLOSED') {
      inv.exception.state = c.kind === 'DATA_FIX_NOTICE' ? 'WAITING_FOR_DATA_FIX' : 'WAITING_FOR_SUPPLIER';
      inv.exception.takenBy = inv.exception.takenBy ?? u.id;
    }
    inv.replyDue = new Date(Date.parse(d.now.slice(0, 10)) + 7 * 86_400_000).toISOString().slice(0, 10);
    if (!inv.processedBy.includes(u.id)) inv.processedBy.push(u.id);
    personEvent(d, u, inv, c.kind === 'DATA_FIX_NOTICE' ? 'EV_DATAFIX_SENT' : 'EV_CORRECTION_SENT', { to: inv.sellerName });
    bump(inv);
    return c;
  });

// ----- Cancellation notice (SCR-19) -----
export interface CancellationResult {
  invoice: Invoice;
  outcome: 'REJECTED' | 'WITHDRAWN' | 'REQUEST_CANCELLED';
  requestId: string | null;
  newTotal: number | null;
  newLevel: string | null;
}

export const recordCancellationNotice = (id: Id, body: { reference: string; noticeDate: string; fileName: string | null; version?: number }) =>
  call<CancellationResult>({ roles: AP, write: true }, (d, u) => {
    const inv = findInvoiceFor(d, u, id);
    checkVersion(inv.version, body.version);
    if (!body.reference.trim() || !body.noticeDate) throw new ApiError(422, 'NOTICE_FIELDS_REQUIRED');
    const req = d.requests.find((r) => r.id === inv.requestId);
    const notice: CancellationNotice = { id: `ntc-${nextSeq(d, 'notice')}`, invoiceId: inv.id, reference: body.reference.trim(), noticeDate: body.noticeDate, fileName: body.fileName, recordedAt: d.now };
    let outcome: CancellationResult['outcome'] = 'REJECTED';
    let touched: string | null = null;
    if (inv.state === 'SIGNED' && req && req.state === 'SIGNED') {
      req.state = 'CANCELLED';
      req.declineReason = MOCK_TEXT.cancelledBySeller;
      bump(req);
      for (const lineId of req.invoiceIds) {
        const other = d.invoices.find((x) => x.id === lineId)!;
        if (other.id === inv.id) continue;
        newException(d, other, [{ code: 'REQUEST_CANCELLED_OTHER_INVOICE', params: { invoice: inv.invoiceNumber } }]);
        ruleEvent(d, other, 'EV_REQUEST_CANCELLED', { request: req.id });
      }
      outcome = 'REQUEST_CANCELLED';
      touched = req.id;
      recomputeBatchState(d, req.batchId);
      notify(d, chiefOf(d, inv.entityId), 'REQUEST_CANCELLED', 'REQUEST', req.id, { request: req.id });
    } else if (inv.state === 'IN_BATCH') {
      const wasInRequest = !!req;
      if (wasInRequest) {
        if (!req!.state.startsWith('AWAITING')) throw new ApiError(422, 'REQUEST_SIGNED');
        withdrawInvoice(d, inv, 'CANCELLATION_NOTICE');
        outcome = 'WITHDRAWN';
        touched = req!.id;
      } else {
        const b = d.batches.find((x) => x.id === inv.batchId);
        if (b) b.sample = b.sample.filter((s) => s.invoiceId !== inv.id);
        inv.batchId = null;
      }
    } else if (!(inv.state === 'WAITING_FOR_GOODS' || inv.state === 'EXCEPTION')) {
      throw new ApiError(422, 'NOT_ALLOWED');
    }
    if (inv.exception && inv.exception.state !== 'CLOSED') {
      inv.exception.state = 'CLOSED';
      inv.exception.outcome = 'REJECTED';
    }
    inv.state = 'REJECTED';
    inv.rejection = { code: 'CANCELLED_BY_SELLER', note: body.reference.trim() };
    inv.note = { code: 'NOTE_CANCELLED_BY_SELLER' };
    inv.requestId = null;
    d.cancellationNotices.push(notice);
    if (!inv.processedBy.includes(u.id)) inv.processedBy.push(u.id);
    personEvent(d, u, inv, 'EV_CANCEL_NOTICE', { ref: notice.reference, date: notice.noticeDate });
    bump(inv);
    const r = touched ? d.requests.find((x) => x.id === touched) : null;
    if (r && outcome === 'WITHDRAWN') r.total = requestTotal(d, r);
    return { invoice: inv, outcome, requestId: touched, newTotal: r ? r.total : null, newLevel: r ? r.level : null };
  });

export { removeFromRequest };
export type { ExceptionReasonItem };
