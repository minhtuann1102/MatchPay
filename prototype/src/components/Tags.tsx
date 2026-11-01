import type { ReactNode } from 'react';
import { Tag } from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, DollarOutlined, ExclamationCircleOutlined, InboxOutlined, MinusCircleOutlined,
  RobotOutlined, SafetyCertificateOutlined, SendOutlined, SyncOutlined, UserOutlined, EditOutlined, DatabaseOutlined, CloudServerOutlined,
} from '@ant-design/icons';
import type { ExceptionState, InvoiceState, RequestState, Batch } from '../api/types';
import { t } from '../i18n/vi';

type Preset = 'default' | 'processing' | 'success' | 'warning' | 'error';
const Status = ({ preset, icon, children }: { preset: Preset; icon: ReactNode; children: ReactNode }) => <Tag color={preset} icon={icon} style={{ marginInlineEnd: 0 }}>{children}</Tag>;

const INVOICE: Record<InvoiceState, [Preset, ReactNode]> = {
  RECEIVED: ['default', <InboxOutlined />],
  IN_CHECK: ['processing', <SyncOutlined spin />],
  WAITING_FOR_GOODS: ['warning', <ClockCircleOutlined />],
  SEPARATED: ['default', <MinusCircleOutlined />],
  REJECTED: ['error', <CloseCircleOutlined />],
  EXCEPTION: ['warning', <ExclamationCircleOutlined />],
  IN_BATCH: ['success', <CheckCircleOutlined />],
  SIGNED: ['error', <SafetyCertificateOutlined />],
  SENT: ['processing', <SendOutlined />],
  PAID: ['success', <DollarOutlined />],
  SUPERSEDED: ['default', <MinusCircleOutlined />],
};
export const StateBadge = ({ state }: { state: InvoiceState }) => <Status preset={INVOICE[state][0]} icon={INVOICE[state][1]}>{t.invoiceState[state]}</Status>;

const EXC: Record<ExceptionState, [Preset, ReactNode]> = {
  OPEN: ['default', <InboxOutlined />],
  IN_REVIEW: ['processing', <SyncOutlined />],
  WAITING_FOR_SUPPLIER: ['warning', <ClockCircleOutlined />],
  WAITING_FOR_DATA_FIX: ['warning', <ClockCircleOutlined />],
  WAITING_FOR_DECISION: ['warning', <ClockCircleOutlined />],
  CLOSED: ['default', <CheckCircleOutlined />],
};
export const ExceptionBadge = ({ state }: { state: ExceptionState }) => <Status preset={EXC[state][0]} icon={EXC[state][1]}>{t.exceptionState[state]}</Status>;

const REQ: Record<RequestState, [Preset, ReactNode]> = {
  AWAITING_CHIEF_ACCOUNTANT: ['warning', <ClockCircleOutlined />],
  AWAITING_PAYMENT_APPROVER: ['warning', <ClockCircleOutlined />],
  SIGNED: ['error', <SafetyCertificateOutlined />],
  SENT: ['processing', <SendOutlined />],
  PAID: ['success', <DollarOutlined />],
  CANCELLED: ['error', <CloseCircleOutlined />],
};
export const RequestBadge = ({ state }: { state: RequestState }) => <Status preset={REQ[state][0]} icon={REQ[state][1]}>{t.requestState[state]}</Status>;

const BATCH: Record<Batch['state'], [Preset, ReactNode]> = {
  OPEN: ['default', <InboxOutlined />],
  IN_REVIEW: ['processing', <SyncOutlined />],
  IN_SIGNING: ['warning', <EditOutlined />],
  SIGNED: ['error', <SafetyCertificateOutlined />],
  SENT: ['processing', <SendOutlined />],
  COMPLETED: ['success', <CheckCircleOutlined />],
};
export const BatchBadge = ({ state }: { state: Batch['state'] }) => <Status preset={BATCH[state][0]} icon={BATCH[state][1]}>{t.batchState[state]}</Status>;

/** The three hands (D-44): AI proposed (dashed purple), Rule Engine decided (outlined), a Person decided (seal red). */
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
