import type {
  AcceptanceItem,
  ApprovalMatrix,
  AuditEntry,
  AuditEventType,
  Batch,
  Coded,
  Condition,
  Db,
  Delegation,
  Entity,
  Gate,
  Hand,
  Invoice,
  InvoiceLine,
  MailboxMessage,
  Notification,
  PaymentRequest,
  RecurringProfile,
  SimPurchaseOrder,
  SimReceipt,
  Supplier,
  User,
} from '../api/types';

export const SCHEMA_VERSION = 6;
export const DEMO_START = '2026-10-31T10:30:00';

const FOODS = 'ent-foods';
const PACK = 'ent-pack';
const RETAIL = 'ent-retail';

// ---------- Entities, group, users ----------
const entities: Entity[] = [
  { id: FOODS, code: 'CF', name: 'Calderwood Foods Co.', taxCode: '0100000011', priceTolerance: 2, batchThreshold: 200_000_000, sampleRate: 10, grouping: 'BY_SUPPLIER', mailbox: 'invoices-foods@calderwood.example', lastSyncAt: '2026-10-31T09:15:00', lastSyncFailed: false, version: 1 },
  { id: PACK, code: 'CP', name: 'Calderwood Packaging Co.', taxCode: '0100000022', priceTolerance: 4, batchThreshold: 250_000_000, sampleRate: 10, grouping: 'BY_SUPPLIER', mailbox: 'invoices-packaging@calderwood.example', lastSyncAt: '2026-10-31T09:15:00', lastSyncFailed: false, version: 1 },
  { id: RETAIL, code: 'CR', name: 'Calderwood Retail Co.', taxCode: '0100000033', priceTolerance: 2, batchThreshold: 150_000_000, sampleRate: 10, grouping: 'PER_INVOICE', mailbox: 'invoices-retail@calderwood.example', lastSyncAt: '2026-10-31T08:30:00', lastSyncFailed: true, version: 1 },
];

const U = (id: string, fullName: string, email: string, role: User['role'], entityId: string | null, erpUser: string | null, approvalLevel: User['approvalLevel'] = null): User => ({
  id, fullName, email, role, entityId, erpUser, approvalLevel, status: 'ACTIVE', version: 1,
});

const users: User[] = [
  U('u-alice', 'Alice', 'alice@calderwood-foods.example', 'AP_ACCOUNTANT', FOODS, 'erp.alice'),
  U('u-carol', 'Carol', 'carol@calderwood-foods.example', 'CHIEF_ACCOUNTANT', FOODS, 'erp.carol'),
  U('u-dan', 'Dan', 'dan@calderwood-foods.example', 'PAYMENT_APPROVER', FOODS, 'erp.dan', 'DEPARTMENT_HEAD'),
  U('u-fiona', 'Fiona', 'fiona@calderwood-foods.example', 'PAYMENT_APPROVER', FOODS, 'erp.fiona', 'CFO'),
  U('u-rowan', 'Rowan', 'rowan@calderwood-foods.example', 'REQUESTING_DEPARTMENT', FOODS, 'erp.rowan'),
  U('u-evan', 'Evan', 'evan@calderwood-foods.example', 'ENTITY_ADMIN', FOODS, null),
  U('u-gina', 'Gina', 'gina@calderwood-group.example', 'GROUP_ADMIN', null, null),
  U('u-dina', 'Dina', 'dina@calderwood-group.example', 'DEMO_OPERATOR', null, null),
  U('u-mina', 'Mina', 'mina@calderwood-packaging.example', 'AP_ACCOUNTANT', PACK, 'erp.mina'),
  U('u-kai', 'Kai', 'kai@calderwood-packaging.example', 'CHIEF_ACCOUNTANT', PACK, 'erp.kai'),
  U('u-rhea', 'Rhea', 'rhea@calderwood-retail.example', 'AP_ACCOUNTANT', RETAIL, 'erp.rhea'),
  U('u-theo', 'Theo', 'theo@calderwood-retail.example', 'CHIEF_ACCOUNTANT', RETAIL, 'erp.theo'),
];

const S = (id: string, name: string, taxCode: string | null, paid: Record<string, number>, country: 'VN' | 'DE' = 'VN'): Supplier => ({ id, name, taxCode, country, paidBefore: paid });
const suppliers: Supplier[] = [
  S('s-bright', 'Brightfield Paper Ltd', '0301122334', { [FOODS]: 14, [PACK]: 6 }),
  S('s-harbor', 'Harbor Cartons Ltd', '0305566778', { [FOODS]: 9, [PACK]: 11 }),
  S('s-sunrise', 'Sunrise Electric Utility', '0300998877', { [FOODS]: 24, [RETAIL]: 12 }),
  S('s-cloud', 'CloudDesk Software Ltd', '0311122334', { [FOODS]: 7, [PACK]: 20 }),
  S('s-eastbay', 'Eastbay Trading', '0309988776', { [FOODS]: 3 }),
  S('s-tempest', 'Tempest Marketing GmbH', null, {}, 'DE'),
  S('s-lakeside', 'Lakeside Facility Services Ltd', '0312233445', { [FOODS]: 5 }),
  S('s-green', 'Greenleaf Landscaping Ltd', '0313344556', { [FOODS]: 8 }),
  S('s-pine', 'Pinecrest Training Co.', '0314455667', { [FOODS]: 2 }),
  S('s-skyline', 'Skyline Travel Co.', '0315566778', { [FOODS]: 4 }),
];
const sup = (id: string) => suppliers.find((s) => s.id === id)!;

// ---------- Audit helper ----------
const audit: AuditEntry[] = [];
let auditNo = 0;
const typeOf: Record<Hand, AuditEventType> = { AI: 'AI_DECISION', RULE: 'RULE_DECISION', SYSTEM: 'RULE_DECISION', PERSON: 'PERSON_DECISION', ERP: 'PAID_STATUS' };

interface AOpts { eventType?: AuditEventType; note?: string; objectType?: AuditEntry['objectType']; task?: string; model?: string; entityId?: string | null; actorId?: string | null }
const A = (objectId: string, label: string, at: string, hand: Hand, actorName: string | null, code: string, params?: Coded['params'], o: AOpts = {}): void => {
  auditNo += 1;
  audit.push({
    id: `aud-${String(auditNo).padStart(4, '0')}`,
    at, hand, actorName,
    actorId: o.actorId ?? (actorName ? users.find((u) => u.fullName === actorName)?.id ?? null : null),
    entityId: o.entityId === undefined ? FOODS : o.entityId,
    eventType: o.eventType ?? typeOf[hand],
    objectType: o.objectType ?? 'INVOICE', objectId, objectLabel: label,
    event: { code, params }, note: o.note ?? null, task: o.task, model: o.model,
  });
};
const AI_MODEL = 'model 2026.10 - prompt v14';

// ---------- Invoice helpers ----------
const line = (lineNo: number, text: string, matchedItem: string | null, method: InvoiceLine['method'], probability: number | null, amount: number, doubtNote?: string, extra: Partial<InvoiceLine> = {}): InvoiceLine => ({ lineNo, text, matchedItem, method, probability, amount, doubtNote, ...extra });
const cond = (no: Condition['no'], result: Condition['result'], code: string, params?: Coded['params']): Condition => ({ no, result, detail: { code, params } });

const passAll = (po: string, grn: string | null, total: number, thr: number, since = '12/10/2026', lowest = 0.95, price = 0.8, qty = '1', supplier = ''): Condition[] => [
  cond(1, 'PASS', grn ? 'C1_OK' : 'C1_OK_SERVICE', { po, grn: grn ?? '' }),
  cond(2, 'PASS', 'C2_OK', { p: lowest }),
  cond(3, 'PASS', 'C3_OK', { price, qty }),
  cond(4, 'PASS', 'C4_OK', { total, thr }),
  cond(5, 'PASS', 'C5_OPEN', { since, supplier }),
  cond(6, 'PASS', 'C6_OK'),
];

const noAnomaly = (paid: number): (Coded & { flagged: boolean })[] => [
  { code: 'AN_PRICE_NONE', flagged: false },
  { code: 'AN_DUP_NONE', flagged: false },
  { code: 'AN_SUPPLIER_PAID', params: { n: paid }, flagged: false },
  { code: 'AN_PERIOD_NONE', flagged: false },
];

let invSeq = 0;
const inv = (id: string, o: Partial<Invoice> & Pick<Invoice, 'number' | 'supplierId' | 'totalAmount' | 'state' | 'dueDate'>): Invoice => {
  invSeq += 1;
  const s = sup(o.supplierId!);
  const series = o.series ?? 'C26TAA';
  const base: Invoice = {
    id, entityId: FOODS, series, number: '', invoiceNumber: '',
    supplierId: '', sellerName: s.name, sellerTaxCode: s.taxCode,
    buyerTaxCode: '0100000011', buyerName: 'Calderwood Foods Co.',
    invoiceDate: '2026-10-20', dueDate: '',
    totalAmount: 0, vatAmount: Math.round(o.totalAmount - o.totalAmount / 1.1),
    state: 'EXCEPTION', source: 'UPLOAD', flow: 'GOODS_WITH_ORDER', flowConfidence: 0.96,
    flowReason: null, kind: 'ORIGINAL', authorityStatus: 'VALID', authorityCheckedAt: '2026-10-31T09:16:00',
    poRef: null, receiptRef: null,
    lines: [line(1, 'Hàng hóa theo đơn đặt hàng', 'Mặt hàng đã khớp', 'MAPPING_TABLE', 1, Math.round(o.totalAmount / 1.1))],
    conditions: [], anomalies: noAnomaly(s.paidBefore[FOODS] ?? 0), exception: null, rejection: null,
    note: null, batchId: null, requestId: null, paymentRef: null, serviceAcceptance: null, processedBy: [],
    receivedAt: '2026-10-20T08:00:00', hash: `${(0x9f2c4a71 + invSeq * 7919).toString(16)}...e41a`, trust: 'HIGH',
    aiAvailable: true, plannedOutcome: 'IN_BATCH', replyDue: null, supersededBy: null, mailboxMessageId: null, version: 1,
    ...(o as Partial<Invoice>),
  };
  base.invoiceNumber = `${base.series}-${base.number}`;
  return base;
};

