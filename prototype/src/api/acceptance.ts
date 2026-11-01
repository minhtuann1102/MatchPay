import type { AcceptanceItem, Id, Invoice } from './types';
import { ApiError, call, inScope } from './client';
import { admitToBatch, apOf, bump, checkVersion, isDueSoon, newException, notify, personEvent, ruleEvent } from './domain';

export interface AcceptanceRow extends AcceptanceItem {
  invoice: Invoice;
  dueSoon: boolean;
}

const RD = ['REQUESTING_DEPARTMENT' as const];

export const listAcceptanceQueue = (q: { supplierId?: string; dueSoon?: boolean } = {}) =>
  call<{ items: AcceptanceRow[]; totalAll: number }>({ roles: RD }, (d, u) => {
    const all = d.acceptances
      .filter((a) => a.entityId === u.entityId && a.status === 'PENDING')
      .map((a) => ({ ...a, invoice: d.invoices.find((i) => i.id === a.invoiceId)!, dueSoon: false }))
      .filter((a) => a.invoice && a.invoice.state === 'WAITING_FOR_GOODS' && a.invoice.flow === 'SERVICES_WITH_ORDER')
      .map((a) => ({ ...a, dueSoon: isDueSoon(d, a.invoice.dueDate) }));
    let rows = all;
    if (q.supplierId) rows = rows.filter((a) => a.invoice.supplierId === q.supplierId);
    if (q.dueSoon) rows = rows.filter((a) => a.dueSoon);
    rows.sort((a, b) => a.invoice.dueDate.localeCompare(b.invoice.dueDate));
    return { items: rows, totalAll: all.length };
  });

export const getAcceptanceQueueItem = (id: Id) =>
  call<AcceptanceRow>({ roles: RD }, (d, u) => {
    const a = inScope(u, d.acceptances.find((x) => x.id === id));
    const invoice = d.invoices.find((i) => i.id === a.invoiceId)!;
    return { ...a, invoice, dueSoon: isDueSoon(d, invoice.dueDate) };
  });

export interface AcceptanceResult {
  decision: 'CONFIRM' | 'REJECT';
  invoice: Invoice;
}

export const decideServiceAcceptance = (id: Id, body: { decision: 'CONFIRM' | 'REJECT'; note: string; version?: number }) =>
  call<AcceptanceResult>({ roles: RD, write: true }, (d, u) => {
    const a = inScope(u, d.acceptances.find((x) => x.id === id));
    checkVersion(a.version, body.version);
    if (a.status !== 'PENDING') throw new ApiError(409, 'STALE_VERSION');
    const inv = d.invoices.find((i) => i.id === a.invoiceId)!;
    if (a.createdByErpUser && u.erpUser && a.createdByErpUser === u.erpUser) throw new ApiError(422, 'CREATED_THE_ORDER');
    if (body.decision === 'REJECT' && !body.note.trim()) throw new ApiError(422, 'NOTE_REQUIRED');
    a.status = body.decision === 'CONFIRM' ? 'CONFIRMED' : 'REJECTED';
    a.decidedBy = u.id;
    a.decidedAt = d.now;
    a.note = body.note.trim() || null;
    bump(a);
    if (!inv.processedBy.includes(u.id)) inv.processedBy.push(u.id);
    if (body.decision === 'CONFIRM') {
      inv.serviceAcceptance = { by: u.fullName, at: d.now, note: a.note ?? '' };
      personEvent(d, u, inv, 'EV_ACCEPTANCE_CONFIRMED', {}, a.note);
      const b = admitToBatch(d, inv);
      ruleEvent(d, inv, 'EV_RULE_ADMITTED', { batch: b.label });
    } else {
      personEvent(d, u, inv, 'EV_ACCEPTANCE_REJECTED', {}, a.note);
      newException(d, inv, [{ code: 'SERVICE_ACCEPTANCE_REJECTED' }]);
      notify(d, apOf(d, inv.entityId), 'ACCEPTANCE_REJECTED', 'INVOICE', inv.id, { invoice: inv.invoiceNumber, by: u.fullName, note: a.note ?? '', supplier: inv.sellerName });
    }
    return { decision: body.decision, invoice: inv };
  });
