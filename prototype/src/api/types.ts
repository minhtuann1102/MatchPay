// Types named after the OpenAPI schemas (docs/06-api/openapi.yaml). Only the fields the screens use.
// All timestamps are naive local strings 'YYYY-MM-DDTHH:mm:ss'; dates are 'YYYY-MM-DD'.

export type Id = string;

export type Role =
  | 'AP_ACCOUNTANT'
  | 'CHIEF_ACCOUNTANT'
  | 'PAYMENT_APPROVER'
  | 'REQUESTING_DEPARTMENT'
  | 'ENTITY_ADMIN'
  | 'GROUP_ADMIN'
  | 'DEMO_OPERATOR';

export type ApprovalLevel = 'DEPARTMENT_HEAD' | 'CFO';

export type InvoiceState =
  | 'RECEIVED'
  | 'IN_CHECK'
  | 'WAITING_FOR_GOODS'
  | 'SEPARATED'
  | 'REJECTED'
  | 'EXCEPTION'
  | 'IN_BATCH'
  | 'SIGNED'
  | 'SENT'
  | 'PAID'
  | 'SUPERSEDED';

export type ExceptionState =
  | 'OPEN'
  | 'IN_REVIEW'
  | 'WAITING_FOR_SUPPLIER'
  | 'WAITING_FOR_DATA_FIX'
  | 'WAITING_FOR_DECISION'
  | 'CLOSED';

export type ExceptionOutcome = 'ADMITTED' | 'APPROVED_INDIVIDUALLY' | 'REJECTED' | 'SUPERSEDED' | 'AUTO_CLOSED';

export type ReasonCode =
  | 'GATE_CLOSED'
  | 'TAX_RISK_HOLD'
  | 'AI_UNAVAILABLE'
  | 'FLOW_UNCLEAR'
  | 'WRONG_BUYER_TAX_CODE'
  | 'WRONG_ENTITY_REPORTED'
  | 'NO_MATCHING_PROFILE'
  | 'LINE_NOT_MATCHED'
  | 'PRICE_OUT_OF_TOLERANCE'
  | 'QUANTITY_ABOVE_RECEIVED'
  | 'TOTAL_ABOVE_THRESHOLD'
  | 'UNUSUAL_PRICE'
  | 'POSSIBLE_DUPLICATE'
  | 'SPLIT_ORDERS'
  | 'RECURRING_OUT_OF_THRESHOLD'
  | 'UNSUPPORTED_FOREIGN_INVOICE'
  | 'WITHDRAWN_FROM_BATCH'
  | 'APPROVAL_DECLINED'
  | 'PAYMENT_FAILED'
  | 'SERVICE_ACCEPTANCE_REJECTED'
  | 'AUTHORITY_STATUS_UNAVAILABLE'
  | 'CANCELLED_AFTER_SIGNING'
  | 'REQUEST_CANCELLED_OTHER_INVOICE';

export type WithdrawReason =
  | 'SAMPLE_ERROR'
  | 'WITHDRAWN_BY_AP'
  | 'REMOVED_BY_SIGNER'
  | 'REQUEST_DECLINED'
  | 'CANCELLATION_NOTICE'
  | 'REQUEST_CANCELLED';

export type RejectionReason =
  | 'SIGNATURE_FAILED'
  | 'XML_NOT_SUPPORTED'
  | 'BUYER_TAX_CODE_MISMATCH'
  | 'EXACT_DUPLICATE'
  | 'REJECTED_BY_PERSON'
  | 'CANCELLED_AT_AUTHORITY'
  | 'REPLACED_AT_AUTHORITY'
  | 'CANCELLED_BY_SELLER';

export type InvoiceFlow =
  | 'GOODS_WITH_ORDER'
  | 'SERVICES_WITH_ORDER'
  | 'RECURRING'
  | 'UNSUPPORTED_FOREIGN'
  | 'EMPLOYEE_EXPENSE'
  | 'OTHER'
  | 'NOT_CLASSIFIED';