let excSeq = 0;
const exc = (o: Partial<Invoice['exception'] & object> & { reasons: NonNullable<Invoice['exception']>['reasons'] }): NonNullable<Invoice['exception']> => {
  excSeq += 1;
  return {
    id: `exc-${String(excSeq).padStart(3, '0')}`, state: 'OPEN', openedAt: '2026-10-31T08:54:00', takenBy: null, route: null,
    requiredLevel: null, sentForDecisionAt: null, outcome: null, linkedGroup: null, individuallyApproved: false, decisionNote: null,
    ...o,
  };
};

const ADMITTED: Coded = { code: 'NOTE_ADMITTED' };

const invoices: Invoice[] = [];
const push = (i: Invoice) => { invoices.push(i); return i; };

// --- Exceptions (needs action) ---
push(inv('inv-123', {
  number: '0000123', supplierId: 's-bright', totalAmount: 8_098_750, state: 'EXCEPTION', dueDate: '2026-11-04', buyerName: 'Calderwood Retail Co.',
  poRef: 'PO-CF-1007', receiptRef: 'GRN-CF-2031', invoiceDate: '2026-10-20', receivedAt: '2026-10-31T08:51:00', vatAmount: 736_250,
  flowConfidence: 0.97, flowReason: { code: 'FLOW_GOODS_PO', params: { po: 'PO-CF-1007' } }, version: 7,
  lines: [
    // Quantity data for the three-way match view (D-222): 21 thùng x 5 = 105 ream against 100 ordered and received.
    line(1, 'Giấy photo Brand-X 70gsm, thùng 5 ream A4', 'Giấy photo A4, loại 1', 'MAPPING_TABLE', 1, 6_457_500, undefined, { quantity: 21, unit: 'thùng', unitPrice: 307_500, poLineNo: 1, unitFactor: 5 }),
    line(2, 'Ghim bấm Staples No.10 (hộp 1.000)', 'Ghim bấm No.10, hộp', 'EMBEDDING_FUSION', 0.93, 480_000, undefined, { quantity: 40, unit: 'hộp', unitPrice: 12_000, poLineNo: 2 }),
    line(3, 'Bìa file xanh 5cm', 'Bìa còng A4 xanh, 5 cm (đề xuất)', 'LLM_AFTER_FUSION', 0.74, 425_000, 'UNIT_UNKNOWN', { quantity: 25, unit: 'cái', unitPrice: 17_000, poLineNo: 3 }),
  ],
  conditions: [
    cond(1, 'PASS', 'C1_OK', { po: 'PO-CF-1007', grn: 'GRN-CF-2031' }),
    cond(2, 'FAIL', 'C2_FAIL', { line: 3, p: 0.74, thr: 0.9 }),
    cond(3, 'FAIL', 'C3_FAIL', { price: 2.5, tol: 2, qty: 105, recv: 100 }),
    cond(4, 'PASS', 'C4_OK', { total: 8_098_750, thr: 200_000_000 }),
    cond(5, 'FAIL', 'C5_CLOSED', { supplier: 'Brightfield Paper Ltd', entity: 'Calderwood Foods Co.' }),
    cond(6, 'PASS', 'C6_OK'),
  ],
  anomalies: [
    { code: 'AN_PRICE_HISTORY', params: { item: 'Giấy photo A4', price: 61_500, median: 60_000, n: 6, pct: 2.5, limit: 20 }, flagged: false },
    { code: 'AN_DUP_NONE', flagged: false },
    { code: 'AN_SUPPLIER_PAID', params: { n: 14 }, flagged: false },
    { code: 'AN_PERIOD_NONE', flagged: false },
  ],
  exception: exc({
    state: 'IN_REVIEW', takenBy: 'u-alice', openedAt: '2026-10-31T08:54:00',
    reasons: [
      { code: 'GATE_CLOSED', conditionNo: 5 },
      { code: 'LINE_NOT_MATCHED', conditionNo: 2, params: { line: 3 } },
      { code: 'PRICE_OUT_OF_TOLERANCE', conditionNo: 3, params: { pct: 2.5, tol: 2 } },
      { code: 'QUANTITY_ABOVE_RECEIVED', conditionNo: 3, params: { qty: 105, recv: 100 } },
    ],
  }),
}));
push(inv('inv-151', {
  number: '0000151', supplierId: 's-bright', totalAmount: 63_800_000, state: 'EXCEPTION', dueDate: '2026-11-30', source: 'EMAIL', mailboxMessageId: 'MSG-0409',
  poRef: 'PO-CF-1015', receiptRef: 'GRN-CF-2044', receivedAt: '2026-10-31T09:01:00', vatAmount: 5_800_000, flowConfidence: 0.97,
  lines: [line(1, 'Giấy photo A4, loại 1 (ream), 800 ream x 72.500 đ', 'Giấy photo A4, loại 1', 'MAPPING_TABLE', 1, 58_000_000, undefined, { quantity: 800, unit: 'ream', unitPrice: 72_500, poLineNo: 1 })],
  conditions: [
    cond(1, 'PASS', 'C1_OK', { po: 'PO-CF-1015', grn: 'GRN-CF-2044' }),
    cond(2, 'PASS', 'C2_OK', { p: 1 }),
    cond(3, 'PASS', 'C3_OK', { price: 0, qty: '800 / 800' }),
    cond(4, 'PASS', 'C4_OK', { total: 63_800_000, thr: 200_000_000 }),
    cond(5, 'FAIL', 'C5_CLOSED', { supplier: 'Brightfield Paper Ltd', entity: 'Calderwood Foods Co.' }),
    cond(6, 'FAIL', 'C6_PRICE', { pct: 20.8, limit: 20 }),
  ],
  anomalies: [
    { code: 'AN_PRICE_HISTORY', params: { item: 'Giấy photo A4', price: 72_500, median: 60_000, n: 6, pct: 20.8, limit: 20 }, flagged: true },
    { code: 'AN_ORDER_MATCH', params: { po: 'PO-CF-1015', grn: 'GRN-CF-2044', price: 72_500, qty: 800 }, flagged: false },
    { code: 'AN_SUPPLIER_PAID', params: { n: 14 }, flagged: false },
  ],
  exception: exc({
    state: 'WAITING_FOR_DECISION', takenBy: 'u-alice', route: 'PAYMENT_APPROVER', requiredLevel: 'CFO', sentForDecisionAt: '2026-10-31T09:47:00', openedAt: '2026-10-31T09:02:00',
    reasons: [{ code: 'GATE_CLOSED', conditionNo: 5 }, { code: 'UNUSUAL_PRICE', conditionNo: 6, params: { pct: 20.8 } }],
  }),
}));
push(inv('inv-149', {
  number: '0000149', supplierId: 's-harbor', totalAmount: 55_000_000, state: 'EXCEPTION', dueDate: '2026-11-20', poRef: 'PO-CF-1019', receiptRef: 'GRN-CF-2038',
  receivedAt: '2026-10-28T13:40:00',
  conditions: [
    cond(1, 'PASS', 'C1_OK', { po: 'PO-CF-1019', grn: 'GRN-CF-2038' }), cond(2, 'PASS', 'C2_OK', { p: 1 }), cond(3, 'PASS', 'C3_OK', { price: 0, qty: '1' }),
    cond(4, 'PASS', 'C4_OK', { total: 55_000_000, thr: 200_000_000 }), cond(5, 'PASS', 'C5_OPEN', { since: '12/10/2026', supplier: '' }),
    cond(6, 'FAIL', 'C6_DUP', { other: 'C26TAA-0000103', days: 2 }),
  ],
  anomalies: [{ code: 'AN_DUP', params: { other: 'C26TAA-0000103', days: 2 }, flagged: true }, { code: 'AN_SUPPLIER_PAID', params: { n: 9 }, flagged: false }],
  exception: exc({
    state: 'WAITING_FOR_DECISION', takenBy: 'u-alice', route: 'PAYMENT_APPROVER', requiredLevel: 'CFO', sentForDecisionAt: '2026-10-28T14:10:00', openedAt: '2026-10-28T13:45:00',
    reasons: [{ code: 'POSSIBLE_DUPLICATE', conditionNo: 6 }],
  }),
}));
push(inv('inv-188', {
  number: '0000188', supplierId: 's-eastbay', totalAmount: 24_200_000, state: 'EXCEPTION', dueDate: '2026-11-14', poRef: 'PO-CF-1012', receiptRef: 'GRN-CF-2040', vatAmount: 2_200_000,
  receivedAt: '2026-10-31T08:57:00',
  lines: [line(1, 'Thùng carton 5 lớp, 2.000 cái', 'Thùng carton 5 lớp 40x30x30', 'MAPPING_TABLE', 1, 22_000_000, undefined, { quantity: 2_000, unit: 'cái', unitPrice: 11_000, poLineNo: 1 })],
  conditions: [
    cond(1, 'PASS', 'C1_OK', { po: 'PO-CF-1012', grn: 'GRN-CF-2040' }), cond(2, 'PASS', 'C2_OK', { p: 1 }), cond(3, 'PASS', 'C3_OK', { price: 0, qty: '2.000 / 2.000' }),
    cond(4, 'PASS', 'C4_OK', { total: 24_200_000, thr: 200_000_000 }), cond(5, 'FAIL', 'C5_TAXRISK', { supplier: 'Eastbay Trading' }), cond(6, 'PASS', 'C6_OK'),
  ],
  exception: exc({
    state: 'WAITING_FOR_DECISION', takenBy: 'u-alice', route: 'CHIEF_ACCOUNTANT', sentForDecisionAt: '2026-10-31T09:44:00', openedAt: '2026-10-31T08:59:00',
    reasons: [{ code: 'TAX_RISK_HOLD', conditionNo: 5 }],
  }),
}));
for (const [n, po, amt] of [['0000191', 'PO-CF-1031', 20_000_000, '24/10'], ['0000192', 'PO-CF-1033', 18_000_000, '27/10'], ['0000193', 'PO-CF-1036', 15_000_000, '30/10']] as const) {
  push(inv(`inv-${n.slice(4)}`, {
    number: n, supplierId: 's-harbor', totalAmount: amt, state: 'EXCEPTION', dueDate: '2026-11-27', poRef: po, receiptRef: `GRN-${po.slice(3)}`, receivedAt: '2026-10-31T09:09:00',
    conditions: [
      cond(1, 'PASS', 'C1_OK', { po, grn: `GRN-${po.slice(3)}` }), cond(2, 'PASS', 'C2_OK', { p: 1 }), cond(3, 'PASS', 'C3_OK', { price: 0, qty: '1' }),
      cond(4, 'PASS', 'C4_OK', { total: amt, thr: 200_000_000 }), cond(5, 'PASS', 'C5_OPEN', { since: '12/10/2026', supplier: '' }),
      cond(6, 'FAIL', 'C6_SPLIT', { from: '24/10', to: '30/10', total: 53_000_000 }),
    ],
    anomalies: [{ code: 'AN_SPLIT', params: { from: '24/10/2026', to: '30/10/2026', total: 53_000_000 }, flagged: true }, { code: 'AN_ORDER_MATCH_ALL', flagged: false }, { code: 'AN_SUPPLIER_PAID', params: { n: 9 }, flagged: false }],
    exception: exc({
      state: 'WAITING_FOR_DECISION', takenBy: 'u-alice', route: 'PAYMENT_APPROVER', requiredLevel: 'CFO', linkedGroup: 'split-harbor-1', sentForDecisionAt: '2026-10-31T09:52:00', openedAt: '2026-10-31T09:10:00',
      reasons: [{ code: 'SPLIT_ORDERS', conditionNo: 6, params: { total: 53_000_000 } }],
    }),
    note: { code: 'NOTE_SPLIT' },
  }));
}
push(inv('inv-tm0415', {
  series: 'TM', number: '2026-0415', supplierId: 's-tempest', totalAmount: 18_500_000, state: 'EXCEPTION', dueDate: '2026-11-20', flow: 'UNSUPPORTED_FOREIGN', flowConfidence: 0.95,
  flowReason: { code: 'FLOW_FOREIGN', params: {} }, lines: [], receivedAt: '2026-10-30T16:20:00', vatAmount: 0, trust: 'LOW',
  conditions: [1, 2, 3, 4, 5, 6].map((n) => cond(n as Condition['no'], 'NOT_EVALUATED', 'C_NOT_EVALUATED_FLOW')),
  anomalies: [],
  exception: exc({ reasons: [{ code: 'UNSUPPORTED_FOREIGN_INVOICE' }], openedAt: '2026-10-30T16:21:00' }),
}));
push(inv('inv-140', {
  number: '0000140', supplierId: 's-harbor', totalAmount: 14_300_000, state: 'EXCEPTION', dueDate: '2026-11-10', flow: 'NOT_CLASSIFIED', flowConfidence: null, aiAvailable: false,
  invoiceDate: '2026-10-29', lines: [], receivedAt: '2026-10-31T09:20:00', anomalies: [],
  conditions: [
    cond(1, 'NOT_EVALUATED', 'C_EVIDENCE_MISSING'), cond(2, 'NOT_EVALUATED', 'C_EVIDENCE_MISSING'), cond(3, 'NOT_EVALUATED', 'C_EVIDENCE_MISSING'),
    cond(4, 'PASS', 'C4_OK', { total: 14_300_000, thr: 200_000_000 }), cond(5, 'NOT_EVALUATED', 'C_EVIDENCE_MISSING'), cond(6, 'NOT_EVALUATED', 'C_ANOMALY_NOT_RUN'),
  ],
  exception: exc({ reasons: [{ code: 'AI_UNAVAILABLE' }], openedAt: '2026-10-31T09:21:00' }),
}));
push(inv('inv-131', {
  number: '0000131', supplierId: 's-cloud', totalAmount: 6_820_000, state: 'EXCEPTION', dueDate: '2026-11-05', source: 'EMAIL', flow: 'SERVICES_WITH_ORDER', poRef: 'PO-CF-1018',
  mailboxMessageId: 'MSG-0402', replyDue: '2026-10-30', requestId: null, receivedAt: '2026-10-22T10:00:00',
  lines: [line(1, 'Dịch vụ hỗ trợ CloudDesk, tháng 10', 'Dịch vụ hỗ trợ CloudDesk, tháng 10', 'MAPPING_TABLE', 1, 6_200_000, undefined, { quantity: 5, unit: 'ngày', unitPrice: 1_240_000, poLineNo: 1 })],
  conditions: [
    cond(1, 'PASS', 'C1_OK_SERVICE', { po: 'PO-CF-1018', grn: '' }), cond(2, 'PASS', 'C2_OK', { p: 0.97 }), cond(3, 'FAIL', 'C3_FAIL', { price: 3, tol: 2, qty: 5, recv: 5 }),
    cond(4, 'PASS', 'C4_OK', { total: 6_820_000, thr: 200_000_000 }), cond(5, 'FAIL', 'C5_CLOSED', { supplier: 'CloudDesk Software Ltd', entity: 'Calderwood Foods Co.' }), cond(6, 'PASS', 'C6_OK'),
  ],
  exception: exc({
    state: 'WAITING_FOR_SUPPLIER', takenBy: 'u-alice', openedAt: '2026-10-22T10:05:00',
    reasons: [{ code: 'PRICE_OUT_OF_TOLERANCE', conditionNo: 3, params: { pct: 3, tol: 2 } }, { code: 'GATE_CLOSED', conditionNo: 5 }],
  }),
}));

