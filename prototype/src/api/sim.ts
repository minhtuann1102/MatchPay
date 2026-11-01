import type { Id, PoLine, SimPersonaKind, SimPurchaseOrder, SimReceipt, Supplier } from './types';
import { ApiError, call } from './client';
import { logAudit, nextSeq } from '../mock/db';

const DEMO = ['DEMO_OPERATOR' as const];

export interface SimMaster {
  entities: { id: Id; name: string }[];
  suppliers: Supplier[];
  personas: { kind: SimPersonaKind; erpRef: string }[];
}

export const getSimMasterData = () =>
  call<SimMaster>({ roles: DEMO, fast: true }, (d) => ({
    entities: d.entities.map((e) => ({ id: e.id, name: e.name })),
    suppliers: d.suppliers.filter((s) => s.country === 'VN'),
    personas: [
      { kind: 'BUYER', erpRef: 'erp.buyer1' },
      { kind: 'WAREHOUSE_KEEPER', erpRef: 'erp.warehouse1' },
      { kind: 'ACCEPTOR', erpRef: 'erp.acceptor1' },
    ],
  }));

export interface SimOrderRow extends SimPurchaseOrder {
  supplierName: string;
  totalQuantity: number;
  outstanding: number;
  unit: string;
}

const rowOf = (d: Parameters<typeof nextSeq>[0], p: SimPurchaseOrder): SimOrderRow => {
  const total = p.lines.reduce((s, l) => s + l.quantity, 0);
  return { ...p, supplierName: d.suppliers.find((s) => s.id === p.supplierId)?.name ?? '', totalQuantity: total, outstanding: Math.max(0, total - p.receivedQuantity), unit: p.lines[0]?.unit ?? '' };
};

export const listSimPurchaseOrders = (entityId: Id) => call<SimOrderRow[]>({ roles: DEMO }, (d) => d.purchaseOrders.filter((p) => p.entityId === entityId).map((p) => rowOf(d, p)).sort((a, b) => a.id.localeCompare(b.id)));
export const getSimPurchaseOrder = (id: string) =>
  call<SimOrderRow>({ roles: DEMO }, (d) => {
    const p = d.purchaseOrders.find((x) => x.id === id);
    if (!p) throw new ApiError(404, 'NOT_FOUND');
    return rowOf(d, p);
  });
export const listSimReceipts = (entityId: Id) => call<SimReceipt[]>({ roles: DEMO }, (d) => d.receipts.filter((r) => r.entityId === entityId).sort((a, b) => a.id.localeCompare(b.id)));

export const createSimPurchaseOrder = (body: { entityId: Id; supplierId: Id; kind: 'GOODS' | 'SERVICE'; persona: SimPersonaKind; lines: PoLine[] }) =>
  call<SimPurchaseOrder>({ roles: DEMO, write: true }, (d) => {
    if (!body.lines.length || body.lines.some((l) => !l.item.trim() || l.quantity <= 0 || l.price <= 0)) throw new ApiError(422, 'LINE_INVALID');
    const code = d.entities.find((e) => e.id === body.entityId)?.code ?? 'XX';
    const po: SimPurchaseOrder = { id: `PO-${code}-${nextSeq(d, 'po')}`, entityId: body.entityId, supplierId: body.supplierId, kind: body.kind, lines: body.lines, createdByPersona: body.persona, createdAt: d.now, receivedQuantity: 0 };
    d.purchaseOrders.push(po);
    logAudit(d, { entityId: body.entityId, hand: 'ERP', eventType: 'RULE_DECISION', objectType: 'INVOICE', objectId: po.id, objectLabel: po.id, event: { code: 'EV_PO_CREATED' } });
    return po;
  });

/** A receipt makes the order a match candidate: invoices waiting for goods on that order are checked again. */
export const confirmSimReceipt = (body: { entityId: Id; poId: string; persona: SimPersonaKind; quantity: number; note: string }) =>
  call<SimReceipt>({ roles: DEMO, write: true }, (d) => {
    const po = d.purchaseOrders.find((p) => p.id === body.poId && p.entityId === body.entityId);
    if (!po) throw new ApiError(422, 'ORDER_REQUIRED');
    if (po.createdByPersona === body.persona) throw new ApiError(422, 'SAME_PERSON');
    if (!(body.quantity > 0)) throw new ApiError(422, 'LINE_INVALID');
    po.receivedQuantity += body.quantity;
    const r: SimReceipt = { id: `GRN-${d.entities.find((e) => e.id === body.entityId)?.code ?? 'XX'}-${nextSeq(d, 'receipt')}`, entityId: body.entityId, poId: po.id, persona: body.persona, quantity: body.quantity, note: body.note, at: d.now };
    d.receipts.push(r);
    return r;
  });
