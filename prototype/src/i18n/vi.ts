// All Vietnamese UI copy lives here. Keys are English; enum values stay English in data and are translated by the maps below.
import type {
  ApprovalLevel, AuditEventType, AuthorityStatus, Batch, Coded, ConditionResult, ExceptionState, InvoiceFlow, InvoiceSource, InvoiceState, MatchMethod, Notification,
  NotificationKind, PaymentRequest, ReasonCode, RejectionReason, RequestState, Role, MailboxAttachment, MessageTemplate,
} from '../api/types';
import { fmtDate, fmtDecimal, fmtMoney, fmtPercent, interpolate } from '../lib/format';

type P = Record<string, string | number> | undefined;
const s = (p: P, k: string): string => String(p?.[k] ?? '');
const n = (p: P, k: string): number => Number(p?.[k] ?? 0);
const money = (p: P, k: string): string => fmtMoney(n(p, k));
const level = (v: string): string => (v === 'CFO' ? 'CFO' : v === 'DEPARTMENT_HEAD' ? 'cấp Trưởng bộ phận' : v);

const roles: Record<Role, string> = {
  AP_ACCOUNTANT: 'Kế toán phải trả',
  CHIEF_ACCOUNTANT: 'Kế toán trưởng',
  PAYMENT_APPROVER: 'Người duyệt chi',
  REQUESTING_DEPARTMENT: 'Bộ phận đề nghị',
  ENTITY_ADMIN: 'Quản trị pháp nhân',
  GROUP_ADMIN: 'Quản trị tập đoàn',
  DEMO_OPERATOR: 'Người vận hành demo',
};
const approvalLevel: Record<ApprovalLevel, string> = { DEPARTMENT_HEAD: 'Trưởng bộ phận', CFO: 'CFO' };

const invoiceState: Record<InvoiceState, string> = {
  RECEIVED: 'Đã nhận',
  IN_CHECK: 'Đang kiểm tra',
  WAITING_FOR_GOODS: 'Chờ nhận hàng',
  SEPARATED: 'Đã tách',
  REJECTED: 'Đã từ chối',
  EXCEPTION: 'Ngoại lệ',
  IN_BATCH: 'Trong lô',
  SIGNED: 'Đã ký',
  SENT: 'Đã gửi ERP',
  PAID: 'Đã thanh toán',
  SUPERSEDED: 'Đã được thay thế',
};
const exceptionState: Record<ExceptionState, string> = {
  OPEN: 'Mới',
  IN_REVIEW: 'Đang xử lý',
  WAITING_FOR_SUPPLIER: 'Chờ nhà cung cấp',
  WAITING_FOR_DATA_FIX: 'Chờ sửa dữ liệu',
  WAITING_FOR_DECISION: 'Chờ quyết định',
  CLOSED: 'Đã đóng',
};
const requestState: Record<RequestState, string> = {
  AWAITING_CHIEF_ACCOUNTANT: 'Chờ Kế toán trưởng ký',
  AWAITING_PAYMENT_APPROVER: 'Chờ Người duyệt chi ký',
  SIGNED: 'Đã ký',
  SENT: 'Đã gửi ERP',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
};
const batchState: Record<Batch['state'], string> = { OPEN: 'Đang mở', IN_REVIEW: 'Đang rà soát', IN_SIGNING: 'Đang ký', SIGNED: 'Đã ký', SENT: 'Đã gửi', COMPLETED: 'Hoàn tất' };

const flow: Record<InvoiceFlow, string> = {
  GOODS_WITH_ORDER: 'Hàng hóa có đơn đặt hàng',
  SERVICES_WITH_ORDER: 'Dịch vụ có đơn đặt hàng',
  RECURRING: 'Định kỳ',
  UNSUPPORTED_FOREIGN: 'Không hỗ trợ: hóa đơn nước ngoài',
  EMPLOYEE_EXPENSE: 'Chi phí nhân viên',
  OTHER: 'Khác',
  NOT_CLASSIFIED: 'Chưa phân loại',
};
const source: Record<InvoiceSource, string> = { UPLOAD: 'Tải lên', EMAIL: 'Email' };
const authority: Record<AuthorityStatus, string> = { VALID: 'Hợp lệ', ADJUSTED: 'Đã điều chỉnh', REPLACED: 'Đã bị thay thế', CANCELLED: 'Đã hủy' };
const method: Record<MatchMethod, string> = {
  MAPPING_TABLE: 'Bảng ánh xạ',
  EMBEDDING_FUSION: 'Embedding kết hợp tín hiệu',
  LLM_AFTER_FUSION: 'LLM sau khi kết hợp',
  PERSON: 'Người xác nhận',
};
const rejection: Record<RejectionReason, string> = {
  SIGNATURE_FAILED: 'Kiểm tra chữ ký XML không đạt',
  XML_NOT_SUPPORTED: 'Chỉ nhận hóa đơn điện tử XML ở bản MVP',
  BUYER_TAX_CODE_MISMATCH: 'Mã số thuế người mua không khớp với pháp nhân này',
  EXACT_DUPLICATE: 'Đã có hóa đơn cùng người bán, ký hiệu và số',
  REJECTED_BY_PERSON: 'Bị từ chối bởi người xử lý',
  CANCELLED_AT_AUTHORITY: 'Đã bị hủy tại cơ quan thuế',
  REPLACED_AT_AUTHORITY: 'Đã bị thay thế tại cơ quan thuế',
  CANCELLED_BY_SELLER: 'Người bán đã hủy hóa đơn',
};

const reasonTexts: Record<ReasonCode, (p: P) => string> = {
  GATE_CLOSED: () => 'Cổng đóng',
  TAX_RISK_HOLD: () => 'Giữ do rủi ro thuế',
  AI_UNAVAILABLE: () => 'AI không khả dụng',
  FLOW_UNCLEAR: () => 'Chưa rõ luồng xử lý',
  WRONG_BUYER_TAX_CODE: () => 'Sai mã số thuế người mua',
  WRONG_ENTITY_REPORTED: () => 'Đã báo sai pháp nhân',
  NO_MATCHING_PROFILE: () => 'Không có hợp đồng định kỳ phù hợp',
  LINE_NOT_MATCHED: (p) => `Dòng ${s(p, 'line')} chưa khớp`,
  PRICE_OUT_OF_TOLERANCE: (p) => `Giá +${fmtDecimal(n(p, 'pct'), 1)}%, ngưỡng ${s(p, 'tol')}%`,
  QUANTITY_ABOVE_RECEIVED: () => 'Số lượng vượt số đã nhận',
  TOTAL_ABOVE_THRESHOLD: () => 'Tổng tiền vượt ngưỡng của lô',
  UNUSUAL_PRICE: (p) => `Giá bất thường +${fmtDecimal(n(p, 'pct'), 1)}%`,
  POSSIBLE_DUPLICATE: () => 'Nghi trùng hóa đơn',
  SPLIT_ORDERS: () => 'Nghi tách đơn',
  RECURRING_OUT_OF_THRESHOLD: () => 'Vượt ngưỡng lệch của hợp đồng định kỳ',
  UNSUPPORTED_FOREIGN_INVOICE: () => 'Không hỗ trợ: hóa đơn nước ngoài',
  WITHDRAWN_FROM_BATCH: () => 'Đã rút khỏi lô',
  APPROVAL_DECLINED: () => 'Người duyệt chi từ chối',
  PAYMENT_FAILED: () => 'Thanh toán thất bại',
  SERVICE_ACCEPTANCE_REJECTED: () => 'Nghiệm thu dịch vụ bị từ chối',
  AUTHORITY_STATUS_UNAVAILABLE: () => 'Chưa tra được trạng thái tại cơ quan thuế',
  CANCELLED_AFTER_SIGNING: () => 'Bị hủy sau khi ký',
  REQUEST_CANCELLED_OTHER_INVOICE: (p) => `Đề nghị bị hủy vì hóa đơn ${s(p, 'invoice')}`,
};

const noteTexts: Record<string, (p: P) => string> = {
  NOTE_ADMITTED: () => 'Rule Engine đã đưa vào lô',
  NOTE_SPLIT: () => 'Nhóm hóa đơn nghi tách đơn',
  NOTE_WAIT_GOODS: () => 'Chưa có phiếu nhận hàng khớp. Kiểm tra lại ở lần đồng bộ sau.',
  NOTE_AI_CHECKING: () => 'AI đang kiểm tra',
  NOTE_SIGNATURE_RUNNING: () => 'Đang kiểm tra chữ ký',
  NOTE_WAIT_ACCEPTANCE: () => 'Chờ Bộ phận đề nghị xác nhận nghiệm thu',
  NOTE_PROFILE: () => 'Khớp hợp đồng định kỳ',
  NOTE_SIGNATURE_FAILED: () => 'Kiểm tra chữ ký XML không đạt',
  NOTE_EMPLOYEE_EXPENSE: () => 'Chi phí nhân viên, xử lý ngoài luồng này',
  NOTE_SUPERSEDED: (p) => `Đã được thay thế bởi ${s(p, 'by')}`,
  NOTE_REJECTED_BY_PERSON: () => 'Bị từ chối bởi người xử lý',
  NOTE_CANCELLED_BY_SELLER: () => 'Người bán đã hủy hóa đơn',
  NOTE_APPROVED_INDIVIDUALLY: () => 'Đã được duyệt riêng',
};

const conditionTexts: Record<string, (p: P) => string> = {
  C1_OK: (p) => `Người bán, số tiền và số lượng khớp với ${s(p, 'po')} và ${s(p, 'grn')}`,
  C1_OK_SERVICE: (p) => `Khớp với ${s(p, 'po')} và xác nhận nghiệm thu dịch vụ`,
  C1_OK_PROFILE: (p) => `Khớp với hợp đồng định kỳ ${s(p, 'contract')}`,
  C2_OK: (p) => `Mọi dòng khớp, xác suất thấp nhất ${fmtDecimal(n(p, 'p'))}`,
  C2_FAIL: (p) => `Dòng ${s(p, 'line')} có xác suất ${fmtDecimal(n(p, 'p'))}, dưới ngưỡng ${fmtDecimal(n(p, 'thr'))}`,
  C3_OK: (p) => `Giá lệch ${fmtDecimal(n(p, 'price'), 1)}%, số lượng ${s(p, 'qty')}`,
  C3_OK_PROFILE: (p) => `Đúng giá hợp đồng ${money(p, 'price')}`,
  C3_FAIL: (p) => `Giá +${fmtDecimal(n(p, 'price'), 1)}%, ngưỡng ${s(p, 'tol')}%. Số lượng ${s(p, 'qty')} trên hóa đơn, đã nhận ${s(p, 'recv')}.`,
  C4_OK: (p) => `${money(p, 'total')} thấp hơn ngưỡng của lô ${money(p, 'thr')}`,
  C5_OPEN: (p) => `Cổng đang mở${p?.since ? ` từ ${s(p, 'since')}` : ''}. Nhà cung cấp không nằm trong danh sách rủi ro thuế.`,
  C5_CLOSED: (p) => `Cổng đóng cho ${s(p, 'supplier')} và ${s(p, 'entity')}.`,
  C5_TAXRISK: (p) => `${s(p, 'supplier')} nằm trong danh sách rủi ro thuế. Kế toán trưởng chưa cho phép.`,
  C5_RELEASED: () => 'Kế toán trưởng đã cho phép hóa đơn này',
  C6_OK: () => 'Không phát hiện bất thường',
  C6_PRICE: (p) => `Giá bất thường +${fmtDecimal(n(p, 'pct'), 1)}%, giới hạn ${s(p, 'limit')}%`,
  C6_DUP: (p) => `Gần trùng với ${s(p, 'other')} trong ${s(p, 'days')} ngày`,
  C6_SPLIT: (p) => `Ba đơn cho cùng nhà cung cấp từ ${s(p, 'from')} đến ${s(p, 'to')}, cộng lại ${money(p, 'total')}`,
  C_NOT_EVALUATED_FLOW: () => 'Rule Engine không đưa hóa đơn thuộc luồng này vào lô, nên không đánh giá điều kiện.',
  C_EVIDENCE_MISSING: () => 'Thiếu bằng chứng',
  C_ANOMALY_NOT_RUN: () => 'Chưa chạy kiểm tra bất thường',
  C_NO_RECEIPT: () => 'Chưa có phiếu nhận hàng nên chưa đánh giá',
  C_PASS_RECHECK: () => 'Đạt sau khi kiểm tra lại',
};

const anomalyTexts: Record<string, (p: P) => string> = {
  AN_PRICE_NONE: () => 'Không có dữ liệu giá bất thường.',
  AN_DUP_NONE: () => 'Không có. Không có hóa đơn nào của nhà cung cấp này cùng tổng tiền trong vòng 3 ngày.',
  AN_SUPPLIER_PAID: (p) => `Đã thanh toán trước đây: ${s(p, 'n')} hóa đơn. Tài khoản ngân hàng không đổi.`,
  AN_PERIOD_NONE: () => 'Không phải hóa đơn định kỳ.',
  AN_PRICE_HISTORY: (p) => `${s(p, 'item')} ${money(p, 'price')} mỗi đơn vị, so với trung vị 6 tháng ${money(p, 'median')} từ ${s(p, 'n')} lần mua: +${fmtDecimal(n(p, 'pct'), 1)}%. Giới hạn cảnh báo ${s(p, 'limit')}%.`,
  AN_ORDER_MATCH: (p) => `${s(p, 'po')} giá ${money(p, 'price')}, số lượng ${s(p, 'qty')}. ${s(p, 'grn')} đã nhận đủ. Khớp với hóa đơn.`,
  AN_ORDER_MATCH_ALL: () => 'Mỗi hóa đơn khớp với đơn đặt hàng và phiếu nhận của mình.',
  AN_DUP: (p) => `Gần trùng với ${s(p, 'other')}, cách ${s(p, 'days')} ngày, cùng tổng tiền.`,
  AN_SPLIT: (p) => `Ba đơn cho cùng nhà cung cấp từ ${s(p, 'from')} đến ${s(p, 'to')}, mỗi đơn dưới 50.000.000 ₫, cộng lại ${money(p, 'total')}. Ba ngoại lệ được quyết định cùng nhau.`,
};
const anomalyTitles: Record<string, string> = {
  AN_PRICE_NONE: 'Giá so với lịch sử',
  AN_PRICE_HISTORY: 'Giá so với lịch sử',
  AN_DUP_NONE: 'Gần trùng',
  AN_DUP: 'Gần trùng',
  AN_SUPPLIER_PAID: 'Nhà cung cấp',
  AN_PERIOD_NONE: 'Kỳ hóa đơn',
  AN_ORDER_MATCH: 'Đơn hàng và phiếu nhận',
  AN_ORDER_MATCH_ALL: 'Đơn hàng và phiếu nhận',
  AN_SPLIT: 'Tách đơn',
};