// --- Waiting ---
push(inv('inv-160', {
  number: '0000160', supplierId: 's-harbor', totalAmount: 9_350_000, state: 'WAITING_FOR_GOODS', dueDate: '2026-11-25', source: 'EMAIL', mailboxMessageId: 'MSG-0412', poRef: 'PO-CF-1021',
  receivedAt: '2026-10-29T11:00:00', note: { code: 'NOTE_WAIT_GOODS' }, plannedOutcome: 'WAITING_FOR_GOODS',
  conditions: [cond(1, 'NOT_EVALUATED', 'C_NO_RECEIPT'), cond(2, 'NOT_EVALUATED', 'C_NO_RECEIPT'), cond(3, 'NOT_EVALUATED', 'C_NO_RECEIPT'), cond(4, 'PASS', 'C4_OK', { total: 9_350_000, thr: 200_000_000 }), cond(5, 'NOT_EVALUATED', 'C_NO_RECEIPT'), cond(6, 'NOT_EVALUATED', 'C_NO_RECEIPT')],
}));
push(inv('inv-165', { number: '0000165', supplierId: 's-cloud', totalAmount: 3_080_000, state: 'IN_CHECK', dueDate: '2026-11-28', flow: 'NOT_CLASSIFIED', flowConfidence: null, receivedAt: '2026-10-31T10:20:00', note: { code: 'NOTE_AI_CHECKING' }, lines: [], anomalies: [] }));
push(inv('inv-166', { number: '0000166', supplierId: 's-bright', totalAmount: 5_500_000, state: 'RECEIVED', dueDate: '2026-11-28', source: 'EMAIL', flow: 'NOT_CLASSIFIED', flowConfidence: null, receivedAt: '2026-10-31T10:25:00', note: { code: 'NOTE_SIGNATURE_RUNNING' }, lines: [], anomalies: [], authorityStatus: null, authorityCheckedAt: null }));
push(inv('inv-174', { number: '0000174', supplierId: 's-bright', totalAmount: 6_050_000, state: 'IN_CHECK', dueDate: '2026-11-30', source: 'EMAIL', mailboxMessageId: 'MSG-0418', flow: 'NOT_CLASSIFIED', flowConfidence: null, receivedAt: '2026-10-31T09:30:00', note: { code: 'NOTE_AI_CHECKING' }, lines: [], anomalies: [] }));
// Service invoices waiting for acceptance (no ERP acceptance for the order)
for (const [n, sId, amt, due, po, svc] of [
  ['0000150', 's-lakeside', 12_000_000, '2026-11-06', 'PO-CF-1020', 'Vệ sinh văn phòng, 5 ngày'],
  ['0000157', 's-green', 6_600_000, '2026-11-14', 'PO-CF-1024', 'Chăm sóc cảnh quan, tháng 10'],
  ['0000161', 's-pine', 9_350_000, '2026-11-20', 'PO-CF-1027', 'Đào tạo an toàn, 2 buổi'],
] as const) {
  push(inv(`inv-${n.slice(4)}`, {
    number: n, supplierId: sId, totalAmount: amt, state: 'WAITING_FOR_GOODS', dueDate: due, flow: 'SERVICES_WITH_ORDER', poRef: po, source: n === '0000150' ? 'EMAIL' : 'UPLOAD',
    mailboxMessageId: n === '0000150' ? 'MSG-0409' : null, receivedAt: n === '0000150' ? '2026-10-27T09:02:00' : n === '0000157' ? '2026-10-28T09:00:00' : '2026-10-28T11:30:00',
    note: { code: 'NOTE_WAIT_ACCEPTANCE' }, plannedOutcome: 'IN_BATCH', lines: [line(1, svc, svc, 'MAPPING_TABLE', 0.95, Math.round(amt / 1.1))],
    conditions: passAll(po, null, amt, 200_000_000, '12/10/2026', 0.95, 0.8, '5 / 5'),
  }));
}

