import type { ReactNode } from 'react';
import { Badge, Tag } from 'antd';
import {
  RobotOutlined, SafetyCertificateOutlined, UserOutlined, DatabaseOutlined, CloudServerOutlined,
} from '@ant-design/icons';
import type { ExceptionState, InvoiceState, RequestState, Batch } from '../api/types';
import { t } from '../i18n/vi';
import { TOKENS } from '../theme/theme';

// Status is a colored dot plus text (D-215): never color alone, no icons, no spinning.
type Tone = 'neutral' | 'primary' | 'warning' | 'success' | 'error';
const DOT: Record<Tone, string> = {
  neutral: TOKENS.neutralDot,
  primary: TOKENS.primary,
  warning: TOKENS.warning,
  success: TOKENS.success,
  error: TOKENS.error,
};
/** A status shown as a colored dot plus text, for states that have no dedicated badge (D-215). */
export const StatusDot = ({ tone, children }: { tone: Tone; children: ReactNode }) => <Badge color={DOT[tone]} text={children} />;
const Status = StatusDot;

const INVOICE: Record<InvoiceState, Tone> = {
  RECEIVED: 'neutral',
  IN_CHECK: 'primary',
  WAITING_FOR_GOODS: 'warning',
  SEPARATED: 'neutral',
  REJECTED: 'error',
  EXCEPTION: 'warning',
  IN_BATCH: 'success',
  SIGNED: 'primary',
  SENT: 'primary',
  PAID: 'success',
  SUPERSEDED: 'neutral',
};
export const StateBadge = ({ state }: { state: InvoiceState }) => <Status tone={INVOICE[state]}>{t.invoiceState[state]}</Status>;

const EXC: Record<ExceptionState, Tone> = {
  OPEN: 'neutral',
  IN_REVIEW: 'primary',
  WAITING_FOR_SUPPLIER: 'warning',
  WAITING_FOR_DATA_FIX: 'warning',
  WAITING_FOR_DECISION: 'warning',
  CLOSED: 'neutral',
};
export const ExceptionBadge = ({ state }: { state: ExceptionState }) => <Status tone={EXC[state]}>{t.exceptionState[state]}</Status>;

const REQ: Record<RequestState, Tone> = {
  AWAITING_CHIEF_ACCOUNTANT: 'warning',
  AWAITING_PAYMENT_APPROVER: 'warning',
  SIGNED: 'primary',
  SENT: 'primary',
  PAID: 'success',
  CANCELLED: 'error',
};
export const RequestBadge = ({ state }: { state: RequestState }) => <Status tone={REQ[state]}>{t.requestState[state]}</Status>;

const BATCH: Record<Batch['state'], Tone> = {
  OPEN: 'neutral',
  IN_REVIEW: 'primary',
  IN_SIGNING: 'warning',
  SIGNED: 'primary',
  SENT: 'primary',
  COMPLETED: 'success',
};
export const BatchBadge = ({ state }: { state: Batch['state'] }) => <Status tone={BATCH[state]}>{t.batchState[state]}</Status>;

/** The three hands (D-44, D-217): AI proposed (dashed round outline), Rule Engine decided (square outline), a Person decided (dark filled). */
export function HandTag({ hand }: { hand: 'AI' | 'RULE' | 'PERSON' | 'SYSTEM' | 'ERP' }) {
  const label = t.hands[hand];
  switch (hand) {
    case 'AI': return <Tag className="hand hand-ai" icon={<RobotOutlined />}>{label}</Tag>;
    case 'RULE': return <Tag className="hand hand-rule" icon={<SafetyCertificateOutlined />}>{label}</Tag>;
    case 'PERSON': return <Tag className="hand hand-person" icon={<UserOutlined />}>{label}</Tag>;
    case 'ERP': return <Tag className="hand hand-data" icon={<CloudServerOutlined />}>{label}</Tag>;
    default: return <Tag className="hand hand-data" icon={<DatabaseOutlined />}>{label}</Tag>;
  }
}