const flowReasonTexts: Record<string, (p: P) => string> = {
  FLOW_GOODS_PO: (p) => `XML tham chiếu đơn ${s(p, 'po')} và liệt kê hàng hóa đã giao.`,
  FLOW_FOREIGN: () => 'Người bán là công ty ở Đức và không có mã số thuế Việt Nam.',
};

const whyTexts: Record<string, (p: P) => string> = {
  WHY_HIGH_VALUE: (p) => `Giá trị cao nhất của lô.${p?.since ? ` Cổng của nhà cung cấp mở từ ${s(p, 'since')}, trong 30 ngày gần đây.` : ''}`,
  WHY_NEXT_RISK: () => 'Tiếp theo theo thứ tự rủi ro.',
  WHY_EXPANSION: () => 'Thêm khi mở rộng mẫu: tiếp theo theo thứ tự rủi ro.',
};

const eventTexts: Record<string, (p: P) => string> = {
  EV_RECEIVED: (p) => `Đã nhận. XML được lưu nguyên vẹn kèm mã băm ${s(p, 'hash')}.`,
  EV_RECEIVED_MAIL: (p) => `Nhận qua email${p?.msg ? ` (${s(p, 'msg')})` : ''}. XML được lưu kèm mã băm ${s(p, 'hash')}.`,
  EV_SIGNATURE_VALID: () => 'Chữ ký người bán hợp lệ. Mức tin cậy cao.',
  EV_SIGNATURE_FAILED: () => 'Kiểm tra chữ ký XML không đạt. Hóa đơn bị từ chối.',
  EV_AI_FLOW: (p) => `Luồng ${flow[s(p, 'flow') as InvoiceFlow] ?? s(p, 'flow')} (${fmtDecimal(n(p, 'conf'))}). ${p?.detail === 'LINES_3_DOUBTFUL' ? 'Đã khớp dòng 1 và 2, dòng 3 còn nghi ngờ (0,74).' : p?.detail === 'NO_VN_TAX_CODE' ? 'Lý do: không có mã số thuế Việt Nam.' : 'Đã khớp mọi dòng.'}`,
  EV_RULE_EXCEPTION: (p) => `Rule Engine quyết định ngoại lệ: điều kiện ${s(p, 'conds')} không đạt. Chưa đưa vào lô.`,
  EV_RULE_EXCEPTION_NEVER: () => 'Rule Engine quyết định ngoại lệ, trạng thái Mới. Không bao giờ đưa vào lô.',
  EV_RULE_HELD: () => 'Rule Engine giữ lại thành ngoại lệ, lý do: giữ do rủi ro thuế. Không từ chối.',
  EV_RULE_ADMITTED: (p) => `Cả sáu điều kiện đạt. Rule Engine đưa vào lô ${s(p, 'batch')}.`,
  EV_RULE_WAIT_GOODS: (p) => `Chờ nhận hàng: chưa có phiếu nhận cho ${s(p, 'po')}. Không phải ngoại lệ.`,
  EV_RULE_WAIT_ACCEPTANCE: (p) => `Chờ nhận hàng: ERP chưa có nghiệm thu cho ${s(p, 'po')}. Không phải ngoại lệ.`,
  EV_AI_FAILED: () => 'Bước AI thất bại. Rule Engine quyết định ngoại lệ, lý do AI không khả dụng. Việc tiếp nhận không bị chặn.',
  EV_OPENED_EXCEPTION: () => 'Nhận xử lý ngoại lệ. Trạng thái Đang xử lý.',
  EV_SENT_FOR_DECISION: (p) => (p?.to === 'CHIEF_ACCOUNTANT' ? 'Gửi Kế toán trưởng quyết định.' : `Kiểm tra bằng chứng và gửi Người duyệt chi quyết định${p?.level ? ` ở ${level(s(p, 'level'))}` : ''}.`),
  EV_CORRECTION_SENT: (p) => `Đã gửi yêu cầu chỉnh sửa tới ${s(p, 'to')}.`,
  EV_DATAFIX_SENT: () => 'Đã gửi thông báo sửa dữ liệu.',
  EV_REJECTED: () => 'Từ chối hóa đơn.',
  EV_CANCEL_NOTICE: (p) => `Ghi nhận thông báo hủy ${s(p, 'ref')} ngày ${fmtDate(s(p, 'date'))}.`,
  EV_CONFIRM_LINE: (p) => `Xác nhận khớp dòng ${s(p, 'line')}. Đã lưu vào bảng ánh xạ của pháp nhân.`,
  EV_CORRECT_FLOW: (p) => `Sửa luồng thành ${flow[s(p, 'flow') as InvoiceFlow] ?? s(p, 'flow')}.`,
  EV_WRONG_ENTITY: () => 'Báo sai pháp nhân. Hóa đơn ở lại pháp nhân này.',
  EV_RERUN: () => 'Chạy lại kiểm tra.',
  EV_RERUN_STILL_FAILS: (p) => `Kiểm tra lại: điều kiện ${s(p, 'conds')} vẫn chưa đạt.`,
  EV_RECHECK: (p) => (n(p, 'left') ? `Rule Engine kiểm tra lại: còn ${s(p, 'left')} điều kiện chưa đạt.` : 'Rule Engine kiểm tra lại: các điều kiện đã đạt.'),
  EV_AUTHORITY_LOOKUP: (p) => `Tra cứu trạng thái tại cơ quan thuế: ${authority[s(p, 'status') as AuthorityStatus] ?? s(p, 'status')}.`,
  EV_WITHDRAWN: () => 'Rút hóa đơn khỏi lô. Hóa đơn trở lại danh sách ngoại lệ.',
  EV_TAXRISK_RELEASED: () => 'Cho phép hóa đơn dù nhà cung cấp trong danh sách rủi ro thuế.',
  EV_TAXRISK_REJECTED: () => 'Từ chối hóa đơn bị giữ do rủi ro thuế.',
  EV_APPROVED_INDIVIDUALLY: (p) => `Duyệt riêng ở ${level(s(p, 'level'))}.`,
  EV_APPROVAL_DECLINED: () => 'Từ chối duyệt riêng.',
  EV_ACCEPTANCE_CONFIRMED: () => 'Xác nhận nghiệm thu dịch vụ. Nguồn: Bộ phận đề nghị.',
  EV_ACCEPTANCE_REJECTED: () => 'Từ chối nghiệm thu dịch vụ.',
  EV_SAMPLE_OK: () => 'Kiểm tra mẫu: đánh dấu OK.',
  EV_SAMPLE_ERROR: () => 'Kiểm tra mẫu: đánh dấu Lỗi. Hóa đơn bị rút khỏi lô.',
  EV_SAMPLE_EXPANDED: (p) => `Mở rộng mẫu, thêm ${s(p, 'added')} hóa đơn.`,
  EV_BATCH_CLOSED: (p) => `Đóng lô để rà soát: ${s(p, 'invoices')} hóa đơn, mẫu ${s(p, 'sample')} hóa đơn.`,
  EV_BATCH_RELEASED: (p) => `Phát hành lô để ký, tạo ${s(p, 'requests')} đề nghị thanh toán.`,
  EV_BATCH_REOPENED: (p) => `Mở lại lô để rà soát, hủy ${s(p, 'requests')} đề nghị.`,
  EV_REQUEST_SIGNED: (p) => `Đề nghị ${s(p, 'request')} đã được ký đủ.`,
  EV_SIGNED: (p) => `Đã ký, phiên bản đề nghị ${s(p, 'version')}, mã băm nội dung ${s(p, 'hash')}.`,
  EV_SIGNED_ON_BEHALF: (p) => `Đã ký thay ${s(p, 'for')}, phiên bản đề nghị ${s(p, 'version')}, mã băm nội dung ${s(p, 'hash')}.`,
  EV_REQUEST_DECLINED: (p) => `Từ chối đề nghị ${s(p, 'request')}. Hóa đơn trở lại ngoại lệ.`,
  EV_LINE_REMOVED: (p) => `Gỡ hóa đơn khỏi đề nghị ${s(p, 'request')}. Hóa đơn trở lại ngoại lệ.`,
  EV_REQUEST_CANCELLED: (p) => `Đề nghị ${s(p, 'request')} bị hủy. Hóa đơn trở lại ngoại lệ.`,
  EV_SENT_ERP: (p) => `Đề nghị ${s(p, 'request')} đã gửi vào ERP của pháp nhân.`,
  EV_RESENT: (p) => `Gửi lại ${s(p, 'request')} vào ERP thủ công. Cùng số đề nghị làm khóa chống trùng.`,
  EV_PAID: (p) => `Trạng thái đã thanh toán. Mã tham chiếu ${s(p, 'ref')}.`,
  EV_PO_CREATED: () => 'Tạo đơn đặt hàng trong ERP giả lập.',
  EV_POLICY_CHANGED: (p) => (p?.text === 'POLICY_SEED' ? 'Giữ ngưỡng giá 2%. Đặt tỷ lệ mẫu 10%.' : 'Cập nhật chính sách pháp nhân.'),
  EV_MATRIX_CHANGED: () => 'Cập nhật ma trận phê duyệt. Đề nghị chưa ký được tính lại.',
  EV_GATE_OPENED: (p) => `Mở cổng. Độ chính xác ${fmtPercent(n(p, 'accuracy'))} trên ${s(p, 'compared')} hóa đơn đã so sánh.`,
  EV_GATE_CLOSED: () => 'Đóng cổng.',
  EV_LIMITS_SEED: () => 'Ngưỡng lô tối đa 300.000.000 ₫. Ngưỡng giá tối đa 5%.',
  EV_LIMITS_CHANGED: (p) => `Ngưỡng giá tối đa ${s(p, 'tolerance')}%. Ngưỡng lô tối đa ${money(p, 'threshold')}.`,
  EV_SECTOR_ADDED: (p) => `Thêm ngành được phát hành hóa đơn không mã: ${s(p, 'sector')}.`,
  EV_SECTOR_REMOVED: (p) => `Bỏ ngành ${s(p, 'sector')}.`,
  EV_ENTITY_ADDED: (p) => `Thêm pháp nhân, mã số thuế ${s(p, 'taxCode')}.`,
  EV_USER_CREATED: (p) => `Tạo người dùng, vai trò ${roles[s(p, 'role') as Role] ?? s(p, 'role')}.`,
  EV_USER_ROLE_SET: (p) => `Đặt vai trò ${roles[s(p, 'role') as Role] ?? s(p, 'role')}${p?.level ? `, cấp ${approvalLevel[s(p, 'level') as ApprovalLevel] ?? s(p, 'level')}` : ''}.`,
  EV_USER_DEACTIVATED: () => 'Vô hiệu hóa người dùng.',
  EV_DELEGATION_CREATED: (p) => `Ủy quyền ký cho ${s(p, 'to')}, từ ${s(p, 'from')} đến ${s(p, 'until')}.`,
  EV_DELEGATION_REVOKED: () => 'Thu hồi ủy quyền ký.',
  EV_MAILBOX_FETCH: (p) => `Lấy thư: ${s(p, 'messages')} thư mới.`,
  EV_ACCESS_DENIED: () => 'Truy cập bị từ chối: vai trò không được phép.',
  EV_PROFILE_CREATED: (p) => `Thêm hợp đồng định kỳ ${s(p, 'contract')}.`,
  EV_PROFILE_UPDATED: (p) => `Sửa hợp đồng định kỳ ${s(p, 'contract')}.`,
  EV_PROFILE_DEACTIVATED: (p) => `Ngừng hợp đồng định kỳ ${s(p, 'contract')}.`,
};

const notificationKinds: Record<NotificationKind, string> = {
  BATCH_RELEASED: 'Chờ chữ ký',
  SIGNATURE_WAITING: 'Chờ chữ ký',
  EXCEPTION_OPENED: 'Ngoại lệ mới',
  REQUEST_RETURNED: 'Đề nghị bị trả lại',
  REQUEST_CANCELLED: 'Đề nghị bị hủy',
  REPLY_REMINDER: 'Nhắc trả lời',
  SIGNATURE_REMINDER: 'Nhắc ký',
  ACCEPTANCE_REJECTED: 'Từ chối nghiệm thu',
  DECISION_WAITING: 'Chờ quyết định',
};