// --- In batch: October batch (released, in signing) ---
const OCT = 'bat-2026-10';
const NOV = 'bat-2026-11';
const SEP = 'bat-2026-09';
const AUG = 'bat-2026-08';
// The single line of an invoice with an order (D-241): quantity, unit, unit price, and order line 1, so the three-way match popup compares it. The quantity
// is the largest of a short list that divides the line amount exactly: quantity x unit price is the amount. The matched item is the generic item name of the
// ERP order generator below, so the order and receipt sheets show a real item name.
const qtyLine = (total: number, service = false) => {
  const amount = Math.round(total / 1.1);
  const quantity = (service ? [5, 4, 3, 2, 1] : [100, 50, 20, 10, 5, 4, 3, 2, 1]).find((q) => amount % q === 0)!;
  return {
    ...line(1, service ? 'Dịch vụ theo đơn đặt hàng' : 'Hàng hóa theo đơn đặt hàng', service ? 'Dịch vụ theo hợp đồng' : 'Hàng hóa theo đơn', 'MAPPING_TABLE', 1, amount, undefined,
      { quantity, unit: service ? 'ngày' : 'thùng', unitPrice: amount / quantity, poLineNo: 1 }),
    quantity,
  };
};
/** The acceptance of a service order, named like ACC-CF-1018 for PO-CF-1018. Used by the checks of the invoice and by the ERP data below. */
const acceptanceId = (po: string): string => `ACC-${po.slice(3)}`;
const goodsBatch = (id: string, number: string, sId: string, total: number, due: string, po: string, grn: string, batchId: string, requestId: string | null, extra: Partial<Invoice> = {}) => {
  // An invoice with an order states its quantity, so its checks agree with the popup: an exact price, Q of Q received, and (for a service) the acceptance.
  const service = extra.flow === 'SERVICES_WITH_ORDER';
  const stated = po.startsWith('PO-') ? qtyLine(total, service) : null;
  return push(inv(id, {
    number, supplierId: sId, totalAmount: total, state: 'IN_BATCH', dueDate: due, poRef: po, receiptRef: grn, batchId, requestId, note: ADMITTED, receivedAt: '2026-10-20T09:50:00',
    conditions: stated
      ? passAll(po, service ? acceptanceId(po) : grn, total, 200_000_000, '12/10/2026', 0.95, 0, `${stated.quantity} / ${stated.quantity}`, sup(sId).name)
      : passAll(po, grn, total, 200_000_000, '12/10/2026', 0.95, 0.8, '4.000 / 4.000', sup(sId).name),
    ...(stated ? { lines: [stated] } : {}), ...extra,
  }));
};
goodsBatch('inv-098', '0000098', 's-harbor', 26_400_000, '2026-11-12', 'PO-CF-0998', 'GRN-CF-2012', OCT, 'PR-0042', { invoiceDate: '2026-10-14' });
goodsBatch('inv-099', '0000099', 's-harbor', 13_100_000, '2026-11-12', 'PO-CF-1003', 'GRN-CF-2020', OCT, 'PR-0042', { source: 'EMAIL', mailboxMessageId: 'MSG-0390' });
goodsBatch('inv-102', '0000102', 's-harbor', 13_500_000, '2026-11-15', 'PO-CF-1004', 'GRN-CF-2022', OCT, 'PR-0042');
goodsBatch('inv-110', '0000110', 's-cloud', 12_650_000, '2026-11-14', 'PO-CF-1010', '', OCT, 'PR-0044', { flow: 'SERVICES_WITH_ORDER', receiptRef: null });
push(inv('inv-096', {
  number: '0000096', supplierId: 's-sunrise', totalAmount: 4_400_000, state: 'IN_BATCH', dueDate: '2026-11-10', flow: 'RECURRING', batchId: OCT, requestId: 'PR-0043', note: { code: 'NOTE_PROFILE' },
  lines: [line(1, 'Tiền điện tháng 10, Xưởng 2', 'Hợp đồng EL-2026-015', 'MAPPING_TABLE', 1, 4_000_000)], receivedAt: '2026-10-20T09:40:00',
  conditions: [cond(1, 'PASS', 'C1_OK_PROFILE', { contract: 'EL-2026-015' }), cond(2, 'PASS', 'C2_OK', { p: 1 }), cond(3, 'PASS', 'C3_OK_PROFILE', { price: 4_400_000 }), cond(4, 'PASS', 'C4_OK', { total: 4_400_000, thr: 200_000_000 }), cond(5, 'PASS', 'C5_OPEN', { since: '12/10/2026', supplier: '' }), cond(6, 'PASS', 'C6_OK')],
}));
// --- In batch: November batch (open) ---
goodsBatch('inv-168', '0000168', 's-cloud', 3_080_000, '2026-11-30', '', '', NOV, null, { flow: 'RECURRING', source: 'EMAIL', mailboxMessageId: 'MSG-0414', poRef: null, receiptRef: null, note: { code: 'NOTE_PROFILE' }, receivedAt: '2026-10-30T14:10:00',
  lines: [line(1, 'Thuê bao CloudDesk, tháng 11', 'Hợp đồng CD-2026-003', 'MAPPING_TABLE', 1, 2_800_000)], conditions: passAll('CD-2026-003', null, 3_080_000, 200_000_000) });
goodsBatch('inv-169', '0000169', 's-cloud', 5_500_000, '2026-11-28', 'PO-CF-1030', '', NOV, null, { flow: 'SERVICES_WITH_ORDER', source: 'EMAIL', mailboxMessageId: 'MSG-0414', receivedAt: '2026-10-30T14:10:00', receiptRef: null });
goodsBatch('inv-176', '0000176', 's-bright', 7_150_000, '2026-11-26', 'PO-CF-1034', 'GRN-CF-2051', NOV, null, { receivedAt: '2026-10-30T16:00:00' });
goodsBatch('inv-177', '0000177', 's-harbor', 11_000_000, '2026-11-22', 'PO-CF-1035', 'GRN-CF-2052', NOV, null, { receivedAt: '2026-10-30T17:10:00' });
goodsBatch('inv-178', '0000178', 's-sunrise', 4_300_000, '2026-11-18', 'EL-2026-014', '', NOV, null, { flow: 'RECURRING', note: { code: 'NOTE_PROFILE' }, poRef: null, receiptRef: null, receivedAt: '2026-10-30T17:40:00',
  lines: [line(1, 'Tiền điện tháng 10, Xưởng 1', 'Hợp đồng EL-2026-014', 'MAPPING_TABLE', 1, 3_909_091)], conditions: passAll('EL-2026-014', null, 4_300_000, 200_000_000) });

// --- Completed and other final states ---
push(inv('inv-052', { number: '0000052', supplierId: 's-bright', totalAmount: 2_750_000, state: 'REJECTED', dueDate: '2026-11-02', flow: 'NOT_CLASSIFIED', flowConfidence: null, lines: [], anomalies: [], authorityStatus: null, authorityCheckedAt: null,
  rejection: { code: 'SIGNATURE_FAILED', note: null }, note: { code: 'NOTE_SIGNATURE_FAILED' }, receivedAt: '2026-10-31T07:40:00', trust: 'LOW' }));
push(inv('inv-081', { number: '0000081', supplierId: 's-bright', totalAmount: 5_200_000, state: 'PAID', dueDate: '2026-10-28', invoiceDate: '2026-10-10', requestId: 'PR-0038', batchId: AUG, paymentRef: 'PAY-CF-2026-0042', receivedAt: '2026-10-10T09:00:00' }));
push(inv('inv-082', { number: '0000082', supplierId: 's-bright', totalAmount: 4_700_000, state: 'PAID', dueDate: '2026-10-28', invoiceDate: '2026-10-10', requestId: 'PR-0038', batchId: AUG, paymentRef: 'PAY-CF-2026-0042', receivedAt: '2026-10-10T09:02:00' }));
push(inv('inv-040', { number: '0000040', supplierId: 's-sunrise', totalAmount: 4_150_000, state: 'SENT', dueDate: '2026-10-25', flow: 'RECURRING', requestId: 'PR-0034', batchId: SEP, invoiceDate: '2026-09-28', receivedAt: '2026-09-28T09:00:00' }));
push(inv('inv-030', { number: '0000030', supplierId: 's-bright', totalAmount: 7_700_000, state: 'SIGNED', dueDate: '2026-11-03', requestId: 'PR-0037', batchId: SEP, invoiceDate: '2026-10-01', receivedAt: '2026-10-01T09:00:00', poRef: 'PO-CF-0950', receiptRef: 'GRN-CF-1990', lines: [qtyLine(7_700_000)] }));
push(inv('inv-077', { number: '0000077', supplierId: 's-skyline', totalAmount: 1_250_000, state: 'SEPARATED', dueDate: '2026-11-12', flow: 'EMPLOYEE_EXPENSE', flowConfidence: 0.92, note: { code: 'NOTE_EMPLOYEE_EXPENSE' }, receivedAt: '2026-10-26T10:00:00', lines: [], anomalies: [] }));
push(inv('inv-044', { number: '0000044', supplierId: 's-bright', totalAmount: 6_600_000, state: 'SUPERSEDED', dueDate: '2026-10-30', supersededBy: 'C26TAA-0000174', note: { code: 'NOTE_SUPERSEDED', params: { by: 'C26TAA-0000174' } }, receivedAt: '2026-10-05T09:00:00' }));

// Other entities (scope enforcement, group figures)
const other = (id: string, entityId: string, entity: Entity, number: string, sId: string, total: number, state: Invoice['state'], extra: Partial<Invoice> = {}) =>
  push(inv(id, { number, entityId, buyerTaxCode: entity.taxCode, buyerName: entity.name, supplierId: sId, totalAmount: total, state, dueDate: '2026-11-18', receivedAt: '2026-10-28T09:00:00', ...extra }));
