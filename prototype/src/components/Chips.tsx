import type { ReactNode } from 'react';
import type { ExceptionState, InvoiceState, RequestState, Batch } from '../api/types';
import { t } from '../i18n/vi';
import { Icon } from './Icon';

type Kind = 'open' | 'work' | 'wait' | 'exc' | 'ok' | 'end' | 'bad';
export const Chip = ({ kind, children }: { kind: Kind; children: ReactNode }) => <span className={`chip c-${kind}`}>{children}</span>;

const INVOICE_KIND: Record<InvoiceState, Kind> = {
  RECEIVED: 'open', IN_CHECK: 'work', WAITING_FOR_GOODS: 'wait', SEPARATED: 'end', REJECTED: 'bad', EXCEPTION: 'exc', IN_BATCH: 'ok', SIGNED: 'ok', SENT: 'work', PAID: 'end', SUPERSEDED: 'end',
};
export const StateBadge = ({ state }: { state: InvoiceState }) => <Chip kind={INVOICE_KIND[state]}>{t.invoiceState[state]}</Chip>;

const EXC_KIND: Record<ExceptionState, Kind> = { OPEN: 'open', IN_REVIEW: 'work', WAITING_FOR_SUPPLIER: 'wait', WAITING_FOR_DATA_FIX: 'wait', WAITING_FOR_DECISION: 'wait', CLOSED: 'end' };
export const ExceptionBadge = ({ state }: { state: ExceptionState }) => <Chip kind={EXC_KIND[state]}>{t.exceptionState[state]}</Chip>;

const REQ_KIND: Record<RequestState, Kind> = { AWAITING_CHIEF_ACCOUNTANT: 'wait', AWAITING_PAYMENT_APPROVER: 'wait', SIGNED: 'ok', SENT: 'work', PAID: 'end', CANCELLED: 'bad' };
export const RequestBadge = ({ state }: { state: RequestState }) => <Chip kind={REQ_KIND[state]}>{t.requestState[state]}</Chip>;

const BATCH_KIND: Record<Batch['state'], Kind> = { OPEN: 'open', IN_REVIEW: 'work', IN_SIGNING: 'wait', SIGNED: 'ok', SENT: 'work', COMPLETED: 'end' };
export const BatchBadge = ({ state }: { state: Batch['state'] }) => <Chip kind={BATCH_KIND[state]}>{t.batchState[state]}</Chip>;

/** The three hands (D-44): AI proposed, Rule Engine decided, a Person decided. */
export function HandTag({ hand }: { hand: 'AI' | 'RULE' | 'PERSON' }) {
  const icon = hand === 'AI' ? 'ai' : hand === 'RULE' ? 'rule' : 'seal';
  return (
    <span className={`au au-${hand.toLowerCase()}`}>
      <Icon name={icon} />
      {t.hands[hand]}
    </span>
  );
}