export type InvoiceSource = 'UPLOAD' | 'EMAIL';
export type AuthorityStatus = 'VALID' | 'ADJUSTED' | 'REPLACED' | 'CANCELLED';
export type MatchMethod = 'MAPPING_TABLE' | 'EMBEDDING_FUSION' | 'LLM_AFTER_FUSION' | 'PERSON';
export type ConditionResult = 'PASS' | 'FAIL' | 'NOT_EVALUATED';

/** Coded text: rendered in Vietnamese by i18n (`t.codes.*`). */
export interface Coded {
  code: string;
  params?: Record<string, string | number>;
}

export interface InvoiceLine {
  lineNo: number;
  text: string;
  matchedItem: string | null;
  method: MatchMethod | null;
  probability: number | null;
  amount: number;
  doubtNote?: string;
  confirmedBy?: string;
  /** Quantity data read from the XML line (optional: older sample invoices have none). */
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  /** Line number of the order line this invoice line is matched to (1-based). */
  poLineNo?: number;
  /** How many item units (the base unit of the order line, for example ream) one invoice unit holds; 1 when absent. */
  unitFactor?: number;
}

export interface Condition {
  no: 1 | 2 | 3 | 4 | 5 | 6;
  result: ConditionResult;
  detail: Coded;
}

export interface ExceptionReasonItem {
  code: ReasonCode;
  params?: Record<string, string | number>;
  conditionNo?: number;
  detail?: Coded;
  withdrawReason?: WithdrawReason;
}

export type DecisionRoute = 'CHIEF_ACCOUNTANT' | 'PAYMENT_APPROVER';

export interface InvoiceException {
  id: Id;
  state: ExceptionState;
  reasons: ExceptionReasonItem[];
  openedAt: string;
  takenBy: Id | null;
  route: DecisionRoute | null;
  requiredLevel: ApprovalLevel | null;
  sentForDecisionAt: string | null;
  outcome: ExceptionOutcome | null;
  /** Invoices decided together (split orders, BR-22). */
  linkedGroup: string | null;
  individuallyApproved: boolean;
  decisionNote: string | null;
}

export interface Invoice {
  id: Id;
  entityId: Id;
  series: string;
  number: string;
  invoiceNumber: string;
  supplierId: Id | null;
  sellerName: string;
  sellerTaxCode: string | null;
  buyerTaxCode: string;
  buyerName: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  vatAmount: number;
  state: InvoiceState;
  source: InvoiceSource;
  flow: InvoiceFlow;
  flowConfidence: number | null;
  flowReason: Coded | null;
  kind: 'ORIGINAL' | 'ADJUSTMENT' | 'REPLACEMENT';
  authorityStatus: AuthorityStatus | null;
  authorityCheckedAt: string | null;
  poRef: string | null;
  receiptRef: string | null;
  lines: InvoiceLine[];
  conditions: Condition[];
  anomalies: (Coded & { flagged: boolean })[];
  exception: InvoiceException | null;
  rejection: { code: RejectionReason; note: string | null } | null;
  /** Short state note shown in the list, e.g. 'Admitted by the Rule Engine'. */
  note: Coded | null;
  batchId: Id | null;
  requestId: Id | null;
  paymentRef: string | null;
  serviceAcceptance: { by: string; at: string; note: string } | null;
  processedBy: Id[];
  receivedAt: string;
  hash: string;
  trust: 'HIGH' | 'MEDIUM' | 'LOW';
  aiAvailable: boolean;
  /** What the Rule Engine decides when the check runs again (mock only). */
  plannedOutcome: 'IN_BATCH' | 'EXCEPTION_GATE' | 'WAITING_FOR_GOODS';
  replyDue: string | null;
  supersededBy: string | null;
  mailboxMessageId: string | null;
  version: number;
}

export interface Supplier {
  id: Id;
  name: string;
  taxCode: string | null;
  country: 'VN' | 'DE';
  /** Entities that have paid this supplier before. */
  paidBefore: Record<Id, number>;
}