other('inv-p301', PACK, entities[1]!, '0000301', 's-cloud', 21_500_000, 'EXCEPTION', { exception: exc({ reasons: [{ code: 'GATE_CLOSED', conditionNo: 5 }] }), conditions: [cond(5, 'FAIL', 'C5_CLOSED', { supplier: 'CloudDesk Software Ltd', entity: 'Calderwood Packaging Co.' })] });
other('inv-p302', PACK, entities[1]!, '0000302', 's-harbor', 33_000_000, 'IN_BATCH', { note: ADMITTED, batchId: 'bat-p-2026-10' });
other('inv-p303', PACK, entities[1]!, '0000303', 's-bright', 9_900_000, 'PAID', { paymentRef: 'PAY-CP-2026-0011' });
other('inv-p304', PACK, entities[1]!, '0000304', 's-harbor', 12_100_000, 'WAITING_FOR_GOODS', { note: { code: 'NOTE_WAIT_GOODS' } });
other('inv-r401', RETAIL, entities[2]!, '0000401', 's-sunrise', 5_800_000, 'IN_BATCH', { note: ADMITTED, batchId: 'bat-r-2026-10' });
other('inv-r402', RETAIL, entities[2]!, '0000402', 's-bright', 8_800_000, 'EXCEPTION', { exception: exc({ reasons: [{ code: 'LINE_NOT_MATCHED', conditionNo: 2, params: { line: 1 } }] }) });

// ---------- Audit history for the main invoices ----------
const L = (i: Invoice) => i.invoiceNumber;
const h = (id: string, rows: [string, Hand, string | null, string, Coded['params']?, string?][]) => {
  const i = invoices.find((x) => x.id === id)!;
  rows.forEach(([at, hand, who, code, params, note]) => A(i.id, L(i), at, hand, who, code, params, { entityId: i.entityId, note, model: hand === 'AI' ? AI_MODEL : undefined, task: hand === 'AI' ? code : undefined }));
};
h('inv-123', [
  ['2026-10-31T08:51:00', 'SYSTEM', null, 'EV_RECEIVED', { hash: '9f2c4a71...e41a' }],
  ['2026-10-31T08:52:00', 'RULE', null, 'EV_SIGNATURE_VALID', { trust: 'HIGH' }],
  ['2026-10-31T08:53:00', 'AI', null, 'EV_AI_FLOW', { flow: 'GOODS_WITH_ORDER', conf: 0.97, detail: 'LINES_3_DOUBTFUL' }],
  ['2026-10-31T08:54:00', 'RULE', null, 'EV_RULE_EXCEPTION', { conds: '2, 3, 5' }],
  ['2026-10-31T09:41:00', 'PERSON', 'Alice', 'EV_OPENED_EXCEPTION'],
]);
h('inv-188', [
  ['2026-10-31T08:58:00', 'AI', null, 'EV_AI_FLOW', { flow: 'GOODS_WITH_ORDER', conf: 0.96, detail: 'ALL_MATCHED' }],
  ['2026-10-31T08:59:00', 'RULE', null, 'EV_RULE_HELD', { reason: 'TAX_RISK_HOLD' }],
  ['2026-10-31T09:44:00', 'PERSON', 'Alice', 'EV_SENT_FOR_DECISION', { to: 'CHIEF_ACCOUNTANT' }],
]);
h('inv-151', [
  ['2026-10-31T09:02:00', 'RULE', null, 'EV_RULE_EXCEPTION', { conds: '5, 6' }],
  ['2026-10-31T09:47:00', 'PERSON', 'Alice', 'EV_SENT_FOR_DECISION', { to: 'PAYMENT_APPROVER', level: 'CFO' }],
]);
h('inv-149', [
  ['2026-10-28T13:45:00', 'RULE', null, 'EV_RULE_EXCEPTION', { conds: '6' }],
  ['2026-10-28T14:10:00', 'PERSON', 'Alice', 'EV_SENT_FOR_DECISION', { to: 'PAYMENT_APPROVER', level: 'CFO' }],
]);
for (const n of ['191', '192', '193']) {
  h(`inv-${n}`, [
    ['2026-10-31T09:10:00', 'RULE', null, 'EV_RULE_EXCEPTION', { conds: '6' }],
    ['2026-10-31T09:52:00', 'PERSON', 'Alice', 'EV_SENT_FOR_DECISION', { to: 'PAYMENT_APPROVER', level: 'CFO' }],
  ]);
}
h('inv-tm0415', [
  ['2026-10-30T16:20:00', 'SYSTEM', null, 'EV_RECEIVED', { hash: '4d19b8e0...77c2' }],
  ['2026-10-30T16:21:00', 'AI', null, 'EV_AI_FLOW', { flow: 'UNSUPPORTED_FOREIGN', conf: 0.95, detail: 'NO_VN_TAX_CODE' }],
  ['2026-10-30T16:21:00', 'RULE', null, 'EV_RULE_EXCEPTION_NEVER', {}],
]);
h('inv-140', [
  ['2026-10-31T09:20:00', 'SYSTEM', null, 'EV_RECEIVED', { hash: '71a0c3d5...0b96' }],
  ['2026-10-31T09:21:00', 'RULE', null, 'EV_AI_FAILED'],
]);
h('inv-131', [
  ['2026-10-22T10:00:00', 'SYSTEM', null, 'EV_RECEIVED_MAIL', { msg: 'MSG-0402', hash: '5be2d611...c4a0' }],
  ['2026-10-22T10:05:00', 'RULE', null, 'EV_RULE_EXCEPTION', { conds: '3, 5' }],
  ['2026-10-22T11:15:00', 'PERSON', 'Alice', 'EV_CORRECTION_SENT', { to: 'CloudDesk Software Ltd' }],
]);
h('inv-098', [['2026-10-20T10:02:00', 'RULE', null, 'EV_RULE_ADMITTED', { batch: 'Tháng 10/2026' }]]);
h('inv-150', [['2026-10-27T09:02:00', 'SYSTEM', null, 'EV_RECEIVED_MAIL', { msg: 'MSG-0409', hash: '3b7d10c2...a58e' }], ['2026-10-27T09:05:00', 'RULE', null, 'EV_RULE_WAIT_ACCEPTANCE', { po: 'PO-CF-1020' }]]);
h('inv-160', [['2026-10-29T11:00:00', 'SYSTEM', null, 'EV_RECEIVED_MAIL', { msg: 'MSG-0412', hash: '2c88f0a1...d3e7' }], ['2026-10-29T11:03:00', 'RULE', null, 'EV_RULE_WAIT_GOODS', { po: 'PO-CF-1021' }]]);
h('inv-052', [['2026-10-31T07:40:00', 'SYSTEM', null, 'EV_RECEIVED', { hash: '00aa11bb...22cc' }], ['2026-10-31T07:41:00', 'RULE', null, 'EV_SIGNATURE_FAILED']]);
for (const id of ['inv-157', 'inv-161']) h(id, [['2026-10-28T09:00:00', 'SYSTEM', null, 'EV_RECEIVED', { hash: 'a1b2c3d4...e5f6' }], ['2026-10-28T09:03:00', 'RULE', null, 'EV_RULE_WAIT_ACCEPTANCE', { po: invoices.find((x) => x.id === id)!.poRef ?? '' }]]);
for (const i of invoices) {
  if (!audit.some((a) => a.objectId === i.id)) {
    A(i.id, L(i), i.receivedAt, 'SYSTEM', null, i.mailboxMessageId ? 'EV_RECEIVED_MAIL' : 'EV_RECEIVED', { hash: i.hash, msg: i.mailboxMessageId ?? '' }, { entityId: i.entityId });
    if (i.state === 'IN_BATCH' || i.state === 'SIGNED' || i.state === 'SENT' || i.state === 'PAID') A(i.id, L(i), addMinutes(i.receivedAt, 2), 'RULE', null, 'EV_RULE_ADMITTED', { batch: 'Tháng 10/2026' }, { entityId: i.entityId });
    if (i.state === 'PAID') A(i.id, L(i), '2026-10-29T14:20:00', 'ERP', null, 'EV_PAID', { ref: i.paymentRef ?? '' }, { entityId: i.entityId, eventType: 'PAID_STATUS' });
  }
}
function addMinutes(s: string, m: number): string {
  const d = new Date(Date.parse(s + 'Z') + m * 60_000);
  return d.toISOString().slice(0, 19);
}
// A few non-invoice audit entries (configuration, gates, users, signatures)
A('PR-0043', 'PR-0043', '2026-10-31T09:40:00', 'PERSON', 'Carol', 'EV_SIGNED', { version: 2, hash: '31c0de47...9b05' }, { objectType: 'REQUEST', eventType: 'SIGNATURE' });
A('PR-0038', 'PR-0038', '2026-10-29T14:20:00', 'ERP', null, 'EV_PAID', { ref: 'PAY-CF-2026-0042' }, { objectType: 'REQUEST', eventType: 'PAID_STATUS' });
A('bat-2026-10', 'Tháng 10/2026', '2026-10-31T09:30:00', 'PERSON', 'Alice', 'EV_BATCH_RELEASED', { requests: 3 }, { objectType: 'BATCH', eventType: 'PERSON_DECISION' });
A('inv-098', 'C26TAA-0000098', '2026-10-31T10:12:00', 'PERSON', 'Alice', 'EV_SAMPLE_OK', {}, { eventType: 'SAMPLE_CHECK' });
A('policy-foods', 'Calderwood Foods Co.', '2026-10-28T11:05:00', 'PERSON', 'Evan', 'EV_POLICY_CHANGED', { text: 'POLICY_SEED' }, { objectType: 'ENTITY_POLICY', eventType: 'CONFIGURATION_CHANGE' });
A('gate-harbor-foods', 'Harbor Cartons Ltd / Calderwood Foods Co.', '2026-10-12T10:30:00', 'PERSON', 'Gina', 'EV_GATE_OPENED', { accuracy: 98.4, compared: 64 }, { objectType: 'GATE', eventType: 'GATE_CHANGE', entityId: null });
A('group', 'Group', '2026-10-30T15:12:00', 'PERSON', 'Gina', 'EV_LIMITS_SEED', {}, { objectType: 'GROUP', eventType: 'CONFIGURATION_CHANGE', entityId: null });
A('u-dan', 'Dan', '2026-10-29T09:00:00', 'PERSON', 'Evan', 'EV_USER_ROLE_SET', { role: 'PAYMENT_APPROVER', level: 'DEPARTMENT_HEAD' }, { objectType: 'USER', eventType: 'USER_CHANGE' });
A('ent-retail', 'Calderwood Retail Co.', '2026-10-12T10:00:00', 'PERSON', 'Gina', 'EV_ENTITY_ADDED', { taxCode: '0100000033' }, { objectType: 'ENTITY', eventType: 'CONFIGURATION_CHANGE', entityId: null });
A('del-1', 'Carol - Fiona', '2026-10-30T09:00:00', 'PERSON', 'Carol', 'EV_DELEGATION_CREATED', { to: 'Fiona', from: '03/11/2026', until: '14/11/2026' }, { objectType: 'DELEGATION', eventType: 'DELEGATION' });
A('MSG-0418', 'MSG-0418', '2026-10-31T09:30:00', 'SYSTEM', null, 'EV_MAILBOX_FETCH', { messages: 2 }, { objectType: 'MAILBOX', eventType: 'MAILBOX' });
audit.sort((a, b) => a.at.localeCompare(b.at));