const notificationText = (x: Notification): string => {
  const p = x.params;
  switch (x.kind) {
    case 'EXCEPTION_OPENED':
      if (p.reason === 'DECIDED_RELEASED') return `Kế toán trưởng đã cho phép ${s(p, 'invoice')}. ${s(p, 'supplier')}, ${money(p, 'amount')}.`;
      if (p.reason === 'DECIDED_REJECTED') return `Kế toán trưởng đã từ chối ${s(p, 'invoice')}. ${s(p, 'supplier')}, ${money(p, 'amount')}.`;
      return `${s(p, 'invoice')} trở thành ngoại lệ: ${reasonTexts[s(p, 'reason') as ReasonCode]?.({}) ?? s(p, 'reason')}. ${s(p, 'supplier')}, ${money(p, 'amount')}.${n(p, 'more') ? ` Còn ${s(p, 'more')} lý do khác trên hóa đơn.` : ''}`;
    case 'REQUEST_RETURNED':
      return `${s(p, 'request')} bị ${s(p, 'by')} trả lại: "${s(p, 'reason')}". Hóa đơn trở lại ngoại lệ và cần quyết định của bạn.`;
    case 'ACCEPTANCE_REJECTED':
      return `${s(p, 'invoice')}: ${s(p, 'by')} từ chối nghiệm thu. "${s(p, 'note')}". ${s(p, 'supplier')}. Ngoại lệ này không thể duyệt riêng.`;
    case 'REPLY_REMINDER':
      return `Yêu cầu chỉnh sửa cho ${s(p, 'invoice')} chưa có phản hồi sau 5 ngày làm việc. Đã gửi ngày ${s(p, 'sent')} tới ${s(p, 'supplier')}. Nhắc lại mỗi ngày một lần.`;
    case 'REQUEST_CANCELLED':
      return `${s(p, 'request')} đã bị hủy vì mọi dòng đã bị gỡ. Các hóa đơn trở lại ngoại lệ.`;
    case 'BATCH_RELEASED':
      return `${s(p, 'count')} đề nghị thanh toán đang chờ chữ ký của bạn. Lô ${s(p, 'batch')} đã được phát hành để ký.`;
    case 'SIGNATURE_WAITING':
      return p.by ? `${s(p, 'request')} chờ chữ ký của bạn: ${s(p, 'by')} đã ký lúc ${s(p, 'at')}. Cấp duyệt: ${approvalLevel[s(p, 'level') as ApprovalLevel] ?? s(p, 'level')}.` : `${s(p, 'request')} chờ chữ ký của bạn, phát hành ngày ${s(p, 'released')}.`;
    case 'SIGNATURE_REMINDER':
      return `${s(p, 'request')} chờ chữ ký và hạn thanh toán sớm nhất ${s(p, 'due')} đã đến gần hoặc đã qua. Nhắc lại mỗi ngày cho đến khi ký hoặc hủy.`;
    case 'DECISION_WAITING':
      return `${s(p, 'invoice')} của ${s(p, 'supplier')}, ${money(p, 'amount')}, đang chờ quyết định của bạn.`;
  }
};

const errors = {
  GENERIC: 'Không thực hiện được thao tác. Thử lại. Nếu vẫn lỗi, liên hệ quản trị viên.',
  LOAD_FAILED: 'Không tải được dữ liệu.',
  LOAD_FAILED_HINT: 'Thử lại. Nếu vẫn lỗi, liên hệ quản trị viên.',
  UNAUTHENTICATED: 'Phiên đăng nhập đã hết. Đăng nhập lại để tiếp tục.',
  DEACTIVATED: 'Tài khoản đã bị vô hiệu hóa. Liên hệ quản trị viên.',
  BAD_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  FORBIDDEN: 'Vai trò của bạn không được phép thực hiện thao tác này.',
  NOT_FOUND: 'Không tìm thấy bản ghi.',
  SERVER_ERROR: 'Máy chủ gặp lỗi. Thử lại.',
  CONFLICT: 'Mục này vừa được người khác thay đổi. Tải lại để xem thay đổi. Chưa lưu gì.',
  STALE_VERSION: 'Mục này vừa được người khác thay đổi. Tải lại để xem thay đổi. Chưa lưu gì, nội dung bạn nhập vẫn được giữ.',
  NOT_ALLOWED: 'Thao tác này không còn áp dụng cho trạng thái hiện tại.',
  NOT_ALLOWED_FOR_REASON: 'Ngoại lệ thuộc loại này không thể gửi duyệt riêng.',
  REASON_REQUIRED: 'Cần nhập lý do.',
  NOTE_REQUIRED: 'Cần nhập ghi chú.',
  NO_FILES: 'Chọn ít nhất một tệp.',
  AI_UNAVAILABLE: 'AI không trả lời. Không có lần thử lại tự động. Chạy lại kiểm tra sau hoặc từ chối hóa đơn.',
  EMAIL_FAILED: 'Không gửi được email. Thử lại.',
  RECIPIENT_INVALID: 'Địa chỉ email người nhận không hợp lệ.',
  MESSAGE_REQUIRED: 'Cần nhập tiêu đề và nội dung.',
  NOTICE_FIELDS_REQUIRED: 'Cần nhập số tham chiếu và ngày của thông báo.',
  REQUEST_SIGNED: 'Đề nghị đã được ký nên không thể rút hóa đơn.',
  PROFILE_FIELDS_REQUIRED: 'Cần nhập nhà cung cấp, địa điểm và hợp đồng.',
  CONTRACT_PRICE_REQUIRED: 'Giá hợp đồng là bắt buộc với giá cố định.',
  THRESHOLD_REQUIRED: 'Cần nhập ngưỡng lệch với giá theo mức sử dụng.',
  DUPLICATE_PROFILE: 'Đã có hợp đồng định kỳ đang hoạt động cho nhà cung cấp, địa điểm và kỳ này.',
  CREATED_THE_ORDER: 'Bạn đã tạo đơn đặt hàng của hóa đơn này. Người khác trong bộ phận cần xác nhận.',
  EMPTY_BATCH: 'Lô chưa có hóa đơn nào.',
  SAMPLE_UNMARKED: 'Còn {left} mục mẫu chưa đánh dấu. Cần đánh dấu hết trước khi phát hành.',
  SAMPLE_FULL: 'Mọi hóa đơn đã nằm trong mẫu.',
  REQUEST_ALREADY_SIGNED: 'Đề nghị {request} đã có chữ ký của {by}. Bạn vẫn có thể rút hóa đơn, hoặc người ký có thể từ chối đề nghị.',
  REQUEST_ALREADY_SIGNED_TITLE: 'Một đề nghị trong lô đã được ký',
  RESEND_NOT_ALLOWED: 'Không thể gửi lại đề nghị này vào lúc này.',
  PROCESSED_BY_YOU: 'Bạn đã xử lý hóa đơn này.',
  WRONG_CODE: 'Mã xác thực không đúng. Thử lại.',
  DELEGATE_INVALID: 'Người được ủy quyền phải là Kế toán trưởng hoặc Người duyệt chi đang hoạt động của cùng pháp nhân.',
  DATES_REQUIRED: 'Cần nhập ngày đầu và ngày cuối.',
  END_BEFORE_START: 'Ngày cuối không được trước ngày đầu.',
  START_IN_PAST: 'Ngày đầu không được ở quá khứ.',
  MAX_30_DAYS: 'Tối đa 30 ngày.',
  OVERLAP: 'Khoảng thời gian trùng với một ủy quyền khác của bạn.',
  USER_FIELDS_REQUIRED: 'Cần nhập tên và email hợp lệ.',
  EMAIL_IN_USE: 'Email đã được sử dụng',
  PASSWORD_SHORT: 'Mật khẩu cần ít nhất 8 ký tự.',
  OWN_ROLE: 'Không thể đổi vai trò hoặc vô hiệu hóa chính mình.',
  LEVEL_REQUIRED: 'Người duyệt chi cần có cấp duyệt.',
  LIMIT_INVALID: 'Giá trị không hợp lệ.',
  TAX_CODE_INVALID: 'Mã số thuế phải gồm đúng 10 chữ số.',
  TAX_CODE_DUPLICATE: 'Đã có pháp nhân với mã số thuế này.',
  POLICY_INVALID: 'Có giá trị vượt giới hạn. Chưa lưu gì.',
  MATRIX_GAP: 'Các mức để hở một khoảng số tiền chưa có cấp duyệt. Chưa lưu gì.',
  MATRIX_OVERLAP: 'Các mức bị chồng lên nhau. Chưa lưu gì.',
  MATRIX_NO_APPROVER: 'Có mức chưa có Người duyệt chi đang hoạt động. Chưa lưu gì.',
  GATE_TOO_FEW: 'Cần ít nhất 50 hóa đơn đã so sánh.',
  ORDER_REQUIRED: 'Chọn đơn đặt hàng mà phiếu nhận này thuộc về.',
  SAME_PERSON: 'Phiếu nhận phải do người khác với người tạo đơn xác nhận.',
  LINE_INVALID: 'Cần nhập hàng, số lượng và đơn giá hợp lệ.',
} as const;

const screens: Record<string, string> = {
  '/invoices': 'Hóa đơn đầu vào',
  '/invoices/:id': 'Chi tiết hóa đơn',
  '/recurring-profiles': 'Hợp đồng định kỳ',
  '/acceptance': 'Xác nhận nghiệm thu',
  '/mailbox': 'Nhật ký hộp thư',
  '/batch': 'Lô thanh toán',
  '/decisions': 'Chờ quyết định',
  '/signing': 'Ký đề nghị thanh toán',
  '/signing/requests/:id': 'Chi tiết đề nghị thanh toán',
  '/delegations': 'Ủy quyền ký',
  '/dashboard': 'Bảng điều khiển',
  '/audit-log': 'Nhật ký kiểm toán',
  '/notifications': 'Thông báo',
  '/users': 'Người dùng',
  '/entity/policy': 'Chính sách pháp nhân',
  '/entity/approval-matrix': 'Ma trận phê duyệt',
  '/group': 'Tổng quan tập đoàn',
  '/group/entities': 'Pháp nhân và hạn mức tập đoàn',
  '/group/gates': 'Cổng tự động hóa',
  '/demo/erp-simulator': 'Giả lập ERP',
};