export interface Entity {
  id: Id;
  name: string;
  taxCode: string;
  code: string;
  priceTolerance: number;
  batchThreshold: number;
  sampleRate: number;
  grouping: 'BY_SUPPLIER' | 'PER_INVOICE';
  mailbox: string;
  lastSyncAt: string;
  lastSyncFailed: boolean;
  version: number;
}

export interface Group {
  name: string;
  maxPriceTolerance: number;
  maxBatchThreshold: number;
  sectors: string[];
  version: number;
}

export interface User {
  id: Id;
  fullName: string;
  email: string;
  role: Role;
  entityId: Id | null;
  approvalLevel: ApprovalLevel | null;
  erpUser: string | null;
  status: 'ACTIVE' | 'DEACTIVATED';
  version: number;
}

export interface ApprovalTier {
  level: ApprovalLevel;
  from: number;
  /** Exclusive upper bound; null means no upper bound. */
  upTo: number | null;
  approverIds: Id[];
}

export interface ApprovalMatrix {
  entityId: Id;
  tiers: ApprovalTier[];
  version: number;
}

export interface Gate {
  id: Id;
  supplierId: Id;
  entityId: Id;
  state: 'OPEN' | 'CLOSED';
  openSince: string | null;
  compared: number;
  simulatedCompared: number;
  unchanged: number;
  sampled: number;
  sampleErrors: number;
  version: number;
}

export interface RecurringProfile {
  id: Id;
  entityId: Id;
  supplierId: Id;
  location: string;
  contract: string;
  period: 'MONTHLY' | 'QUARTERLY';
  priceType: 'FIXED' | 'USAGE_BASED';
  contractPrice: number | null;
  deviationThreshold: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  earlier: { label: string; amount: number }[];
  version: number;
}

export interface MailboxAttachment {
  fileName: string | null;
  result: 'ACCEPTED' | 'REJECTED' | 'NO_ATTACHMENT';
  invoiceId?: Id;
  invoiceNumber?: string;
  rejection?: RejectionReason | 'NOT_READABLE_XML' | 'NOT_XML' | 'BUYER_OTHER_ENTITY';
}

export interface MailboxMessage {
  id: string;
  entityId: Id;
  sender: string;
  receivedAt: string;
  subject: string;
  attachments: MailboxAttachment[];
}

export interface FetchRun {
  id: Id;
  entityId: Id;
  state: 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  startedAt: string;
  finishedAt: string | null;
  newMessages: number;
}

export interface SampleItem {
  invoiceId: Id;
  why: Coded;
  mark: 'OK' | 'ERROR' | null;
  errorReason: string | null;
  markedBy: string | null;
  markedAt: string | null;
  expansionNo: number;
}

export interface Batch {
  id: Id;
  entityId: Id;
  period: string;
  label: string;
  state: 'OPEN' | 'IN_REVIEW' | 'IN_SIGNING' | 'SIGNED' | 'SENT' | 'COMPLETED';
  closedAt: string | null;
  releasedAt: string | null;
  releasedBy: Id | null;
  preparedBy: Id | null;
  sample: SampleItem[];
  selectedWithoutAi: boolean;
  expansions: { no: number; at: string; byName: string; reason: string; added: number }[];
  reopenedNote: string | null;
  version: number;
}

export interface Signature {
  userId: Id;
  name: string;
  role: Role;
  at: string;
  onBehalfOfName: string | null;
  contentHash: string;
  step: 1 | 2;
}

export type RequestState =
  | 'AWAITING_CHIEF_ACCOUNTANT'
  | 'AWAITING_PAYMENT_APPROVER'
  | 'SIGNED'
  | 'SENT'
  | 'PAID'
  | 'CANCELLED';

export interface SendAttempt {
  no: number;
  at: string;
  manual: boolean;
  byName: string | null;
  result: 'FAILED' | 'ACCEPTED';
}