// ---------- Batches and payment requests ----------
const batches: Batch[] = [
  {
    id: NOV, entityId: FOODS, period: '2026-11', label: 'Tháng 11/2026', state: 'OPEN', closedAt: null, releasedAt: null, releasedBy: null, preparedBy: null,
    sample: [], selectedWithoutAi: false, expansions: [], reopenedNote: null, version: 1,
  },
  {
    id: OCT, entityId: FOODS, period: '2026-10', label: 'Tháng 10/2026', state: 'IN_SIGNING', closedAt: '2026-10-31T09:10:00', releasedAt: '2026-10-31T09:30:00', releasedBy: 'u-alice', preparedBy: 'u-alice',
    sample: [
      { invoiceId: 'inv-098', why: { code: 'WHY_HIGH_VALUE', params: { since: '12/10/2026' } }, mark: 'OK', errorReason: null, markedBy: 'Alice', markedAt: '2026-10-31T10:12:00', expansionNo: 0 },
      { invoiceId: 'inv-099', why: { code: 'WHY_EXPANSION', params: {} }, mark: 'OK', errorReason: null, markedBy: 'Alice', markedAt: '2026-10-31T10:15:00', expansionNo: 1 },
    ],
    selectedWithoutAi: false,
    expansions: [{ no: 1, at: '2026-10-31T10:05:00', byName: 'Alice', reason: 'Kiểm tra thêm hóa đơn Harbor Cartons tiếp theo trước khi phát hành', added: 1 }],
    reopenedNote: null, version: 4,
  },
  { id: SEP, entityId: FOODS, period: '2026-09', label: 'Tháng 9/2026', state: 'SIGNED', closedAt: '2026-10-08T09:00:00', releasedAt: '2026-10-08T11:00:00', releasedBy: 'u-alice', preparedBy: 'u-alice', sample: [], selectedWithoutAi: false, expansions: [], reopenedNote: null, version: 6 },
  { id: AUG, entityId: FOODS, period: '2026-08', label: 'Tháng 8/2026', state: 'COMPLETED', closedAt: '2026-09-09T09:00:00', releasedAt: '2026-09-09T11:00:00', releasedBy: 'u-alice', preparedBy: 'u-alice', sample: [], selectedWithoutAi: false, expansions: [], reopenedNote: null, version: 9 },
  { id: 'bat-p-2026-10', entityId: PACK, period: '2026-10', label: 'Tháng 10/2026', state: 'OPEN', closedAt: null, releasedAt: null, releasedBy: null, preparedBy: null, sample: [], selectedWithoutAi: false, expansions: [], reopenedNote: null, version: 1 },
  { id: 'bat-r-2026-10', entityId: RETAIL, period: '2026-10', label: 'Tháng 10/2026', state: 'OPEN', closedAt: null, releasedAt: null, releasedBy: null, preparedBy: null, sample: [], selectedWithoutAi: false, expansions: [], reopenedNote: null, version: 1 },
];

const sig = (userId: string, name: string, role: PaymentRequest['signatures'][number]['role'], at: string, step: 1 | 2, hash: string): PaymentRequest['signatures'][number] => ({ userId, name, role, at, onBehalfOfName: null, contentHash: hash, step });
const req = (o: Partial<PaymentRequest> & Pick<PaymentRequest, 'id' | 'batchId' | 'supplierId' | 'invoiceIds' | 'total' | 'level' | 'state'>): PaymentRequest => ({
  entityId: FOODS, removedInvoiceIds: [], signatures: [], flags: { newSupplier: false, bankChanged: false }, sendStatus: 'NOT_SENT', attempts: [], paymentRef: null,
  declineReason: null, declinedByName: null, individuallyApproved: false, summaryAvailable: true, releasedAt: '2026-10-31T09:30:00', releasedBy: 'u-alice', version: 1, ...o,
});
const requests: PaymentRequest[] = [
  req({ id: 'PR-0042', batchId: OCT, supplierId: 's-harbor', invoiceIds: ['inv-098', 'inv-099', 'inv-102'], total: 53_000_000, level: 'CFO', state: 'AWAITING_CHIEF_ACCOUNTANT' }),
  req({ id: 'PR-0043', batchId: OCT, supplierId: 's-sunrise', invoiceIds: ['inv-096'], total: 4_400_000, level: 'DEPARTMENT_HEAD', state: 'AWAITING_PAYMENT_APPROVER', signatures: [sig('u-carol', 'Carol', 'CHIEF_ACCOUNTANT', '2026-10-31T09:40:00', 1, '31c0de47...9b05')], version: 2 }),
  req({ id: 'PR-0044', batchId: OCT, supplierId: 's-cloud', invoiceIds: ['inv-110'], total: 12_650_000, level: 'DEPARTMENT_HEAD', state: 'AWAITING_CHIEF_ACCOUNTANT', flags: { newSupplier: false, bankChanged: true } }),
  req({ id: 'PR-0037', batchId: SEP, supplierId: 's-bright', invoiceIds: ['inv-030'], total: 7_700_000, level: 'DEPARTMENT_HEAD', state: 'SIGNED', sendStatus: 'FAILED', releasedAt: '2026-10-08T11:00:00', version: 5,
    signatures: [sig('u-carol', 'Carol', 'CHIEF_ACCOUNTANT', '2026-10-28T10:10:00', 1, 'a41f77c0...1d2e'), sig('u-dan', 'Dan', 'PAYMENT_APPROVER', '2026-10-28T11:00:00', 2, 'a41f77c0...1d2e')],
    attempts: [1, 2, 3].map((n) => ({ no: n, at: `2026-10-28T11:${String(n * 10).padStart(2, '0')}:00`, manual: false, byName: null, result: 'FAILED' as const })) }),
  req({ id: 'PR-0034', batchId: SEP, supplierId: 's-sunrise', invoiceIds: ['inv-040'], total: 4_150_000, level: 'DEPARTMENT_HEAD', state: 'SENT', sendStatus: 'IN_ERP', releasedAt: '2026-10-08T11:00:00', version: 5,
    signatures: [sig('u-carol', 'Carol', 'CHIEF_ACCOUNTANT', '2026-10-09T10:10:00', 1, '77aa90be...5c1d'), sig('u-dan', 'Dan', 'PAYMENT_APPROVER', '2026-10-09T11:00:00', 2, '77aa90be...5c1d')],
    attempts: [{ no: 1, at: '2026-10-09T11:05:00', manual: false, byName: null, result: 'ACCEPTED' }] }),
  req({ id: 'PR-0038', batchId: AUG, supplierId: 's-bright', invoiceIds: ['inv-081', 'inv-082'], total: 9_900_000, level: 'DEPARTMENT_HEAD', state: 'PAID', sendStatus: 'PAID', paymentRef: 'PAY-CF-2026-0042', releasedAt: '2026-09-09T11:00:00', version: 6,
    signatures: [sig('u-carol', 'Carol', 'CHIEF_ACCOUNTANT', '2026-09-10T10:10:00', 1, 'be10c5d7...0a9f'), sig('u-dan', 'Dan', 'PAYMENT_APPROVER', '2026-09-10T11:00:00', 2, 'be10c5d7...0a9f')],
    attempts: [{ no: 1, at: '2026-09-10T11:05:00', manual: false, byName: null, result: 'ACCEPTED' }] }),
  req({ id: 'PR-0040', batchId: SEP, supplierId: 's-harbor', invoiceIds: [], removedInvoiceIds: ['inv-149'], total: 0, level: 'DEPARTMENT_HEAD', state: 'CANCELLED', releasedAt: '2026-10-08T11:00:00', declineReason: 'Đã gỡ hết các dòng' }),
  req({ id: 'PR-0041', batchId: SEP, supplierId: 's-cloud', invoiceIds: [], removedInvoiceIds: ['inv-131'], total: 0, level: 'DEPARTMENT_HEAD', state: 'CANCELLED', releasedAt: '2026-10-08T11:00:00', declineReason: 'Giá khác với hợp đồng', declinedByName: 'Dan' }),
];

const delegations: Delegation[] = [
  { id: 'del-1', entityId: FOODS, delegatorId: 'u-carol', delegateId: 'u-fiona', from: '2026-11-03', to: '2026-11-14', reason: 'Nghỉ phép năm', revokedAt: null },
  { id: 'del-2', entityId: FOODS, delegatorId: 'u-carol', delegateId: 'u-dan', from: '2026-10-12', to: '2026-10-16', reason: 'Dự hội nghị', revokedAt: null },
  { id: 'del-3', entityId: FOODS, delegatorId: 'u-dan', delegateId: 'u-fiona', from: '2026-10-05', to: '2026-10-07', reason: 'Đi đào tạo', revokedAt: '2026-10-04T16:00:00' },
  { id: 'del-4', entityId: FOODS, delegatorId: 'u-fiona', delegateId: 'u-dan', from: '2026-11-20', to: '2026-11-24', reason: 'Đi công tác', revokedAt: null },
];