export const t = {
  roles,
  approvalLevel,
  invoiceState,
  exceptionState,
  requestState,
  batchState,
  flow,
  source,
  authority,
  method,
  rejection,
  errors,
  screens,
  seal: { signed: 'Đã ký' },
  hands: { AI: 'AI đề xuất', RULE: 'Rule Engine', PERSON: 'Người quyết định', SYSTEM: 'Hệ thống', ERP: 'ERP' },
  trust: { HIGH: 'Cao: có chữ ký người bán và mã của cơ quan thuế', MEDIUM: 'Trung bình', LOW: 'Thấp' },
  conditionTitle: {
    1: 'Trường chính được xác nhận bởi nguồn độc lập',
    2: 'Mọi dòng khớp với xác suất đạt ngưỡng',
    3: 'Giá và số lượng trong ngưỡng, số lượng không vượt số đã nhận',
    4: 'Tổng tiền thấp hơn ngưỡng của lô',
    5: 'Cổng mở và nhà cung cấp không trong danh sách rủi ro thuế',
    6: 'Không có bất thường',
  } as Record<number, string>,
  conditionResult: { PASS: 'Đạt', FAIL: 'Không đạt', NOT_EVALUATED: 'Chưa đánh giá' } as Record<ConditionResult, string>,
  doubt: { UNIT_UNKNOWN: 'Chưa biết đơn vị tính của dòng hóa đơn (cái hay gói).' } as Record<string, string>,

  reason: (code: ReasonCode, p?: P): string => reasonTexts[code]?.(p) ?? code,
  note: (c: Coded | null): string => (c ? noteTexts[c.code]?.(c.params) ?? '' : ''),
  condition: (c: Coded): string => conditionTexts[c.code]?.(c.params) ?? c.code,
  anomaly: (c: Coded): string => anomalyTexts[c.code]?.(c.params) ?? c.code,
  anomalyTitle: (code: string): string => anomalyTitles[code] ?? code,
  flowReason: (c: Coded): string => flowReasonTexts[c.code]?.(c.params) ?? '',
  why: (code: string, p?: P): string => whyTexts[code]?.(p) ?? code,
  event: (code: string, p?: P): string => eventTexts[code]?.(p) ?? code,
  notification: notificationText,
  periodLabel: (period: string): string => {
    const [y, m] = period.split('-');
    return `Tháng ${Number(m)}/${y}`;
  },
  sendStatus: (r: PaymentRequest): string => {
    const last = r.attempts[r.attempts.length - 1];
    switch (r.sendStatus) {
      case 'NOT_SENT': return 'Chưa gửi';
      case 'SENDING': return 'Đang gửi vào ERP...';
      case 'RETRY': return 'Đang thử lại';
      case 'FAILED': return `Gửi thất bại sau ${r.attempts.filter((a) => !a.manual).length} lần thử`;
      case 'PAID': return 'Đã thanh toán';
      case 'IN_ERP': return last?.manual ? `Gửi lại thủ công bởi ${last.byName ?? ''}, vào ERP, chờ trạng thái đã thanh toán` : 'Đã vào ERP, chờ trạng thái đã thanh toán';
    }
  },
  auditEventType: {
    AI_DECISION: 'Quyết định của AI', RULE_DECISION: 'Quyết định của Rule Engine', PERSON_DECISION: 'Quyết định của người', SAMPLE_CHECK: 'Kiểm tra mẫu', SIGNATURE: 'Chữ ký', DELEGATION: 'Ủy quyền',
    MAILBOX: 'Hộp thư', PAID_STATUS: 'Trạng thái thanh toán', CONFIGURATION_CHANGE: 'Thay đổi cấu hình', GATE_CHANGE: 'Thay đổi cổng', USER_CHANGE: 'Thay đổi người dùng', ACCESS_DENIED: 'Truy cập bị từ chối',
  } as Record<AuditEventType, string>,

  common: {
    close: 'Đóng', cancel: 'Hủy', retry: 'Thử lại', reload: 'Tải lại', loading: 'Đang tải...', open: 'Mở', apply: 'Áp dụng', clearFilters: 'Xóa bộ lọc', edit: 'Sửa', actions: 'Thao tác',
    required: '(bắt buộc)', reasonRequired: 'Cần nhập lý do.', fieldRequired: 'Trường này là bắt buộc.', readOnly: 'Chỉ đọc với vai trò của bạn', dueSoon: 'Sắp đến hạn', moreActions: 'Thao tác khác',
    sort: 'Sắp xếp', showing: 'Hiển thị {from} đến {to} trên {total}', prev: 'Trước', next: 'Sau', chooseOne: 'Chọn một mục.', choose: 'Chọn...', save: 'Lưu',
  },
  shell: {
    skip: 'Chuyển đến nội dung chính', menu: 'Menu', mainNav: 'Điều hướng chính', count: 'Số lượng:', demoOnly: 'Chỉ dùng để demo', logout: 'Đăng xuất', bell: 'Thông báo',
    bellUnread: 'Thông báo, {n} chưa đọc', mst: 'MST', closeMenu: 'Đóng menu',
    viewAll: 'Xem tất cả', latest: 'Thông báo mới nhất', noNotifications: 'Chưa có thông báo', switchPersona: 'Đổi vai trò', account: 'Tài khoản', collapse: 'Thu gọn menu',
  },
  nav: {
    invoices: 'Hóa đơn đầu vào', batch: 'Lô thanh toán', mailbox: 'Hộp thư hóa đơn', recurring: 'Hợp đồng định kỳ', notifications: 'Thông báo', dashboard: 'Bảng điều khiển',
    decisionsChief: 'Chờ quyết định', decisionsApprover: 'Duyệt ngoại lệ', signing: 'Ký đề nghị thanh toán', delegations: 'Ủy quyền ký', audit: 'Nhật ký kiểm toán',
    acceptance: 'Xác nhận nghiệm thu', policy: 'Chính sách pháp nhân', matrix: 'Ma trận phê duyệt', users: 'Người dùng', group: 'Tổng quan tập đoàn', gates: 'Cổng tự động hóa',
    entities: 'Pháp nhân và hạn mức', erp: 'Giả lập ERP',
  },
  denied: {
    title: 'Không có quyền truy cập',
    text: 'Vai trò của bạn không mở được trang này. Thanh bên chỉ hiển thị các trang bạn dùng được.',
    record: 'Không hiển thị được bản ghi này. Thông báo giống nhau dù bản ghi có tồn tại hay không.',
    home: 'Về trang chủ của vai trò',
  },
  placeholder: { title: 'Đang xây dựng', text: 'Trang này sẽ có trong giai đoạn tiếp theo của bản mẫu. Bạn vẫn có thể dùng các trang khác trong thanh bên.' },
  login: {
    title: 'MatchPay', subtitle: 'Đối chiếu hóa đơn đầu vào, đưa hóa đơn sạch vào lô thanh toán và để người có thẩm quyền ký đề nghị chi cho Tập đoàn Calderwood.', entities: 'Ba pháp nhân của tập đoàn', pickPersona: 'Chọn một người để đăng nhập (dữ liệu mẫu)', signIn: 'Đăng nhập', signingIn: 'Đang đăng nhập...',
    useEmail: 'Đăng nhập bằng email và mật khẩu', usePersona: 'Chọn vai trò mẫu', email: 'Email', password: 'Mật khẩu', passwordHint: 'Mật khẩu có ít nhất 8 ký tự. Bản mẫu chấp nhận mọi mật khẩu đủ dài.',
    wrong: 'Email hoặc mật khẩu không đúng', emailInvalid: 'Email chưa đúng định dạng.', deactivated: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.', ended: 'Phiên đăng nhập đã hết.', endedHint: 'Đăng nhập lại để tiếp tục.',
    footer: 'Sau khi đăng nhập, bạn vào trang chủ của vai trò. Dữ liệu mẫu hư cấu của Tập đoàn Calderwood, lưu trong trình duyệt.',
  },

  invoices: {
    title: 'Hóa đơn đầu vào', upload: 'Tải lên XML', syncNow: 'Đồng bộ ERP ngay', syncDone: 'Đã đồng bộ ERP. {n} hóa đơn chờ hàng đã vào lô.', lastSync: 'Đồng bộ ERP gần nhất', ofEntity: 'Hóa đơn của {entity}',
    syncFailed: 'Đồng bộ ERP thất bại. Dữ liệu hiển thị là của {time}.', syncFailedHint: 'Hóa đơn mới được kiểm tra với dữ liệu cũ cho đến khi đồng bộ thành công.',
    kpiExceptions: 'Ngoại lệ đang mở', kpiExceptionsSub: '{d} chờ quyết định, {s} chờ nhà cung cấp', kpiDue: 'Đến hạn trong 7 ngày', kpiNone: 'Không có', kpiBatch: 'Trong lô', kpiWaiting: 'Chờ nhận hàng', kpiWaitingSub: 'Kiểm tra lại ở lần đồng bộ sau',
    listLabel: 'Danh sách hóa đơn', savedViews: 'Chế độ xem đã lưu', views: { needs: 'Cần xử lý', waiting: 'Đang chờ', batch: 'Trong lô', done: 'Đã hoàn tất', all: 'Tất cả' },
    searchPlaceholder: 'Tìm theo số, nhà cung cấp hoặc tổng tiền', searchLabel: 'Tìm hóa đơn', filters: 'Bộ lọc', removeFilter: 'Bỏ bộ lọc {f}', searchChip: 'Tìm: {q}', removeSearch: 'Bỏ tìm kiếm',
    countOf: '{n} trên {total} hóa đơn', countAnyState: '{n} hóa đơn ở mọi trạng thái', narrowByState: 'Thu hẹp theo trạng thái', anyState: 'Mọi trạng thái',
    fState: 'Trạng thái', fSupplier: 'Nhà cung cấp', fFlow: 'Luồng', fSource: 'Nguồn', allStates: 'Mọi trạng thái', allSuppliers: 'Mọi nhà cung cấp', allFlows: 'Mọi luồng', allSources: 'Mọi nguồn',
    reminderDue: 'Đến hạn nhắc', figure: 'Chỉ số',
    colActions: 'Mở', filterTitle: 'Bộ lọc hóa đơn', openInvoice: 'Mở hóa đơn',
    colInvoice: 'Hóa đơn', colFlow: 'Luồng', colSource: 'Nguồn', colDue: 'Hạn thanh toán', colState: 'Trạng thái', colReasons: 'Lý do và ghi chú', colTotal: 'Tổng tiền',
    noneFound: 'Không tìm thấy hóa đơn', noneFoundHint: 'Thử một phần số hóa đơn, tên nhà cung cấp hoặc đúng tổng tiền có VAT.', noMatch: 'Không có hóa đơn nào khớp bộ lọc.',
    emptyTitle: 'Chưa có hóa đơn nào', emptyApText: 'Tải lên hóa đơn điện tử XML để bắt đầu. Mỗi tệp được kiểm tra khi nhận và hiện ở đây.',
    emptyRoText: 'Hóa đơn của pháp nhân sẽ hiện ở đây khi Kế toán phải trả tải lên.', emptyViewTitle: 'Không có hóa đơn trong chế độ xem này', emptyViewText: 'Chọn chế độ xem khác hoặc xóa bộ lọc.',
  },
  upload: {
    title: 'Tải lên hóa đơn XML', drop: 'Kéo thả tệp XML vào đây', hint: 'Chọn một hoặc nhiều tệp. Mỗi tệp được kiểm tra riêng.', choose: 'Chọn tệp', samples: 'Hoặc thêm tệp mẫu để thử các kết quả khác nhau',
    selected: 'Tệp đã chọn', remove: 'Bỏ {f}', submit: 'Tải lên {n} tệp', uploading: 'Đang tải lên...', results: 'Kết quả từng tệp', accepted: 'Chấp nhận', rejected: 'Từ chối',
    summary: 'Chấp nhận {a} tệp, từ chối {r} tệp',
    reason: (code: string, p?: P): string => {
      switch (code) {
        case 'UP_NOT_XML': return 'Chỉ nhận hóa đơn điện tử XML ở bản MVP';
        case 'UP_SIGNATURE': return 'Kiểm tra chữ ký XML không đạt';
        case 'UP_DUPLICATE': return 'Đã có hóa đơn cùng người bán, ký hiệu và số';
        case 'UP_REPLACED': return `Đã bị thay thế tại cơ quan thuế bởi ${s(p, 'by')}`;
        case 'UP_CANCELLED': return `Đã bị hủy tại cơ quan thuế vào ngày ${s(p, 'date')}`;
        case 'UP_BUYER': return 'Mã số thuế người mua không khớp với pháp nhân này';
        default: return code;
      }
    },
  },

  detail: {
    breadcrumb: 'Đường dẫn', summary: 'Tóm tắt hóa đơn', progress: 'Tiến trình hóa đơn', sections: 'Các phần của hóa đơn', actionPanel: 'Thao tác', steps: { received: 'Đã nhận', checked: 'Đã kiểm tra', outcome: 'Trong lô', request: 'Trong đề nghị', sent: 'Đã gửi ERP', paid: 'Đã thanh toán' },
    waitingFor: 'Chờ {who}', supplier: 'Nhà cung cấp', noVnTax: 'không có mã số thuế Việt Nam', entity: 'Pháp nhân', dueDate: 'Hạn thanh toán', flow: 'Luồng', approvalLevel: 'Cấp duyệt', authority: 'Trạng thái tại cơ quan thuế',
    notChecked: 'Chưa tra cứu', lookedUp: 'tra cứu {time}', reasons: 'Lý do ngoại lệ', rejectedBecause: 'Lý do từ chối',
    tabs: { overview: 'Tổng quan', lines: 'Dòng hàng', checks: 'Kiểm tra', documents: 'Chứng từ', anomalies: 'Bất thường', history: 'Lịch sử' },
    failedN: '{n} không đạt', notEvalN: '{n} chưa đánh giá', passedAll: 'đều đạt',
    ruleResult: 'Kết quả của Rule Engine', allSixHold: 'Cả sáu điều kiện của lô đều đạt', failedOfSix: '{n} trong 6 điều kiện của lô không đạt', notEvaluated: '{n} điều kiện chưa được đánh giá',
    viewInChecks: 'Xem trong tab Kiểm tra', passedList: 'Các điều kiện {list} đạt. Chưa đưa vào lô.{x}',
    keyFacts: 'Thông tin chính', openDocuments: 'Mở chứng từ', invoiceDate: 'Ngày hóa đơn', order: 'Đơn đặt hàng', receipt: 'Phiếu nhận', none: 'Không có', noneService: 'Không có (dịch vụ)', trust: 'Mức tin cậy',
    signatureCheck: 'Kiểm tra chữ ký', sigValid: 'Chữ ký hợp lệ', sigPending: 'Đang kiểm tra', lastSync: 'Đồng bộ ERP gần nhất', flowIdent: 'Luồng và nhận diện', confidence: 'độ tin cậy', versions: 'Phiên bản',
    acceptance: 'Nghiệm thu dịch vụ', source: 'Nguồn', confirmedBy: 'Xác nhận bởi', note: 'Ghi chú', taxRisk: 'Mục trong danh sách rủi ro thuế',
    taxRiskText: '{supplier} nằm trong danh sách rủi ro thuế (nguồn: nguồn dữ liệu mô phỏng), từ ngày {date}. Khấu trừ VAT của hóa đơn này có thể có rủi ro. Hệ thống giữ hóa đơn và không từ chối.',
    linked: 'Các ngoại lệ tách đơn liên kết', thisPage: '(trang này)', combined: 'Tổng cộng. Mỗi hóa đơn dưới 50.000.000 ₫ nhưng tổng thì không.', paymentRequest: 'Đề nghị thanh toán', noSignatures: 'Chưa có chữ ký.',
    signedBy: 'Ký bởi {who}', signedOnBehalf: 'Ký bởi {who} thay {for}', noRequest: 'Chưa có đề nghị thanh toán. Bản ghi chữ ký sẽ hiện ở đây khi hóa đơn vào một đề nghị.', paymentRef: 'Mã tham chiếu thanh toán', cancellationNotice: 'Thông báo hủy',
    noLines: 'Chưa có dòng hàng.', aiMissing: 'AI chưa trả lời nên chưa khớp được dòng nào.', lineMatches: 'Khớp dòng hàng', lineText: 'Nội dung trên hóa đơn', lineMatched: 'Khớp với', lineMethod: 'Phương pháp', lineProb: 'Xác suất (ngưỡng 0,90)', lineTotal: 'Thành tiền',
    doubtful: 'Nghi ngờ', matched: 'Đã khớp', confirmedByName: 'Xác nhận bởi {who}', vat: 'VAT', totalWithVat: 'Tổng có VAT',
    noChecks: 'Chưa có kết quả kiểm tra.', sixConditions: 'Sáu điều kiện để vào lô', passedSummary: '{n} điều kiện đạt ({list}) - Xem',
    sourceDocument: 'Chứng từ gốc', documentData: 'Dữ liệu chứng từ', seller: 'Người bán', taxCode: 'mã số thuế', seriesNumber: 'Ký hiệu và số', buyerTaxCode: 'Mã số thuế người mua', buyerName: 'Tên người mua', orderRef: 'Tham chiếu đơn hàng', storedHash: 'Mã băm đã lưu',
    injectionNote: 'Văn bản đọc từ XML là dữ liệu. Văn bản trông giống chỉ dẫn không làm thay đổi gì.', erpData: 'Đơn hàng và phiếu nhận từ ERP của pháp nhân', erpDataTag: 'Dữ liệu ERP', noErp: 'Hóa đơn này chưa tham chiếu đơn hàng nào.',
    erpDoc: 'Chứng từ', erpItem: 'Mặt hàng', erpQty: 'Số lượng', erpPrice: 'Đơn giá',
    anomalyNumbers: 'Số liệu bất thường', noAnomalies: 'Chưa có số liệu bất thường.', flagged: 'Bị gắn cờ', history: 'Lịch sử quyết định', historyHint: 'Ai hoặc cái gì đã quyết định, mới nhất ở cuối', noHistory: 'Chưa có sự kiện.',
    resolve: 'Xử lý ngoại lệ này', noAction: 'Không có thao tác', nextStep: 'Bước tiếp theo', otherActions: 'Cách xử lý khác',
    readOnlyPanel: 'Hóa đơn này không chờ quyết định của bạn. Bằng chứng ở chế độ chỉ đọc.', admittedPanel: 'Hóa đơn đã được đưa vào lô. Không có việc gì chờ bạn ở đây.', waitingPanel: 'Đang chờ quyết định của người có thẩm quyền. Bằng chứng ở chế độ chỉ đọc.', nothingToDo: 'Không có thao tác nào áp dụng cho trạng thái hiện tại.',
    openDecisions: 'Mở hàng đợi quyết định',
    nextTake: 'Nhận xử lý ngoại lệ này', nextTakeText: 'Sau khi nhận, ngoại lệ chuyển sang Đang xử lý và tên bạn được ghi lại.', take: 'Nhận xử lý',
    nextRerun: 'Chạy lại kiểm tra', nextRerunText: 'Bước AI đã thất bại nên chưa có bằng chứng. Sau khi chạy lại, Rule Engine quyết định lại.', rerun: 'Chạy lại kiểm tra',
    nextLine: 'Dòng {n} cần bạn xác nhận', nextLineText: 'AI đề xuất "{item}". Xác nhận của bạn được lưu vào bảng ánh xạ của pháp nhân.', confirmLine: 'Xác nhận khớp dòng',
    nextForeign: 'Từ chối hóa đơn này', nextForeignText: 'Hóa đơn không xử lý được ở bản MVP. Cách duy nhất là từ chối kèm lý do. Sau đó xử lý ngoài MatchPay.',
    nextCorrection: 'Yêu cầu nhà cung cấp chỉnh sửa', nextCorrectionText: 'AI soạn nội dung từ mẫu đã duyệt. Chưa gửi gì cho đến khi bạn bấm Gửi.', requestCorrection: 'Yêu cầu chỉnh sửa', dataFix: 'Thông báo sửa dữ liệu',
    sendForDecision: 'Gửi duyệt', correctFlow: 'Sửa luồng', reportWrongEntity: 'Báo sai pháp nhân', recordCancellation: 'Ghi nhận thông báo hủy', reject: 'Từ chối hóa đơn',
    withdraw: 'Rút khỏi lô', withdrawTitle: 'Rút hóa đơn khỏi lô', withdrawIntro: 'Bạn có thể rút hóa đơn cho đến khi đề nghị thanh toán của nó được ký đủ. Hóa đơn trở lại danh sách ngoại lệ.', withdrawReason: 'Lý do',
    toastTaken: 'Đã nhận xử lý ngoại lệ.', toastRerun: 'Đã chạy lại kiểm tra.', toastLine: 'Đã lưu xác nhận khớp dòng.', toastFlow: 'Đã sửa luồng.', toastWrongEntity: 'Đã ghi nhận báo sai pháp nhân.', toastSent: 'Đã gửi duyệt.', toastRejected: 'Đã từ chối hóa đơn.', toastWithdrawn: 'Đã rút hóa đơn khỏi lô.',
    wrongEntityNote: 'Ghi chú', wrongEntityIntro: 'So sánh hóa đơn với pháp nhân này:', same: 'Giống', differs: 'Khác',
    wrongEntityHint: 'Hóa đơn ở lại {entity}; sau đó đề nghị nhà cung cấp xuất lại hoặc từ chối hóa đơn. Không thể duyệt riêng.',
    confirmLineTitle: 'Xác nhận dòng {n}', confirmLineText: 'Xác nhận "{text}" là "{item}"?', confirmLineSave: 'Lưu xác nhận', confirmLineHint: 'Được lưu kèm tên và thời gian. Rule Engine sau đó kiểm tra lại hóa đơn.',
    sendTitle: 'Gửi duyệt', sendToChief: 'Hóa đơn bị giữ do rủi ro thuế sẽ gửi Kế toán trưởng quyết định: cho phép hoặc từ chối, cần nhập lý do.', sendToApprover: 'Ngoại lệ sẽ gửi Người duyệt chi ở cấp phù hợp với số tiền để duyệt riêng.', sendGroup: 'Ba ngoại lệ tách đơn được gửi cùng nhau ({n} hóa đơn).',
    flowHint: 'Hóa đơn không bao giờ được chuyển sang pháp nhân khác.', saveFlow: 'Lưu luồng',
  },
  reject: {
    title: 'Từ chối hóa đơn', intro: 'Hóa đơn {n} sẽ chuyển sang Đã từ chối và ngoại lệ được đóng với kết quả Từ chối.', foreign: 'Đây là cách xử lý duy nhất cho hóa đơn nước ngoài ở bản MVP.',
    reason: 'Lý do từ chối', placeholder: 'Ví dụ: hóa đơn nước ngoài, xử lý ngoài MatchPay', confirm: 'Từ chối hóa đơn',
  },
  correction: {
    title: 'Soạn yêu cầu gửi nhà cung cấp', intro: 'Chưa gửi gì cho đến khi bạn bấm Gửi.', type: 'Loại', kinds: { CORRECTION_REQUEST: 'Yêu cầu chỉnh sửa hóa đơn', DATA_FIX_NOTICE: 'Thông báo sửa dữ liệu', REISSUE_REQUEST: 'Yêu cầu xuất lại hóa đơn' } as Record<MessageTemplate['kind'], string>,
    drafting: 'AI đang soạn nội dung...', aiDraft: 'AI soạn từ mẫu đã duyệt. Bạn có thể sửa trước khi gửi.', aiUnavailable: 'AI không khả dụng', blankTemplate: 'Dùng mẫu trống. Bạn tự nhập nội dung.',
    recipient: 'Người nhận', recipientHint: 'Địa chỉ email. Thử địa chỉ chứa "fail" để xem trường hợp gửi lỗi.', recipientInvalid: 'Địa chỉ email không hợp lệ.', subject: 'Tiêu đề', body: 'Nội dung', required: 'Trường này là bắt buộc.',
    send: 'Gửi', retry: 'Thử gửi lại', sent: 'Đã gửi yêu cầu.', notSent: 'Chưa gửi',
  },
  cancel: {
    title: 'Ghi nhận thông báo hủy', whatHappens: 'Điều sẽ xảy ra', record: 'Ghi nhận', reference: 'Số tham chiếu của thông báo', date: 'Ngày thông báo', file: 'Tệp thông báo (lưu làm bằng chứng)', fileHint: 'Không bắt buộc ở bản mẫu.',
    dateHint: 'Định dạng dd/mm/yyyy', dateInvalid: 'Ngày không hợp lệ.', referenceRequired: 'Cần nhập số tham chiếu.', dateShown: 'Ngày ghi nhận: {d}',
    effectException: 'Hóa đơn chuyển sang Đã từ chối với lý do "Người bán đã hủy hóa đơn" và ngoại lệ được đóng.',
    effectWaiting: 'Hóa đơn đang chờ nhận hàng sẽ bị từ chối ngay với lý do "Người bán đã hủy hóa đơn".',
    effectInBatch: 'Hóa đơn được rút khỏi lô và chuyển sang Đã từ chối với lý do "Người bán đã hủy hóa đơn".',
    effectInRequest: 'Hóa đơn được rút khỏi lô và bị từ chối. Tổng tiền và cấp duyệt của {r} được tính lại, chữ ký trước đó trên đề nghị bị vô hiệu.',
    effectSigned: 'Đề nghị đã ký nhưng chưa gửi sẽ bị hủy toàn bộ, không gửi gì. Các hóa đơn còn lại trong đề nghị trở lại ngoại lệ và cần ký lại.',
    toast: 'Đã ghi nhận thông báo hủy.', done: 'Đã ghi nhận thông báo hủy',
    rejected: '{n} đã chuyển sang Đã từ chối với lý do "Người bán đã hủy hóa đơn".',
    withdrawn: '{n} đã chuyển sang Đã từ chối ("Người bán đã hủy hóa đơn") và rời khỏi lô. {r} nay có tổng {total}, cần cấp {level}. Chữ ký trước đó bị vô hiệu.',
    requestCancelled: '{n} đã bị từ chối. Đề nghị {r} đã bị hủy và chưa gửi gì. Các hóa đơn còn lại trở lại ngoại lệ.',
  },

  recurring: {
    title: 'Hợp đồng định kỳ', intro: 'Hợp đồng lặp lại theo kỳ, ví dụ tiền điện. Hợp đồng khớp là nguồn độc lập cho hóa đơn định kỳ.', add: 'Thêm hợp đồng', savedViews: 'Chế độ xem đã lưu',
    views: { active: 'Đang hoạt động', inactive: 'Ngừng', all: 'Tất cả' }, colSupplier: 'Nhà cung cấp và địa điểm', colContract: 'Hợp đồng', colPeriod: 'Kỳ', colPrice: 'Giá', colThreshold: 'Ngưỡng lệch', colEarlier: 'Các kỳ trước', colStatus: 'Trạng thái',
    periods: { MONTHLY: 'Hàng tháng', QUARTERLY: 'Hàng quý' }, fixed: 'Cố định', fixedPrice: 'Giá cố định', usage: 'Theo mức sử dụng', noPeriods: 'Chưa ghi nhận kỳ nào', average: 'Trung bình', status: { ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng' },
    emptyTitle: 'Chưa có hợp đồng định kỳ', emptyText: 'Không có hợp đồng thì mọi hóa đơn định kỳ đều thành ngoại lệ. Thêm hợp đồng cho từng khoản lặp lại.', emptyView: 'Không có hợp đồng trong chế độ xem này',
    deactivate: 'Ngừng hợp đồng', deactivateTitle: 'Ngừng hợp đồng của {s}?', deactivateText: 'Các hóa đơn sau này của nhà cung cấp, địa điểm và kỳ này sẽ thành ngoại lệ "Không có hợp đồng định kỳ phù hợp". Hóa đơn trước đó không thay đổi.',
    toastDeactivated: 'Đã ngừng hợp đồng.', toastCreated: 'Đã thêm hợp đồng.', toastUpdated: 'Đã lưu hợp đồng.', addTitle: 'Thêm hợp đồng định kỳ', editTitle: 'Sửa hợp đồng định kỳ', save: 'Lưu hợp đồng',
    location: 'Địa điểm', priceType: 'Loại giá', contractPrice: 'Giá hợp đồng (₫)', priceRequired: 'Cần nhập giá hợp đồng với giá cố định.', threshold: 'Ngưỡng lệch (%)', thresholdHint: 'Ví dụ 30. Hóa đơn lệch hơn ngưỡng so với các kỳ trước sẽ thành ngoại lệ.', thresholdRequired: 'Cần nhập ngưỡng lệch lớn hơn 0.',
  },
  mailbox: {
    title: 'Hộp thư hóa đơn', fetchNow: 'Lấy thư ngay', fetching: 'Đang lấy thư...', fetchingTitle: 'Đang lấy thư mới', fetchingText: 'Nhật ký sẽ cập nhật khi lấy xong. Thư đã lấy trước đó không bị xử lý lại.',
    lastFetch: 'Lần lấy thành công gần nhất: {time}', neverFetched: 'Chưa lấy thư lần nào', schedule: 'Tự động lấy mỗi 15 phút', failed: 'Lần lấy thư lúc {time} thất bại: hộp thư không phản hồi.', failedHint: 'Các thư đã lấy trước đó vẫn giữ nguyên. Lần lấy theo lịch kế tiếp sẽ thử lại.',
    fetched: 'Đã lấy xong: {n} thư mới.', kMessages: 'Thư', kMessagesSub: 'Trong 48 giờ gần nhất', kCreated: 'Hóa đơn đã tạo', kCreatedSub: 'Nguồn: Email', kRejected: 'Tệp bị từ chối', kRejectedSub: 'Mỗi tệp nêu rõ lý do', kNone: 'Thư không có tệp đính kèm',
    savedViews: 'Chế độ xem đã lưu', views: { all: 'Tất cả', accepted: 'Chấp nhận', rejected: 'Từ chối', none: 'Không có tệp' },
    colMessage: 'Thư', colReceived: 'Nhận lúc', colAttachment: 'Tệp đính kèm', colResult: 'Kết quả', colDetail: 'Hóa đơn hoặc lý do', none: 'Không có', sourceEmail: 'Nguồn: Email', noAttachmentText: 'Thư không có tệp đính kèm nên không tạo hóa đơn.',
    result: { ACCEPTED: 'Chấp nhận', REJECTED: 'Từ chối', NO_ATTACHMENT: 'Không có tệp' } as Record<MailboxAttachment['result'], string>,
    rejection: {
      XML_NOT_SUPPORTED: 'Chỉ nhận hóa đơn điện tử XML ở bản MVP', EXACT_DUPLICATE: 'Đã có hóa đơn cùng người bán, ký hiệu và số', BUYER_OTHER_ENTITY: 'Mã số thuế người mua không khớp với pháp nhân này',
      NOT_READABLE_XML: 'Tệp không phải hóa đơn XML đọc được', NOT_XML: 'Chỉ nhận hóa đơn điện tử XML ở bản MVP', SIGNATURE_FAILED: 'Kiểm tra chữ ký XML không đạt', BUYER_TAX_CODE_MISMATCH: 'Mã số thuế người mua không khớp với pháp nhân này',
      REJECTED_BY_PERSON: 'Bị từ chối bởi người xử lý', CANCELLED_AT_AUTHORITY: 'Đã bị hủy tại cơ quan thuế', REPLACED_AT_AUTHORITY: 'Đã bị thay thế tại cơ quan thuế', CANCELLED_BY_SELLER: 'Người bán đã hủy hóa đơn',
    } as Record<NonNullable<MailboxAttachment['rejection']>, string>,
    emptyTitle: 'Chưa lấy thư nào', emptyText: 'Hóa đơn gửi tới {a} sẽ hiện ở đây sau khi lấy thư.', footer: 'Hiển thị {n} trên {total} tệp trong {m} thư. Mới nhất ở trên. Thư đã lấy không bị xử lý lại.',
  },
  notifications: {
    title: 'Thông báo', intro: 'Sự kiện và nhắc việc dành cho bạn, mới nhất ở trên. Chỉ có trong hệ thống, không gửi email.', savedViews: 'Chế độ xem đã lưu', unread: 'Chưa đọc', all: 'Tất cả', markAll: 'Đánh dấu tất cả đã đọc', allRead: 'Đã đánh dấu tất cả là đã đọc.',
    unreadFlag: 'Chưa đọc', emptyUnread: 'Không có thông báo chưa đọc', emptyAll: 'Chưa có thông báo', emptyText: 'Thông báo mới sẽ hiện ở đây khi có việc cần bạn.', kinds: notificationKinds,
  },

  batch: {
    title: 'Lô thanh toán', period: 'Kỳ', close: 'Đóng lô để rà soát', release: 'Phát hành để ký', expand: 'Mở rộng mẫu', reopen: 'Mở lại để rà soát', progress: 'Tiến trình của lô',
    stages: { open: 'Đang mở', closed: 'Đã đóng để rà soát', sampled: 'Đã kiểm mẫu', released: 'Đã phát hành', sent: 'Đã gửi' }, stillToMark: 'Còn {n} mục mẫu chưa đánh dấu.', releaseNeeds: 'Chỉ phát hành được khi mọi mục mẫu đã đánh dấu.',
    noBatchTitle: 'Chưa có lô thanh toán', noBatchText: 'Lô được tạo khi hóa đơn đầu tiên của kỳ được đưa vào lô.',
    reopenedDone: 'Đã mở lại lô để rà soát.', reopenedText: 'Các đề nghị chưa ký đã bị hủy. Hóa đơn vẫn ở trong lô và kết quả kiểm mẫu được giữ. Phát hành lại để tạo đề nghị mới.',
    sendFailed: 'Gửi {r} vào ERP thất bại', sendFailedText: 'Đề nghị vẫn ở trạng thái Đã ký. Gửi lại với cùng số đề nghị không bao giờ tạo hai khoản thanh toán.', resend: 'Gửi lại',
    kInvoices: 'Hóa đơn', kInvoicesSub: 'Rule Engine đã đưa vào lô', kTotal: 'Tổng tiền', kTotalSub: 'Cả {n} hóa đơn', kRequests: 'Đề nghị thanh toán', kRequestsReleased: 'Đã tạo khi phát hành', kRequestsPlanned: 'Sẽ tạo khi phát hành (theo chính sách pháp nhân)', kDue: 'Đến hạn sớm nhất',
    sampleTitle: 'Kiểm tra mẫu', withoutAi: 'chọn không dùng AI', sampleExplain: '{n} hóa đơn với tỷ lệ mẫu {rate}% là mẫu {size} hóa đơn (làm tròn lên). AI chọn hóa đơn rủi ro cao trước.',
    expansionLine: 'Mở rộng mẫu lúc {time} bởi {who}: "{reason}". Đã thêm {n} hóa đơn theo thứ tự rủi ro. Chưa phát hành được cho đến khi đánh dấu xong.', noSample: 'Chưa chọn mẫu. Mẫu được chọn khi đóng lô để rà soát.',
    markOk: 'OK', markError: 'Lỗi', notMarked: 'Chưa đánh dấu', yourCheck: 'Kết quả kiểm tra của bạn', markedBy: 'Đã đánh dấu bởi {who}, {time}', errorBy: 'Lỗi do {who} đánh dấu: {reason}. Hóa đơn đã bị rút vào ngoại lệ.', errorReason: 'Lý do lỗi',
    errorReasonRequired: 'Cần nhập lý do. Hóa đơn sẽ bị rút vào ngoại lệ.', errorHint: 'Đánh dấu Lỗi sẽ rút hóa đơn khỏi lô, tính vào tỷ lệ xếp nhầm và cảnh báo của cổng.', confirmError: 'Xác nhận lỗi', errorWarning: 'Đánh dấu Lỗi rút hóa đơn vào ngoại lệ.',
    toastMarked: 'Đã lưu kết quả kiểm tra.', expansionTag: 'Mở rộng lần {n}',
    admittedTitle: 'Hóa đơn Rule Engine đã đưa vào lô', groupedBy: 'Nhóm theo nhà cung cấp: mỗi nhà cung cấp một đề nghị', noInvoices: 'Lô chưa có hóa đơn', noInvoicesText: 'Hóa đơn đạt cả sáu điều kiện, và ngoại lệ đã được duyệt riêng, sẽ hiện ở đây.',
    supplierGroup: '{s} - {n} hóa đơn', subtotal: 'Tạm tính, {s}', totalRow: 'Tổng, {n} hóa đơn', withdrawLink: 'Rút', requestsTitle: 'Đề nghị thanh toán', requestsSub: 'Tổng {total}', colRequest: 'Đề nghị', colSupplier: 'Nhà cung cấp', colLevel: 'Cấp duyệt', colErp: 'Trạng thái gửi ERP',
    signedBy: 'Đã ký bởi {who}, {time}',
    closeTitle: 'Đóng lô để rà soát', countTotal: '{n} hóa đơn, tổng {total}', sampleSize: 'Cỡ mẫu', sampleSizeValue: '{n} hóa đơn', nextPeriodNote: 'Hóa đơn được đưa vào lô sau khi bạn đóng sẽ thuộc kỳ kế tiếp ({p}).', toastClosed: 'Đã đóng lô. Mẫu kiểm tra đã được chọn.',
    releaseTitle: 'Phát hành lô để ký', allMarked: 'Mọi mục mẫu đã được đánh dấu', requestsOnRelease: '{n} đề nghị theo chính sách của pháp nhân', afterRelease: 'Sau khi phát hành, Kế toán trưởng ký trước, rồi Người duyệt chi ở cấp mà tổng tiền yêu cầu.', toastReleased: 'Đã phát hành lô. Đề nghị thanh toán đã được tạo.',
    expandTitle: 'Mở rộng mẫu', expandReason: 'Lý do', currentSample: 'Mẫu hiện tại', currentSampleValue: '{n} hóa đơn, {e} đánh dấu Lỗi', notInSample: 'Chưa nằm trong mẫu', willAdd: 'Sẽ thêm', invoicesN: '{n} hóa đơn',
    sampleFull: 'Mọi hóa đơn đã nằm trong mẫu', addOriginal: 'Thêm {n} hóa đơn (bằng cỡ mẫu ban đầu)', addAll: 'Thêm tất cả {n} hóa đơn còn lại', expandNote: 'Chưa phát hành được cho đến khi đánh dấu xong các mục mới. Việc mở rộng được lưu kèm tên, thời gian và lý do. Có thể mở rộng nhiều lần.', toastExpanded: 'Đã mở rộng mẫu.',
    reopenTitle: 'Mở lại lô để rà soát', reopenReason: 'Lý do', requestsCancelled: 'Đề nghị sẽ bị hủy', notPossible: 'Không thể: đã có chữ ký', noneSigned: '{n} (chưa đề nghị nào có chữ ký)', invoicesStay: '{n} hóa đơn vẫn ở trong lô', kept: 'Được giữ', keptValue: 'Kết quả kiểm mẫu và các duyệt riêng đã ghi nhận', toastReopened: 'Đã mở lại lô để rà soát.',
    resendTitle: 'Gửi lại vào ERP', autoAttempts: 'Các lần thử tự động', attemptsFailed: '{n} lần thất bại, lần cuối lúc {time}', resendNote: 'Cùng số đề nghị {r} được dùng làm khóa chống trùng nên ERP không bao giờ tạo hai khoản thanh toán. Không cần ký lại. Mã băm của nội dung đã ký được kiểm tra trước.', toastResent: 'Đã gửi lại vào ERP.',
  },
  dashboard: {
    title: 'Bảng điều khiển', period: 'Kỳ', periodCurrent: '{p} (tháng hiện tại)', introEntity: 'Số lượng và tỷ lệ ({entity}). Không hiển thị dữ liệu hóa đơn.', introGroup: 'Chỉ có số lượng và tỷ lệ của từng pháp nhân.',
    touchless: 'Tỷ lệ không cần can thiệp', valid: 'Hợp lệ: tỷ lệ xếp nhầm từ 1% trở xuống', notValid: 'Chưa hợp lệ', touchlessSub: '{n} hóa đơn vào lô mà không có người can thiệp, trên {base} hóa đơn đã nhận (không tính hóa đơn tách riêng)', openList: 'Mở {n} hóa đơn',
    misplacement: 'Tỷ lệ AI xếp nhầm', misplacementSub: '{e} hóa đơn bị rút sau lỗi mẫu, trong {s} hóa đơn đã kiểm mẫu', misplacementNote: 'Ước tính từ mẫu có trọng số rủi ro, không phải mẫu ngẫu nhiên. Tỷ lệ không cần can thiệp chưa hợp lệ khi tỷ lệ này trên 1%.',
    openExceptions: 'Ngoại lệ đang mở', openExceptionsSub: 'Mỗi con số mở danh sách có cùng số lượng', waiting: 'Chờ nhận hàng', waitingSub: 'Hiển thị riêng, không phải ngoại lệ',
    byState: 'Ngoại lệ đang mở theo trạng thái', byAge: 'Ngoại lệ đang mở theo thời gian', ages: { '0-2': '0 đến 2 ngày', '3-7': '3 đến 7 ngày', '7+': 'Trên 7 ngày' }, oldestHatched: 'Thanh sọc là nhóm cũ nhất.', total: '{n} ngoại lệ đang mở.', viewTable: 'Xem dạng bảng', viewChart: 'Xem dạng biểu đồ',
    colName: 'Nhóm', colCount: 'Số lượng', received: 'Đã nhận', entities: 'Pháp nhân', entitiesSub: 'Chỉ có số lượng và tỷ lệ', receivedSub: '{p}, mọi pháp nhân', eachEntity: 'Từng pháp nhân, {p}',
    colEntity: 'Pháp nhân', colReceived: 'Đã nhận', colTouchless: 'Tỷ lệ không cần can thiệp', colMis: 'Tỷ lệ AI xếp nhầm', colOpen: 'Ngoại lệ đang mở', colWaiting: 'Chờ nhận hàng', sampledOf: '{e} trên {s} đã kiểm mẫu', ofBase: '{n} trên {b}',
    emptyTitle: 'Chưa có hóa đơn trong kỳ này', emptyText: 'Số liệu hiện khi đã nhận hóa đơn trong kỳ. Chọn kỳ khác hoặc tải hóa đơn lên.', ring: 'Tỷ lệ không cần can thiệp {n}',
    figures: { touchless: 'Tỷ lệ không cần can thiệp', 'open-exceptions': 'Ngoại lệ đang mở', 'waiting-for-goods': 'Chờ nhận hàng', 'age-0-2': 'Ngoại lệ 0 đến 2 ngày', 'age-3-7': 'Ngoại lệ 3 đến 7 ngày', 'age-7+': 'Ngoại lệ trên 7 ngày', 'exc-open': 'Ngoại lệ mới', 'exc-in-review': 'Ngoại lệ đang xử lý', 'exc-waiting-for-supplier': 'Ngoại lệ chờ nhà cung cấp', 'exc-waiting-for-data-fix': 'Ngoại lệ chờ sửa dữ liệu', 'exc-waiting-for-decision': 'Ngoại lệ chờ quyết định' } as Record<string, string>,
  },
  acceptance: {
    title: 'Xác nhận nghiệm thu', intro: 'Hóa đơn dịch vụ của {entity} đang chờ xác nhận dịch vụ đã được thực hiện.', savedViews: 'Bộ lọc',
    kWaiting: 'Chờ nghiệm thu', kDue: 'Đến hạn trong 7 ngày', kDueNone: 'Không có hóa đơn nào sắp đến hạn', kOldest: 'Cũ nhất', kOldestSub: 'Nhận ngày {d}', days: '{n} ngày', today: 'Hôm nay',
    supplier: 'Nhà cung cấp', allSuppliers: 'Tất cả nhà cung cấp', dueOnly: 'Chỉ sắp đến hạn', colInvoice: 'Hóa đơn', colOrder: 'Đơn đặt hàng', colLines: 'Dòng dịch vụ', colAmount: 'Số tiền', colDue: 'Hạn thanh toán', review: 'Xem xét',
    emptyTitle: 'Không có hóa đơn dịch vụ nào chờ nghiệm thu', emptyText: 'Hóa đơn dịch vụ hiện ở đây khi đơn đặt hàng chưa có nghiệm thu trong ERP. Hóa đơn hàng hóa không bao giờ nằm trong danh sách này.',
    noMatch: 'Không có hóa đơn nào khớp bộ lọc', counted: '{n} hóa đơn dịch vụ',
    modalTitle: 'Xác nhận hoặc từ chối nghiệm thu', invoice: 'Hóa đơn', order: 'Đơn đặt hàng', lines: 'Dòng dịch vụ', amount: 'Số tiền', due: 'Hạn thanh toán', note: 'Ghi chú', noteHint: 'Bắt buộc khi từ chối. Ghi chú được lưu cùng tên và thời gian của bạn.',
    noteRequired: 'Cần nhập ghi chú khi từ chối.', confirm: 'Xác nhận nghiệm thu', reject: 'Từ chối nghiệm thu', creatorBlocked: 'Bạn đã tạo đơn đặt hàng của hóa đơn này. Người khác trong bộ phận cần xác nhận.',
    confirmed: 'Đã xác nhận nghiệm thu. {n} đã có thể vào lô nếu đủ sáu điều kiện.', rejected: 'Đã từ chối nghiệm thu. {n} trở thành ngoại lệ và Kế toán phải trả được báo.',
    gone: 'Hóa đơn này không còn chờ nghiệm thu.',
  },
  decisions: {
    titleChief: 'Chờ quyết định', titleApprover: 'Duyệt ngoại lệ', introChief: 'Hóa đơn bị giữ do rủi ro thuế đang chờ Kế toán trưởng quyết định.', introApprover: 'Ngoại lệ ở cấp {level} đang chờ duyệt riêng.',
    kWaiting: 'Chờ tôi', kAmount: 'Tổng tiền', kOldest: 'Cũ nhất', kinds: { TAX_RISK_HOLD: 'Giữ do rủi ro thuế', INDIVIDUAL_APPROVAL: 'Duyệt riêng' }, kindFilter: 'Loại', allKinds: 'Tất cả',
    onlyYours: 'Các dòng bạn không quyết định được sẽ không hiện ở đây.', colInvoice: 'Hóa đơn', colReasons: 'Lý do', colLevel: 'Cấp duyệt', colAmount: 'Số tiền', colAge: 'Thời gian chờ', colAction: 'Thao tác', review: 'Xem xét',
    ageToday: 'Hôm nay', ageDays: '{n} ngày', sent: 'gửi {t}', groupOf: 'Nhóm {n} hóa đơn quyết định cùng nhau',
    emptyTitle: 'Chưa có gì chờ quyết định của bạn', emptyText: 'Mục mới hiện ở đây khi Kế toán phải trả gửi ngoại lệ để quyết định. Số trên thanh bên là số mục đang chờ.', noMatch: 'Không có mục nào khớp bộ lọc',
    taxTitle: 'Quyết định hóa đơn bị giữ do rủi ro thuế', approveTitle: 'Duyệt riêng ngoại lệ', evidence: 'Bằng chứng', supplier: 'Nhà cung cấp', amount: 'Số tiền', due: 'Hạn thanh toán', reasons: 'Lý do ngoại lệ', checks: 'Điều kiện không đạt',
    taxText: '{supplier} nằm trong danh sách rủi ro thuế từ {date}. Quyết định của bạn được lưu kèm lý do.', combined: 'Duyệt cùng nhau, tổng {total}', combinedNote: 'Các hóa đơn này nghi tách đơn nên được quyết định cùng nhau.', requiredLevel: 'Cấp duyệt cần thiết: {level}',
    reason: 'Lý do', reasonHint: 'Bắt buộc. Lý do được lưu trong nhật ký kiểm toán.', reasonRequired: 'Cần nhập lý do.', release: 'Cho phép hóa đơn', reject: 'Từ chối hóa đơn', approve: 'Duyệt riêng', decline: 'Từ chối duyệt riêng',
    released: 'Đã cho phép hóa đơn. Kế toán phải trả được báo.', rejected: 'Đã từ chối hóa đơn.', approved: 'Đã duyệt riêng. Hóa đơn vào lô.', declined: 'Đã từ chối duyệt riêng. Hóa đơn trở lại cho Kế toán phải trả.',
    openInvoice: 'Mở hóa đơn', processedByYou: 'Bạn đã xử lý hóa đơn này nên không thể duyệt riêng (tách nhiệm vụ).',
  },
  signReason: {
    CHIEF_FIRST: 'Kế toán trưởng ký trước', WRONG_LEVEL: 'Đề nghị này cần Người duyệt chi ở cấp khác', WAITING_OTHER: 'Đang chờ người ký khác', DELEGATED_AWAY: 'Bạn đã ủy quyền ký nên chưa ký được cho đến khi thu hồi ủy quyền',
    PREPARED_BATCH: 'Bạn đã chuẩn bị hoặc phát hành lô này nên không ký được (tách nhiệm vụ)', PROCESSED_INVOICE: 'Bạn đã xử lý một hóa đơn trong đề nghị này nên không ký được (tách nhiệm vụ)',
    ALREADY_SIGNED: 'Bạn đã ký đề nghị này', NOT_AWAITING: 'Đề nghị không còn chờ chữ ký', STALE_VERSION: 'Chưa ký: nội dung đã thay đổi sau khi bạn mở. Tải lại và xem lại.', NOT_FOUND: 'Không tìm thấy đề nghị',
  } as Record<string, string>,
  signing: {
    title: 'Ký đề nghị thanh toán', intro: 'Đề nghị thanh toán ({entity}). Kế toán trưởng ký trước, rồi Người duyệt chi ở cấp mà tổng tiền yêu cầu.', savedViews: 'Chế độ xem đã lưu',
    views: { ready: 'Chờ tôi ký', waiting: 'Chờ người khác', done: 'Đã ký', all: 'Tất cả' }, kReady: 'Chờ tôi ký', kReadySub: 'Tổng tiền cần ký', kWaiting: 'Chờ người khác', kFlag: 'Có cờ cảnh báo',
    colRequest: 'Đề nghị', colTotal: 'Tổng tiền', colLevel: 'Cấp duyệt', colState: 'Trạng thái', colFlags: 'Cờ', colSigs: 'Chữ ký', colErp: 'Gửi ERP', noFlags: 'Không', bankChanged: 'Đổi tài khoản ngân hàng', newSupplier: 'Nhà cung cấp mới',
    sigsOf: '{n} trên 2', selectRow: 'Chọn {r}', selectHint: 'Chọn đề nghị để ký cùng lúc.', signSelected: 'Ký {n} đề nghị', selected: 'Đã chọn {n} đề nghị, tổng {total}', onBehalf: 'Thay {who}',
    emptyTitle: 'Chưa có đề nghị thanh toán để ký', emptyText: 'Đề nghị hiện ở đây khi Kế toán phải trả phát hành lô để ký.', emptyView: 'Không có đề nghị trong chế độ xem này',
    gave: 'Bạn đã ủy quyền ký cho {who} đến {date}. Thao tác ký của bạn bị tắt trong thời gian ủy quyền.', received: '{who} đã ủy quyền ký cho bạn đến {date}. Đề nghị chờ Kế toán trưởng được đánh dấu "Thay {who}".', manage: 'Xem ủy quyền',
    modalTitle: 'Ký đề nghị thanh toán', modalIntro: 'Nhập mã xác thực để ký. Chữ ký được lưu cùng phiên bản và mã băm nội dung của đề nghị.', code: 'Mã xác thực', codeHint: 'Bản mẫu: mã nằm trong Công cụ demo.', codeRequired: 'Cần nhập mã xác thực.', signNow: 'Ký',
    results: 'Kết quả ký', resultSigned: 'Đã ký, nay ở trạng thái: {s}', resultRefused: 'Chưa ký: {r}', summary: 'Đã ký {a}, chưa ký {b}.', done: 'Xong',
  },
  request: {
    titleFallback: 'Chi tiết đề nghị thanh toán', back: 'Ký đề nghị thanh toán', supplier: 'Nhà cung cấp', entity: 'Pháp nhân', level: 'Cấp duyệt cần', levelRule: '{level} (từ 50.000.000 ₫ trở lên)', levelRuleLow: '{level} (dưới 50.000.000 ₫)', invoices: 'Hóa đơn', flags: 'Cờ',
    noFlags: 'Không có cờ. {s} đã được thanh toán trước đây và tài khoản ngân hàng không đổi.', flagBank: 'Tài khoản ngân hàng của nhà cung cấp đã đổi. Cần kiểm tra trước khi ký.', flagNew: 'Nhà cung cấp mới, chưa từng được thanh toán.',
    steps: { AWAITING_CHIEF_ACCOUNTANT: 'Chờ Kế toán trưởng', AWAITING_PAYMENT_APPROVER: 'Chờ Người duyệt chi', SIGNED: 'Đã ký', SENT: 'Đã gửi ERP', PAID: 'Đã thanh toán' },
    summaryTitle: 'Tóm tắt của đề nghị', summaryText: 'Một nhà cung cấp, {n} hóa đơn, tất cả khớp với đơn đặt hàng và phiếu nhận. Tóm tắt của AI không phải chữ ký và không thay thế bằng chứng bên dưới.', summaryUnavailable: 'Tóm tắt của AI không khả dụng. Bạn vẫn ký được dựa trên bằng chứng.',
    totalsTitle: 'Tổng tiền và kiểm tra', byEntity: 'Theo pháp nhân', bySupplier: 'Theo nhà cung cấp', largeInvoices: 'Hóa đơn từ 50.000.000 ₫ trở lên', none: 'Không có', sample: 'Kiểm tra mẫu', sampleValue: '{ok} trên {total} hóa đơn của đề nghị trong mẫu đã OK',
    sigTitle: 'Chữ ký', sigWaiting: 'Chưa ký', sigAt: '{who}, {time}', sigOnBehalf: 'Thay {who}', hash: 'Mã băm nội dung',
    erpTitle: 'Gửi vào ERP', erpAttempts: 'Các lần gửi', attemptNo: 'Lần {n}', attemptManual: 'Gửi lại thủ công bởi {who}', attemptAuto: 'Tự động', attemptResult: { FAILED: 'Thất bại', ACCEPTED: 'ERP nhận' }, paymentRef: 'Mã tham chiếu thanh toán', noAttempts: 'Chưa gửi.',
    resend: 'Gửi lại vào ERP', resendTitle: 'Gửi lại {r} vào ERP', resendText: 'Cùng số đề nghị được dùng làm khóa chống trùng nên ERP không bao giờ tạo hai khoản thanh toán. Không cần ký lại.', resent: 'Đã gửi lại vào ERP.',
    invoicesTitle: 'Hóa đơn trong đề nghị', openInvoice: 'Mở hóa đơn để đọc bằng chứng', colInvoice: 'Hóa đơn', colDue: 'Hạn thanh toán', colTotal: 'Tổng tiền', colState: 'Trạng thái', colAction: 'Thao tác', remove: 'Gỡ khỏi đề nghị',
    removeTitle: 'Gỡ {n} khỏi đề nghị', removeText: 'Hóa đơn trở lại danh sách ngoại lệ của Kế toán phải trả. Tổng tiền và cấp duyệt của đề nghị được tính lại.', removeReason: 'Lý do', removed: 'Đã gỡ hóa đơn khỏi đề nghị.',
    decline: 'Từ chối đề nghị', declineTitle: 'Từ chối {r}', declineText: 'Toàn bộ hóa đơn trong đề nghị trở lại ngoại lệ. Kế toán phải trả được báo kèm lý do của bạn.', declineReason: 'Lý do từ chối', declined: 'Đã từ chối đề nghị.',
    signCta: 'Ký đề nghị', signHeading: 'Hành động của bạn', blockedHeading: 'Bạn chưa ký được', onBehalfNote: 'Bạn ký thay {who}.', delegatedAway: 'Bạn đã ủy quyền ký đến {date}.', readOnlyNote: 'Chỉ xem: đề nghị đã qua bước chờ chữ ký.', cancelledNote: 'Đề nghị đã bị hủy. Lý do: "{r}" (bởi {who}).',
    notFound: 'Không tìm thấy đề nghị này.',
  },
  delegations: {
    title: 'Ủy quyền ký', introSigner: 'Ủy quyền bạn đã cho hoặc nhận. Người được ủy quyền chỉ ký thay bạn từ ngày đầu đến ngày cuối.', introAdmin: 'Mọi ủy quyền ký ({entity}). Bạn thu hồi được nhưng không tạo hay ký.', new: 'Ủy quyền mới', savedViews: 'Chế độ xem đã lưu',
    views: { current: 'Hiện tại', past: 'Đã qua', all: 'Tất cả' }, colDelegator: 'Người ủy quyền', colDelegate: 'Người được ủy quyền', colFrom: 'Ngày đầu', colTo: 'Ngày cuối', colReason: 'Lý do', colState: 'Trạng thái', revoke: 'Thu hồi',
    states: { SCHEDULED: 'Sắp có hiệu lực', ACTIVE: 'Đang hiệu lực', ENDED: 'Đã hết hạn', REVOKED: 'Đã thu hồi' }, you: '(bạn)',
    emptyTitle: 'Chưa có ủy quyền', emptyText: 'Chỉ định người được ủy quyền khi bạn vắng mặt. Người đó ký thay bạn tối đa 30 ngày.', emptyAdmin: 'Chưa có Kế toán trưởng hay Người duyệt chi nào của pháp nhân này chỉ định người ủy quyền.',
    activeGave: 'Bạn đã ủy quyền ký cho {who} đến {date}. Bạn không ký được cho đến khi thu hồi.', activeReceived: '{who} đã ủy quyền ký cho bạn đến {date}.',
    revokeTitle: 'Thu hồi ủy quyền từ {a} sang {b} ({from} đến {to})?', revokeText: '{b} không còn ký thay {a} được. Chữ ký đã có vẫn hợp lệ. Việc thu hồi được lưu trong nhật ký kiểm toán.', revoked: 'Đã thu hồi ủy quyền.',
    formTitle: 'Ủy quyền mới', delegate: 'Người được ủy quyền', from: 'Ngày đầu', to: 'Ngày cuối', reason: 'Lý do', max30: 'Tối đa 30 ngày. Ngày đầu không ở quá khứ.', warnSelf: 'Trong thời gian ủy quyền, bạn không ký được. Có thể thu hồi để ký lại.', create: 'Tạo ủy quyền', created: 'Đã tạo ủy quyền.',
    kActive: 'Đang hiệu lực', kScheduled: 'Sắp có hiệu lực', kPast: 'Đã qua', immutable: 'Ủy quyền đã thu hồi không dùng lại được. Chữ ký đã có vẫn hợp lệ.',
  },
  audit: {
    title: 'Nhật ký kiểm toán', intro: 'Mọi quyết định của AI, Rule Engine và con người, mới nhất ở trên. Chỉ đọc, không sửa hay xóa được.', filters: 'Bộ lọc', from: 'Từ ngày', to: 'Đến ngày', document: 'Chứng từ hoặc đối tượng', documentPlaceholder: 'Số hóa đơn, mã đề nghị...',
    eventType: 'Loại sự kiện', allTypes: 'Tất cả loại', apply: 'Áp dụng', colTime: 'Thời gian', colHand: 'Bên thực hiện', colActor: 'Người', colType: 'Loại', colObject: 'Đối tượng', colEvent: 'Sự kiện',
    emptyTitle: 'Chưa có mục nào trong nhật ký', emptyText: 'Mục mới được ghi mỗi khi có quyết định hoặc thay đổi.', noMatch: 'Không có mục nào khớp bộ lọc', badDate: 'Ngày không hợp lệ. Dùng dd/MM/yyyy.',
    detailTitle: 'Chi tiết mục nhật ký', id: 'Mã mục', time: 'Thời gian', hand: 'Bên thực hiện', actor: 'Người thực hiện', type: 'Loại sự kiện', object: 'Đối tượng', event: 'Sự kiện', note: 'Ghi chú của người thực hiện', model: 'Mô hình AI', task: 'Tác vụ',
    system: 'Hệ thống', openInvoice: 'Mở hóa đơn', readOnlyNote: 'Mục nhật ký không thể sửa hay xóa.', raw: 'Dữ liệu sự kiện (JSON)', range: 'Khoảng ngày',
  },
  users: {
    title: 'Người dùng', introEntity: 'Người dùng ({entity}). Vô hiệu hóa chỉ tắt đăng nhập, không xóa lịch sử.', introGroup: 'Người dùng của mọi pháp nhân trong tập đoàn.', add: 'Thêm người dùng', savedViews: 'Bộ lọc', roleFilter: 'Vai trò', allRoles: 'Tất cả vai trò', entityFilter: 'Pháp nhân', allEntities: 'Tất cả pháp nhân',
    colName: 'Họ tên', colEmail: 'Email', colRole: 'Vai trò', colEntity: 'Pháp nhân', colErp: 'Tài khoản ERP', colStatus: 'Trạng thái', status: { ACTIVE: 'Đang hoạt động', DEACTIVATED: 'Đã vô hiệu hóa' }, you: '(bạn)', deactivate: 'Vô hiệu hóa',
    emptyTitle: 'Chưa có người dùng', emptyText: 'Thêm người dùng đầu tiên để họ đăng nhập được.', noMatch: 'Không có người dùng nào khớp bộ lọc', group: 'Toàn tập đoàn',
    addTitle: 'Thêm người dùng', editTitle: 'Sửa người dùng', fullName: 'Họ tên', email: 'Email', role: 'Vai trò', level: 'Cấp duyệt', entity: 'Pháp nhân', erpUser: 'Tài khoản ERP', erpHint: 'Dùng để biết ai tạo đơn đặt hàng trong ERP. Có thể để trống.', password: 'Mật khẩu tạm', passwordHint: 'Ít nhất 8 ký tự.',
    save: 'Lưu người dùng', created: 'Đã thêm người dùng.', updated: 'Đã lưu người dùng.', deactivated: 'Đã vô hiệu hóa người dùng.', deactivateTitle: 'Vô hiệu hóa {name}?', deactivateText: 'Người này không đăng nhập được nữa. Lịch sử và chữ ký đã có được giữ nguyên.',
    emailInvalid: 'Email không hợp lệ.',
  },
  policy: {
    title: 'Chính sách pháp nhân', intro: 'Ngưỡng và quy tắc ({entity}). Giá trị không được vượt giới hạn tập đoàn.', groupLimits: 'Giới hạn tập đoàn', maxTolerance: 'Ngưỡng giá tối đa: {n}%', maxThreshold: 'Ngưỡng lô tối đa: {n}',
    tolerance: 'Ngưỡng chênh giá (%)', toleranceHint: 'Giá hóa đơn được lệch so với đơn đặt hàng tối đa bấy nhiêu phần trăm. Tối đa {max}%.', threshold: 'Ngưỡng tổng tiền của lô (₫)', thresholdHint: 'Hóa đơn có tổng tiền từ ngưỡng này trở lên không vào lô tự động. Tối đa {max}.',
    sampleRate: 'Tỷ lệ mẫu kiểm tra (%)', sampleHint: 'Từ 1 đến 100. Cỡ mẫu được làm tròn lên.', grouping: 'Cách gom đề nghị', groupingOptions: { BY_SUPPLIER: 'Mỗi nhà cung cấp một đề nghị', PER_INVOICE: 'Mỗi hóa đơn một đề nghị' },
    dirty: 'Có thay đổi chưa lưu', save: 'Lưu chính sách', discard: 'Bỏ thay đổi', saved: 'Đã lưu chính sách. Thay đổi được ghi vào nhật ký kiểm toán.', overMax: 'Vượt giới hạn tập đoàn ({max}).', invalid: 'Giá trị không hợp lệ.',
    effect: 'Thay đổi chỉ áp dụng cho hóa đơn kiểm tra sau khi lưu.',
  },
  matrix: {
    title: 'Ma trận phê duyệt', intro: 'Cấp duyệt chi theo tổng tiền của đề nghị thanh toán (BR-03). Đề nghị chưa ký được tính lại khi lưu.', tier: 'Mức {n}', level: 'Cấp duyệt', range: 'Khoảng tổng tiền', from: 'Từ', upTo: 'Dưới', noUpper: 'Không giới hạn trên', approvers: 'Người duyệt chi', approversHint: 'Chọn ít nhất một người đang hoạt động cho mỗi mức.',
    boundary: 'Ngưỡng giữa hai mức (₫)', boundaryHint: 'Tổng tiền dưới ngưỡng này do mức thấp duyệt, từ ngưỡng trở lên do mức cao duyệt.', save: 'Lưu ma trận', discard: 'Bỏ thay đổi', dirty: 'Có thay đổi chưa lưu', saved: 'Đã lưu ma trận. Đề nghị chưa ký đã được tính lại.',
    noApprover: 'Chưa có Người duyệt chi nào ở pháp nhân này.', preview: 'Tóm tắt', previewLine: '{level}: {range}, {names}', none: 'chưa chọn người duyệt',
  },
  group: {
    title: 'Tổng quan tập đoàn', intro: 'Trạng thái cổng, cảnh báo và đồng bộ ERP của từng pháp nhân. Chỉ có số lượng, không có dữ liệu hóa đơn.', colEntity: 'Pháp nhân', colGates: 'Cổng', colAlerts: 'Cảnh báo', colSync: 'Đồng bộ ERP gần nhất', gatesValue: '{o} mở, {c} đóng',
    noAlerts: 'Không có cảnh báo', alertLine: '{s}: {rate} lỗi ({e} trên {n} mẫu)', syncFailed: 'Đồng bộ thất bại', syncOk: 'Thành công', openGates: 'Mở trang cổng', manage: 'Quản lý pháp nhân',
    kEntities: 'Pháp nhân', kOpen: 'Cổng đang mở', kAlerts: 'Cảnh báo cổng', kAlertsSub: 'Tỷ lệ lỗi mẫu trên 2%', emptyTitle: 'Chưa có pháp nhân', emptyText: 'Thêm pháp nhân đầu tiên của tập đoàn.',
  },
  entities: {
    title: 'Pháp nhân và hạn mức tập đoàn', intro: 'Pháp nhân của tập đoàn, hạn mức tối đa mà chính sách từng pháp nhân không được vượt, và các ngành được phát hành hóa đơn không mã.', add: 'Thêm pháp nhân', colName: 'Tên', colTax: 'Mã số thuế', colTol: 'Ngưỡng giá', colThr: 'Ngưỡng lô', colSample: 'Tỷ lệ mẫu', colMailbox: 'Hộp thư hóa đơn',
    limitsTitle: 'Hạn mức tập đoàn', maxTol: 'Ngưỡng giá tối đa (%)', maxThr: 'Ngưỡng lô tối đa (₫)', limitsHint: 'Hạ hạn mức sẽ tự hạ chính sách của pháp nhân đang vượt hạn mức mới.', saveLimits: 'Lưu hạn mức', limitsSaved: 'Đã lưu hạn mức.', lowered: 'Đã hạ ngưỡng giá của {names} xuống {to}%.',
    sectorsTitle: 'Ngành được phát hành hóa đơn không mã', sectorsHint: 'Hóa đơn của các ngành này có thể không có mã của cơ quan thuế.', sectorName: 'Tên ngành', addSector: 'Thêm ngành', removeSector: 'Bỏ ngành {s}', sectorAdded: 'Đã thêm ngành.', sectorRemoved: 'Đã bỏ ngành.', noSectors: 'Chưa có ngành nào.',
    addTitle: 'Thêm pháp nhân', name: 'Tên pháp nhân', taxCode: 'Mã số thuế', taxHint: 'Đúng 10 chữ số.', added: 'Đã thêm pháp nhân.', save: 'Thêm', emptyTitle: 'Chưa có pháp nhân',
  },
  gates: {
    title: 'Cổng tự động hóa', intro: 'Mỗi cặp nhà cung cấp và pháp nhân có một cổng. Cổng đóng thì hóa đơn luôn thành ngoại lệ. Cổng mở sau khi độ chính xác đủ cao trên ít nhất 50 hóa đơn đã so sánh.',
    kOpen: 'Cổng đang mở', kClosed: 'Cổng đóng', kAlerts: 'Cổng có cảnh báo', views: { all: 'Tất cả', alerts: 'Có cảnh báo', open: 'Đang mở', closed: 'Đóng' }, savedViews: 'Chế độ xem đã lưu', entityFilter: 'Pháp nhân', allEntities: 'Tất cả pháp nhân',
    colSupplier: 'Nhà cung cấp', colEntity: 'Pháp nhân', colState: 'Trạng thái', colAccuracy: 'Độ chính xác', colCompared: 'Đã so sánh', colSample: 'Mẫu kiểm tra', colAction: 'Thao tác', states: { OPEN: 'Mở', CLOSED: 'Đóng' }, since: 'từ {d}',
    accuracyValue: '{a} ({u} trên {n} không đổi)', sampleValue: '{e} lỗi trên {n} mẫu', alert: 'Cảnh báo: {rate} lỗi mẫu, trên 2%', open: 'Mở cổng', close: 'Đóng cổng', emptyTitle: 'Chưa có cổng', emptyText: 'Cổng được tạo khi một nhà cung cấp có hóa đơn đầu tiên.', noMatch: 'Không có cổng nào khớp bộ lọc',
    openTitle: 'Mở cổng {s} / {e}', closeTitle: 'Đóng cổng {s} / {e}?', closeText: 'Hóa đơn của nhà cung cấp này sẽ luôn thành ngoại lệ ở pháp nhân này cho đến khi mở lại.', evidence: 'Bằng chứng', tooFew: 'Cần ít nhất 50 hóa đơn đã so sánh. Hiện có {n}.',
    lowAccuracy: 'Độ chính xác dưới 98%. Cần nhập lý do để mở cổng.', reason: 'Lý do', reasonRequired: 'Cần nhập lý do khi độ chính xác dưới 98%.', opened: 'Đã mở cổng.', closed: 'Đã đóng cổng.', simulated: 'Đã so sánh (mô phỏng)', sampleErrors: 'Lỗi mẫu',
  },
  erp: {
    title: 'Giả lập ERP', intro: 'Công cụ demo thay cho ERP của pháp nhân: tạo đơn đặt hàng và xác nhận phiếu nhận. Hóa đơn đang chờ nhận hàng được kiểm tra lại sau khi phiếu nhận được xác nhận.', demoNote: 'Chỉ dùng để demo',
    entity: 'Pháp nhân', tabs: { orders: 'Đơn đặt hàng', receipts: 'Phiếu nhận' }, savedViews: 'Chế độ xem', newOrder: 'Tạo đơn đặt hàng', confirmReceipt: 'Xác nhận phiếu nhận',
    colPo: 'Đơn', colSupplier: 'Nhà cung cấp', colKind: 'Loại', colLines: 'Dòng hàng', colQty: 'Đã nhận / đặt', colBy: 'Tạo bởi', colAt: 'Thời gian', colGrn: 'Phiếu', colQtyRecv: 'Số lượng', colNote: 'Ghi chú', colPersona: 'Người xác nhận',
    kinds: { GOODS: 'Hàng hóa', SERVICE: 'Dịch vụ' }, personas: { BUYER: 'Nhân viên mua hàng', WAREHOUSE_KEEPER: 'Thủ kho', ACCEPTOR: 'Người nghiệm thu' },
    emptyOrders: 'Chưa có đơn đặt hàng', emptyOrdersText: 'Tạo đơn đặt hàng để hóa đơn có thể khớp với đơn.', emptyReceipts: 'Chưa có phiếu nhận', emptyReceiptsText: 'Xác nhận phiếu nhận cho một đơn để đơn trở thành ứng viên khớp hóa đơn.',
    orderTitle: 'Tạo đơn đặt hàng', supplier: 'Nhà cung cấp', kind: 'Loại đơn', persona: 'Người tạo', lines: 'Dòng hàng', item: 'Tên hàng', qty: 'Số lượng', unit: 'Đơn vị', price: 'Đơn giá (₫)', addLine: 'Thêm dòng', removeLine: 'Bỏ dòng', orderCreated: 'Đã tạo đơn {po}.', create: 'Tạo đơn',
    receiptTitle: 'Xác nhận phiếu nhận', order: 'Đơn đặt hàng', outstanding: 'Còn thiếu {n}', quantity: 'Số lượng nhận', note: 'Ghi chú', receiptCreated: 'Đã xác nhận phiếu nhận {grn}. Hóa đơn chờ nhận hàng sẽ được kiểm tra lại ở lần đồng bộ ERP.', sameHint: 'Phiếu nhận phải do người khác với người tạo đơn xác nhận.',
    syncNow: 'Đồng bộ ERP ngay', sync: 'Cho Rule Engine kiểm tra lại hóa đơn chờ nhận hàng đúng lúc này.', synced: 'Đã đồng bộ ERP.', defaultItem: 'Thùng carton', defaultUnit: 'cái',
  },
  demo: {
    title: 'Công cụ demo', persona: 'Chuyển vai trò', forceState: 'Ép trạng thái trang', forceHint: 'Dùng để trình bày các trạng thái đã tài liệu hóa: đang tải, trống, lỗi máy chủ, AI lỗi, xung đột.',
    states: { none: 'Bình thường', loading: 'Đang tải', empty: 'Trống', 'server-error': 'Lỗi máy chủ', 'ai-error': 'AI hoặc dịch vụ ngoài lỗi', conflict: 'Xung đột phiên bản' },
    otp: 'Mã xác thực khi ký', clock: 'Giờ demo', reset: 'Đặt lại dữ liệu demo', resetTitle: 'Đặt lại dữ liệu demo?', resetText: 'Mọi thay đổi bạn đã làm sẽ mất và dữ liệu mẫu ban đầu được nạp lại.', resetDone: 'Đã đặt lại dữ liệu demo.',
  },
};

export const fmt = interpolate;