export interface PaymentRequest {
  id: Id;
  entityId: Id;
  batchId: Id;
  supplierId: Id;
  invoiceIds: Id[];
  removedInvoiceIds: Id[];
  total: number;
  level: ApprovalLevel;
  state: RequestState;
  signatures: Signature[];
  flags: { newSupplier: boolean; bankChanged: boolean };
  sendStatus: 'NOT_SENT' | 'SENDING' | 'RETRY' | 'FAILED' | 'IN_ERP' | 'PAID';
  attempts: SendAttempt[];
  paymentRef: string | null;
  declineReason: string | null;
  declinedByName: string | null;
  individuallyApproved: boolean;
  summaryAvailable: boolean;
  releasedAt: string;
  releasedBy: Id;
  version: number;
}

export interface Delegation {
  id: Id;
  entityId: Id;
  delegatorId: Id;
  delegateId: Id;
  from: string;
  to: string;
  reason: string;
  revokedAt: string | null;
}

export type NotificationKind =
  | 'BATCH_RELEASED'
  | 'SIGNATURE_WAITING'
  | 'EXCEPTION_OPENED'
  | 'REQUEST_RETURNED'
  | 'REQUEST_CANCELLED'
  | 'REPLY_REMINDER'
  | 'SIGNATURE_REMINDER'
  | 'ACCEPTANCE_REJECTED'
  | 'DECISION_WAITING';

export interface Notification {
  id: Id;
  userId: Id;
  kind: NotificationKind;
  params: Record<string, string | number>;
  objectType: 'INVOICE' | 'BATCH' | 'REQUEST' | 'SIGNING';
  objectId: Id;
  at: string;
  read: boolean;
}

export type AuditEventType =
  | 'AI_DECISION'
  | 'RULE_DECISION'
  | 'PERSON_DECISION'
  | 'SAMPLE_CHECK'
  | 'SIGNATURE'
  | 'DELEGATION'
  | 'MAILBOX'
  | 'PAID_STATUS'
  | 'CONFIGURATION_CHANGE'
  | 'GATE_CHANGE'
  | 'USER_CHANGE'
  | 'ACCESS_DENIED';

export type Hand = 'AI' | 'RULE' | 'PERSON' | 'SYSTEM' | 'ERP';

export interface AuditEntry {
  id: Id;
  at: string;
  entityId: Id | null;
  hand: Hand;
  actorName: string | null;
  actorId: Id | null;
  eventType: AuditEventType;
  objectType: 'INVOICE' | 'BATCH' | 'REQUEST' | 'ENTITY_POLICY' | 'APPROVAL_MATRIX' | 'GATE' | 'USER' | 'ENTITY' | 'GROUP' | 'DELEGATION' | 'MAILBOX' | 'SESSION';
  objectId: string;
  objectLabel: string;
  event: Coded;
  /** Free text typed by a person, e.g. a reason. */
  note?: string | null;
  task?: string;
  model?: string;
}

export interface AcceptanceItem {
  id: Id;
  entityId: Id;
  invoiceId: Id;
  poRef: string;
  serviceLines: string;
  createdByErpUser: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  decidedBy: Id | null;
  decidedAt: string | null;
  note: string | null;
  version: number;
}

export interface PoLine {
  item: string;
  quantity: number;
  unit: string;
  price: number;
  /** How many item units one order unit holds (for example 5 ream per thung); 1 when absent. Mock only: the API compares in the order unit. */
  unitFactor?: number;
  /** Name of the item unit when `unitFactor` is not 1 (for example ream); the order unit when absent. */
  baseUnit?: string;
}

export interface SimPurchaseOrder {
  id: string;
  entityId: Id;
  supplierId: Id;
  kind: 'GOODS' | 'SERVICE';
  lines: PoLine[];
  createdByPersona: SimPersonaKind;
  createdAt: string;
  receivedQuantity: number;
}

export type SimPersonaKind = 'BUYER' | 'WAREHOUSE_KEEPER' | 'ACCEPTOR';

export interface SimReceipt {
  id: string;
  entityId: Id;
  poId: string;
  persona: SimPersonaKind;
  quantity: number;
  note: string;
  at: string;
  /** Quantity received per order line. When absent, `quantity` counts for line 1 only. */
  lines?: { poLineNo: number; quantity: number }[];
}