const N = (id: number, userId: string, kind: Notification['kind'], at: string, read: boolean, objectType: Notification['objectType'], objectId: string, params: Notification['params']): Notification => ({ id: `ntf-${String(id).padStart(3, '0')}`, userId, kind, at, read, objectType, objectId, params });
const notifications: Notification[] = [
  N(1, 'u-alice', 'EXCEPTION_OPENED', '2026-10-31T09:48:00', false, 'INVOICE', 'inv-123', { invoice: 'C26TAA-0000123', reason: 'GATE_CLOSED', supplier: 'Brightfield Paper Ltd', amount: 8_098_750, more: 3 }),
  N(2, 'u-alice', 'REQUEST_RETURNED', '2026-10-31T09:20:00', false, 'INVOICE', 'inv-131', { request: 'PR-0041', by: 'Dan', reason: 'Giá khác với hợp đồng' }),
  N(3, 'u-alice', 'ACCEPTANCE_REJECTED', '2026-10-30T16:05:00', false, 'INVOICE', 'inv-150', { invoice: 'C26TAA-0000150', by: 'Rowan', note: 'Chỉ giao được 2 trên 5 ngày', supplier: 'Lakeside Facility Services Ltd' }),
  N(4, 'u-alice', 'REPLY_REMINDER', '2026-10-30T08:00:00', true, 'INVOICE', 'inv-131', { invoice: 'C26TAA-0000131', sent: '22/10/2026', supplier: 'CloudDesk Software Ltd' }),
  N(5, 'u-alice', 'REQUEST_CANCELLED', '2026-10-29T14:30:00', true, 'REQUEST', 'PR-0040', { request: 'PR-0040' }),
  N(6, 'u-alice', 'EXCEPTION_OPENED', '2026-10-28T10:12:00', true, 'INVOICE', 'inv-140', { invoice: 'C26TAA-0000140', reason: 'AI_UNAVAILABLE', supplier: 'Harbor Cartons Ltd', amount: 14_300_000, more: 0 }),
  N(7, 'u-carol', 'BATCH_RELEASED', '2026-10-31T09:35:00', false, 'SIGNING', 'signing', { count: 3, batch: 'Tháng 10/2026' }),
  N(8, 'u-carol', 'DECISION_WAITING', '2026-10-31T09:44:00', false, 'INVOICE', 'inv-188', { invoice: 'C26TAA-0000188', supplier: 'Eastbay Trading', amount: 24_200_000 }),
  N(9, 'u-carol', 'SIGNATURE_REMINDER', '2026-10-31T08:00:00', false, 'REQUEST', 'PR-0042', { request: 'PR-0042', due: '12/11/2026' }),
  N(10, 'u-carol', 'SIGNATURE_WAITING', '2026-10-28T11:05:00', true, 'REQUEST', 'PR-0037', { request: 'PR-0037', released: '28/10/2026' }),
  N(11, 'u-fiona', 'SIGNATURE_WAITING', '2026-10-31T09:40:00', false, 'REQUEST', 'PR-0043', { request: 'PR-0043', by: 'Carol', at: '31/10/2026 09:40', level: 'DEPARTMENT_HEAD' }),
  N(12, 'u-fiona', 'DECISION_WAITING', '2026-10-31T09:47:00', false, 'INVOICE', 'inv-151', { invoice: 'C26TAA-0000151', supplier: 'Brightfield Paper Ltd', amount: 63_800_000 }),
  N(13, 'u-dan', 'SIGNATURE_WAITING', '2026-10-31T09:40:00', false, 'REQUEST', 'PR-0043', { request: 'PR-0043', by: 'Carol', at: '31/10/2026 09:40', level: 'DEPARTMENT_HEAD' }),
  N(14, 'u-dan', 'SIGNATURE_REMINDER', '2026-10-31T08:00:00', true, 'REQUEST', 'PR-0037', { request: 'PR-0037', due: '28/10/2026' }),
];

const gate = (id: string, supplierId: string, entityId: string, state: Gate['state'], openSince: string | null, compared: number, simulated: number, unchanged: number, sampled = 0, errors = 0): Gate => ({ id, supplierId, entityId, state, openSince, compared, simulatedCompared: simulated, unchanged, sampled, sampleErrors: errors, version: 1 });
const gates: Gate[] = [
  gate('g-bright-foods', 's-bright', FOODS, 'CLOSED', null, 50, 50, 49),
  gate('g-harbor-foods', 's-harbor', FOODS, 'OPEN', '2026-10-12', 64, 50, 63, 14, 0),
  gate('g-sunrise-foods', 's-sunrise', FOODS, 'CLOSED', null, 30, 30, 29),
  gate('g-bright-pack', 's-bright', PACK, 'CLOSED', null, 52, 52, 49),
  gate('g-cloud-pack', 's-cloud', PACK, 'OPEN', '2026-10-02', 80, 0, 72, 26, 2),
];

const matrices: ApprovalMatrix[] = [
  { entityId: FOODS, tiers: [{ level: 'DEPARTMENT_HEAD', from: 0, upTo: 50_000_000, approverIds: ['u-dan'] }, { level: 'CFO', from: 50_000_000, upTo: null, approverIds: ['u-fiona'] }], version: 1 },
  { entityId: PACK, tiers: [{ level: 'DEPARTMENT_HEAD', from: 0, upTo: 50_000_000, approverIds: [] }, { level: 'CFO', from: 50_000_000, upTo: null, approverIds: [] }], version: 1 },
  { entityId: RETAIL, tiers: [{ level: 'DEPARTMENT_HEAD', from: 0, upTo: 50_000_000, approverIds: [] }, { level: 'CFO', from: 50_000_000, upTo: null, approverIds: [] }], version: 1 },
];

const prof = (id: string, sId: string, location: string, contract: string, priceType: 'FIXED' | 'USAGE_BASED', price: number | null, thr: number | null, status: 'ACTIVE' | 'INACTIVE', earlier: [string, number][]): RecurringProfile => ({
  id, entityId: FOODS, supplierId: sId, location, contract, period: 'MONTHLY', priceType, contractPrice: price, deviationThreshold: thr, status, earlier: earlier.map(([label, amount]) => ({ label, amount })), version: 1,
});
const profiles: RecurringProfile[] = [
  prof('rp-1', 's-sunrise', 'Xưởng 1', 'EL-2026-014', 'USAGE_BASED', null, 30, 'ACTIVE', [['Th8', 4_050_000], ['Th9', 4_250_000], ['Th10', 4_150_000]]),
  prof('rp-2', 's-sunrise', 'Xưởng 2', 'EL-2026-015', 'FIXED', 4_400_000, null, 'ACTIVE', [['Th8', 4_400_000], ['Th9', 4_400_000], ['Th10', 4_400_000]]),
  prof('rp-3', 's-cloud', 'Trụ sở chính', 'CD-2026-003', 'FIXED', 3_080_000, null, 'ACTIVE', [['Th8', 3_080_000], ['Th9', 3_080_000]]),
  prof('rp-4', 's-sunrise', 'Chi nhánh bán lẻ', 'EL-2025-091', 'USAGE_BASED', null, 30, 'INACTIVE', []),
];

const M = (id: string, sender: string, at: string, subject: string, attachments: MailboxMessage['attachments']): MailboxMessage => ({ id, entityId: FOODS, sender, receivedAt: at, subject, attachments });
const mailbox: MailboxMessage[] = [
  M('MSG-0418', 'Brightfield Paper Ltd', '2026-10-31T09:30:00', 'Hóa đơn tháng 10 và bảng đối chiếu', [
    { fileName: 'inv-C26TAA-0000174.xml', result: 'ACCEPTED', invoiceId: 'inv-174', invoiceNumber: 'C26TAA-0000174' },
    { fileName: 'statement-oct.pdf', result: 'REJECTED', rejection: 'XML_NOT_SUPPORTED' },
  ]),
  M('MSG-0417', 'Harbor Cartons Ltd', '2026-10-31T09:15:00', 'Gửi lại hóa đơn 0000098', [{ fileName: 'inv-C26TAA-0000098.xml', result: 'REJECTED', rejection: 'EXACT_DUPLICATE' }]),
  M('MSG-0416', 'Sunrise Electric Utility', '2026-10-31T09:00:00', 'Thông báo giá điện tháng 11', [{ fileName: null, result: 'NO_ATTACHMENT' }]),
  M('MSG-0415', 'Eastbay Trading', '2026-10-30T16:40:00', 'Hóa đơn đơn hàng 0311', [{ fileName: 'inv-EB-2026-0311.xml', result: 'REJECTED', rejection: 'BUYER_OTHER_ENTITY' }]),
  M('MSG-0414', 'CloudDesk Software Ltd', '2026-10-30T14:10:00', 'Hóa đơn thuê bao và dịch vụ hỗ trợ', [
    { fileName: 'inv-C26TAA-0000168.xml', result: 'ACCEPTED', invoiceId: 'inv-168', invoiceNumber: 'C26TAA-0000168' },
    { fileName: 'inv-C26TAA-0000169.xml', result: 'ACCEPTED', invoiceId: 'inv-169', invoiceNumber: 'C26TAA-0000169' },
    { fileName: 'inv-C26TAA-0000170.xml', result: 'REJECTED', rejection: 'NOT_READABLE_XML' },
  ]),
];

const acceptances: AcceptanceItem[] = [
  { id: 'acc-1', entityId: FOODS, invoiceId: 'inv-150', poRef: 'PO-CF-1020', serviceLines: 'Vệ sinh văn phòng, 5 ngày', createdByErpUser: 'erp.buyer1', status: 'PENDING', decidedBy: null, decidedAt: null, note: null, version: 1 },
  { id: 'acc-2', entityId: FOODS, invoiceId: 'inv-157', poRef: 'PO-CF-1024', serviceLines: 'Chăm sóc cảnh quan, tháng 10', createdByErpUser: 'erp.rowan', status: 'PENDING', decidedBy: null, decidedAt: null, note: null, version: 1 },
  { id: 'acc-3', entityId: FOODS, invoiceId: 'inv-161', poRef: 'PO-CF-1027', serviceLines: 'Đào tạo an toàn, 2 buổi', createdByErpUser: 'erp.buyer1', status: 'PENDING', decidedBy: null, decidedAt: null, note: null, version: 1 },
];

// ---------- ERP simulator data derived from the invoices ----------
// Explicit orders and receipts for the invoices that show the three-way match view (D-222). The loop below skips a PO that already exists,
// and with it the receipt it would have made, so each receipt is written here too. All figures agree with the amounts and conditions above.
const purchaseOrders: SimPurchaseOrder[] = [
  {
    id: 'PO-CF-1007', entityId: FOODS, supplierId: 's-bright', kind: 'GOODS', createdByPersona: 'BUYER', createdAt: '2026-10-12T09:00:00', receivedQuantity: 110,
    // The same lines as the Documents tab of the SCR-12 wireframe: 20 cartons (5 reams each) at 300,000, 40 boxes, and 50 pieces at 8,500.
    lines: [
      { item: 'Giấy photo A4, loại 1 (thùng 5 ream)', quantity: 20, unit: 'thùng', price: 300_000, unitFactor: 5, baseUnit: 'ream' },
      { item: 'Ghim bấm No.10, hộp', quantity: 40, unit: 'hộp', price: 12_000 },
      { item: 'Bìa còng A4 xanh, 5 cm', quantity: 50, unit: 'cái', price: 8_500 },
    ],
  },
  {
    id: 'PO-CF-1018', entityId: FOODS, supplierId: 's-cloud', kind: 'SERVICE', createdByPersona: 'ACCEPTOR', createdAt: '2026-10-12T09:00:00', receivedQuantity: 5,
    lines: [{ item: 'Dịch vụ hỗ trợ CloudDesk, tháng 10', quantity: 5, unit: 'ngày', price: 1_204_000 }],
  },
  {
    id: 'PO-CF-1012', entityId: FOODS, supplierId: 's-eastbay', kind: 'GOODS', createdByPersona: 'BUYER', createdAt: '2026-10-12T09:00:00', receivedQuantity: 2_000,
    lines: [{ item: 'Thùng carton 5 lớp 40x30x30', quantity: 2_000, unit: 'cái', price: 11_000 }],
  },
  {
    id: 'PO-CF-1015', entityId: FOODS, supplierId: 's-bright', kind: 'GOODS', createdByPersona: 'BUYER', createdAt: '2026-10-12T09:00:00', receivedQuantity: 800,
    lines: [{ item: 'Giấy photo A4, loại 1', quantity: 800, unit: 'ream', price: 72_500 }],
  },
];
const receipts: SimReceipt[] = [
  { id: 'GRN-CF-2031', entityId: FOODS, poId: 'PO-CF-1007', persona: 'WAREHOUSE_KEEPER', quantity: 110, note: '3/3 dòng', at: '2026-10-18T09:00:00', lines: [{ poLineNo: 1, quantity: 20 }, { poLineNo: 2, quantity: 40 }, { poLineNo: 3, quantity: 50 }] },
  { id: 'ACC-CF-1018', entityId: FOODS, poId: 'PO-CF-1018', persona: 'ACCEPTOR', quantity: 5, note: '5/5', at: '2026-10-21T09:00:00' },
  { id: 'GRN-CF-2040', entityId: FOODS, poId: 'PO-CF-1012', persona: 'WAREHOUSE_KEEPER', quantity: 2_000, note: '2000/2000', at: '2026-10-18T09:00:00' },
  { id: 'GRN-CF-2044', entityId: FOODS, poId: 'PO-CF-1015', persona: 'WAREHOUSE_KEEPER', quantity: 800, note: '800/800', at: '2026-10-18T09:00:00' },
];
const dayBefore = (date: string, days: number): string => new Date(Date.parse(date) - days * 86_400_000).toISOString().slice(0, 10);
for (const i of invoices) {
  if (!i.poRef || !i.poRef.startsWith('PO-') || purchaseOrders.some((p) => p.id === i.poRef)) continue;
  const service = i.flow === 'SERVICES_WITH_ORDER';
  // A first line that states quantity, unit, and unit price (D-241) gives the order line the same figures; any other invoice keeps the generic line.
  const l1 = i.lines[0];
  const stated = l1 && l1.quantity !== undefined && l1.unit !== undefined && l1.unitPrice !== undefined
    ? { item: l1.matchedItem ?? l1.text, quantity: l1.quantity, unit: l1.unit, price: l1.unitPrice }
    : null;
  const qty = stated ? stated.quantity : service ? 5 : 100;
  const received = i.state === 'WAITING_FOR_GOODS' ? (i.poRef === 'PO-CF-1021' ? 60 : 0) : qty;
  purchaseOrders.push({
    id: i.poRef, entityId: i.entityId, supplierId: i.supplierId!, kind: service ? 'SERVICE' : 'GOODS',
    lines: [stated ?? { item: service ? 'Dịch vụ theo hợp đồng' : 'Hàng hóa theo đơn', quantity: qty, unit: service ? 'ngày' : 'thùng', price: Math.round(i.totalAmount / 1.1 / qty) }],
    createdByPersona: service ? 'ACCEPTOR' : 'BUYER', createdAt: `${dayBefore(i.invoiceDate, 8)}T09:00:00`, receivedQuantity: received,
  });
  const at = `${dayBefore(i.invoiceDate, 2)}T09:00:00`;
  if (i.receiptRef) receipts.push({ id: i.receiptRef, entityId: i.entityId, poId: i.poRef, persona: 'WAREHOUSE_KEEPER', quantity: received, note: `${received}/${qty}`, at });
  // A service has no goods receipt: an admitted service invoice with stated figures gets the acceptance that confirms them, like ACC-CF-1018.
  else if (service && stated && i.state !== 'WAITING_FOR_GOODS') receipts.push({ id: acceptanceId(i.poRef), entityId: i.entityId, poId: i.poRef, persona: 'ACCEPTOR', quantity: received, note: `${received}/${qty}`, at });
}
if (!receipts.some((r) => r.poId === 'PO-CF-1021')) receipts.push({ id: 'GRN-CF-2050', entityId: FOODS, poId: 'PO-CF-1021', persona: 'WAREHOUSE_KEEPER', quantity: 60, note: '60/100', at: '2026-10-30T09:00:00' });

const seed = (): Db => ({
  schema: SCHEMA_VERSION,
  now: DEMO_START,
  seq: { request: 45, exception: excSeq + 1, invoice: 200, message: 419, audit: auditNo + 1, notification: 15, delegation: 5, profile: 5, batch: 12, user: 13, entity: 4, po: 1040, receipt: 2060, fetch: 1, correction: 1, notice: 1, acceptance: 4, template: 4, upload: 1 },
  group: { name: 'Calderwood Group', maxPriceTolerance: 5, maxBatchThreshold: 300_000_000, sectors: ['Điện lực'], version: 1 },
  entities, users, suppliers, purchaseOrders, receipts, invoices, batches, requests, delegations, notifications, audit, gates, matrices, profiles,
  mailbox, fetchRuns: [{ id: 'fetch-0', entityId: FOODS, state: 'SUCCEEDED', startedAt: '2026-10-31T09:30:00', finishedAt: '2026-10-31T09:30:05', newMessages: 2 }],
  acceptances,
  templates: [
    { id: 'tpl-1', kind: 'CORRECTION_REQUEST', subject: 'Đề nghị điều chỉnh hóa đơn {invoice}', body: 'Kính gửi {supplier},\n\nHóa đơn {invoice} có số liệu chưa khớp với đơn đặt hàng và phiếu nhận hàng của chúng tôi. Đề nghị Quý công ty kiểm tra và gửi lại hóa đơn điều chỉnh.\n\nTrân trọng,\n{sender}' },
    { id: 'tpl-2', kind: 'DATA_FIX_NOTICE', subject: 'Thông báo cập nhật dữ liệu cho hóa đơn {invoice}', body: 'Kính gửi bộ phận ERP,\n\nHóa đơn {invoice} của {supplier} cần cập nhật dữ liệu đơn hàng hoặc phiếu nhận hàng. Đề nghị cập nhật để hệ thống kiểm tra lại.\n\nTrân trọng,\n{sender}' },
    { id: 'tpl-3', kind: 'REISSUE_REQUEST', subject: 'Đề nghị xuất lại hóa đơn {invoice}', body: 'Kính gửi {supplier},\n\nHóa đơn {invoice} ghi sai thông tin người mua. Đề nghị Quý công ty hủy và xuất lại hóa đơn với đúng thông tin.\n\nTrân trọng,\n{sender}' },
  ],
  corrections: [{ id: 'cor-0', invoiceId: 'inv-131', kind: 'CORRECTION_REQUEST', recipient: 'ketoan@clouddesk.example', subject: 'Đề nghị điều chỉnh hóa đơn C26TAA-0000131', body: 'Kính gửi CloudDesk Software Ltd,\n\nGiá trên hóa đơn C26TAA-0000131 cao hơn đơn đặt hàng 3%. Đề nghị Quý công ty gửi lại hóa đơn điều chỉnh.\n\nTrân trọng,\nAlice', status: 'SENT', sentAt: '2026-10-22T11:15:00', aiDraft: true }],
  cancellationNotices: [],
  taxRiskList: [{ supplierId: 's-eastbay', listedAt: '2026-10-28T00:00:00' }],
  otp: {},
});

export const buildSeed = seed;

export const SEED_COUNTS = () => {
  const d = seed();
  return {
    entities: d.entities.length, users: d.users.length, suppliers: d.suppliers.length, purchaseOrders: d.purchaseOrders.length, receipts: d.receipts.length,
    invoices: d.invoices.length, batches: d.batches.length, requests: d.requests.length, delegations: d.delegations.length, notifications: d.notifications.length,
    auditEntries: d.audit.length, gates: d.gates.length, profiles: d.profiles.length, mailboxMessages: d.mailbox.length, acceptances: d.acceptances.length, templates: d.templates.length,
  };
};