export interface MessageTemplate {
  id: Id;
  kind: 'CORRECTION_REQUEST' | 'DATA_FIX_NOTICE' | 'REISSUE_REQUEST';
  subject: string;
  body: string;
}

export interface CorrectionRequest {
  id: Id;
  invoiceId: Id;
  kind: MessageTemplate['kind'];
  recipient: string;
  subject: string;
  body: string;
  status: 'DRAFT' | 'SENT';
  sentAt: string | null;
  aiDraft: boolean;
}

export interface CancellationNotice {
  id: Id;
  invoiceId: Id;
  reference: string;
  noticeDate: string;
  fileName: string | null;
  recordedAt: string;
}

export interface Db {
  schema: number;
  now: string;
  seq: Record<string, number>;
  group: Group;
  entities: Entity[];
  users: User[];
  suppliers: Supplier[];
  purchaseOrders: SimPurchaseOrder[];
  receipts: SimReceipt[];
  invoices: Invoice[];
  batches: Batch[];
  requests: PaymentRequest[];
  delegations: Delegation[];
  notifications: Notification[];
  audit: AuditEntry[];
  gates: Gate[];
  matrices: ApprovalMatrix[];
  profiles: RecurringProfile[];
  mailbox: MailboxMessage[];
  fetchRuns: FetchRun[];
  acceptances: AcceptanceItem[];
  templates: MessageTemplate[];
  corrections: CorrectionRequest[];
  cancellationNotices: CancellationNotice[];
  taxRiskList: { supplierId: Id; listedAt: string }[];
  /** Demo-only one-time codes for re-authentication, by user id. */
  otp: Record<Id, string>;
  /** Users who processed an invoice are tracked on the invoice (BR-36, D-89). */
}

// ----- Request / response shapes -----

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Session {
  userId: Id;
  fullName: string;
  role: Role;
  entityId: Id | null;
  entityName: string;
  /** MST of the user's entity, null for group-level users. */
  entityTaxCode: string | null;
  approvalLevel: ApprovalLevel | null;
}

export interface InvoiceQuery {
  view?: 'needs' | 'waiting' | 'batch' | 'done' | 'all';
  search?: string;
  state?: InvoiceState | '';
  supplierId?: string;
  flow?: InvoiceFlow | '';
  source?: InvoiceSource | '';
  reminderDue?: boolean;
  dueSoon?: boolean;
  /** Used by dashboard drill-down. */
  figure?: string;
  page?: number;
  pageSize?: number;
}

export interface WorklistSummary {
  views: Record<'needs' | 'waiting' | 'batch' | 'done' | 'all', number>;
  openExceptions: number;
  waitingDecision: number;
  waitingSupplier: number;
  dueWithin7Days: number;
  dueDates: string[];
  inBatch: number;
  inBatchTotal: number;
  waitingForGoods: number;
  lastSyncAt: string;
  lastSyncFailed: boolean;
}

export interface UploadItemResult {
  fileName: string;
  result: 'ACCEPTED' | 'REJECTED';
  invoiceId?: Id;
  invoiceNumber?: string;
  reason?: Coded;
  state?: InvoiceState;
}

// ----- Three-way match (D-222): invoice, order, and receipt (or acceptance) side by side -----
/** OK equal; WITHIN differs but breaks no rule (inside the tolerance, or a quantity above the order); DIFF breaks a rule; UNIDENTIFIED line below the AI threshold; MISSING no data. */
export type MatchCellState = 'OK' | 'WITHIN' | 'DIFF' | 'UNIDENTIFIED' | 'MISSING';
export interface MatchDoc {
  kind: 'INVOICE' | 'ORDER' | 'RECEIPT' | 'ACCEPTANCE';
  /** Null when the document does not exist yet. */
  ref: string | null;
  date: string | null;
}
export interface MatchFieldRow {
  field: 'SUPPLIER' | 'SUPPLIER_TAX' | 'BUYER_TAX' | 'ORDER_REF';
  invoice: string;
  order: string | null;
  receipt: string | null;
  state: MatchCellState;
}
export interface MatchLineRow {
  lineNo: number;
  poLineNo: number | null;
  invoiceText: string;
  itemName: string | null;
  probability: number | null;
  /** The item unit both sides are converted to before they are compared (for example ream); null when no order line is matched. */
  baseUnit: string | null;
  /** Each document keeps its own quantity, unit, and price; the converted values are in `baseUnit`. */
  invoice: { quantity: number | null; unit: string | null; unitPrice: number | null; amount: number; convertedQuantity: number | null; convertedUnitPrice: number | null; unitFactor: number };
  order: { quantity: number; unit: string; unitPrice: number; unitFactor: number; convertedQuantity: number; convertedUnitPrice: number } | null;
  /** Quantity received, in the order unit, and converted to `baseUnit`. */
  received: number | null;
  receivedConverted: number | null;
  /** Price after unit conversion against the order price; pct has one decimal. */
  price: { state: MatchCellState; pct: number | null };
  /** Invoiced quantity against the ordered quantity, in `baseUnit`: a grey note, never a failure (BR-04 and BR-15 do not cover it). */
  qtyOrdered: { state: MatchCellState; diff: number | null };
  /** Invoiced quantity against the quantity received (BR-15). */
  qtyReceived: { state: MatchCellState };
  result: 'MATCHES' | 'DIFFERS' | 'UNIDENTIFIED' | 'NO_RECEIPT' | 'NO_DATA';
  conditionNo: 2 | 3 | null;
}
export interface ThreeWayMatch {
  docs: MatchDoc[];
  tolerancePct: number;
  fields: MatchFieldRow[];
  lines: MatchLineRow[];
  /** Number of DIFF cells in the fields and lines tables. */
  differences: number;
}

export interface InvoiceDetail {
  invoice: Invoice;
  supplierName: string;
  entityName: string;
  history: AuditEntry[];
  request: PaymentRequest | null;
  batch: Batch | null;
  erpItems: { doc: string; item: string; quantity: string; price: string; syncedAt: string }[];
  actions: InvoiceActions;
  linkedGroup: Invoice[];
  requiredLevel: ApprovalLevel | null;
  tax: { listedAt: string } | null;
  corrections: CorrectionRequest[];
  cancellation: CancellationNotice | null;
  /** True when the user may open the evidence but not act. */
  readOnly: boolean;
  dueSoon: boolean;
  /** Null when the invoice has no order of its own entity to compare with. */
  match: ThreeWayMatch | null;
}

export interface InvoiceActions {
  rerunChecks: boolean;
  takeException: boolean;
  confirmLine: boolean;
  correctFlow: boolean;
  requestCorrection: boolean;
  sendForDecision: boolean;
  reject: boolean;
  recordCancellation: boolean;
  withdraw: boolean;
  decideTaxRisk: boolean;
  decideApproval: boolean;
  approvalBlockedReason: string | null;
}

export interface BatchOverview {
  batch: Batch;
  invoices: Invoice[];
  sampleInvoices: Invoice[];
  requests: PaymentRequest[];
  total: number;
  requestCountOnRelease: number;
  sampleSizeOnClose: number;
  sampleRemaining: number;
  notInSample: number;
  canResend: string[];
  hasSignature: boolean;
}

export interface DashboardData {
  period: string;
  received: number;
  touchless: number;
  touchlessBase: number;
  touchlessRate: number;
  touchlessValid: boolean;
  misplacementRate: number;
  sampled: number;
  sampleErrors: number;
  openExceptions: number;
  waitingForGoods: number;
  byState: { state: ExceptionState; count: number }[];
  byAge: { bucket: '0-2' | '3-7' | '7+'; count: number }[];
}

export interface GroupOverviewRow {
  entityId: Id;
  name: string;
  taxCode: string;
  openGates: number;
  closedGates: number;
  alerts: { supplierName: string; rate: number; errors: number; sampled: number }[];
  lastSyncAt: string;
  lastSyncFailed: boolean;
}
