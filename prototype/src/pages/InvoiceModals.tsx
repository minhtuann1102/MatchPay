import { useEffect, useState } from 'react';
import type { CorrectionRequest, InvoiceDetail, MessageTemplate } from '../api/types';
import { draftCorrectionRequest, recordCancellationNotice, sendCorrectionRequest, type CancellationResult } from '../api/invoices';
import { Field, Notice } from '../components/Bits';
import { HandTag } from '../components/Chips';
import { Modal } from '../components/Modal';
import { ActionError } from '../components/ReasonModal';
import { fmtDate, parseDate } from '../lib/format';
import { errorText } from '../lib/errors';
import { useAction } from '../lib/useAction';
import { useQuery } from '@tanstack/react-query';
import { t } from '../i18n/vi';

const KINDS: MessageTemplate['kind'][] = ['CORRECTION_REQUEST', 'DATA_FIX_NOTICE', 'REISSUE_REQUEST'];

/** SCR-14 Correction request draft. The AI drafts from an approved template; nothing is sent until Send is pressed. */
export function CorrectionModal({ detail, initialKind, onClose }: { detail: InvoiceDetail; initialKind: MessageTemplate['kind']; onClose: () => void }) {
  const [kind, setKind] = useState(initialKind);
  const [draft, setDraft] = useState<CorrectionRequest | null>(null);
  const [drafting, setDrafting] = useState(true);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [touched, setTouched] = useState(false);
  const send = useAction((a: { id: string; subject: string; body: string; recipient: string }) => sendCorrectionRequest(a.id, a), { success: t.correction.sent, onSuccess: onClose });

  // The draft is made again whenever the type changes.
  const q = useQuery({
    queryKey: ['draft', detail.invoice.id, kind],
    queryFn: () => draftCorrectionRequest(detail.invoice.id, kind),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
  useEffect(() => {
    setDrafting(q.isPending);
    if (q.isError) setDraftError(errorText(q.error));
    if (q.data) {
      setDraft(q.data);
      setRecipient(q.data.recipient);
      setSubject(q.data.subject);
      setBody(q.data.body);
      setDraftError(null);
    }
  }, [q.data, q.isPending, q.isError, q.error]);

  const bad = {
    recipient: !/^\S+@\S+\.\S+$/.test(recipient.trim()),
    subject: !subject.trim(),
    body: !body.trim(),
  };
  const invalid = bad.recipient || bad.subject || bad.body;

  return (
    <Modal
      title={t.correction.title}
      large
      onClose={onClose}
      dismissable={!send.pending}
      onSubmit={() => {
        setTouched(true);
        if (!invalid && draft) void send.run({ id: draft.id, subject, body, recipient });
      }}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={send.pending}>{t.common.cancel}</button>
          <button type="submit" className="btn btn-primary" disabled={send.pending || drafting || !draft}>
            {send.pending && <span className="spin" />}
            {send.error ? t.correction.retry : t.correction.send}
          </button>
        </>
      }
    >
      <p className="small muted">{t.correction.intro}</p>
      <div className="field">
        <label htmlFor="cr-kind">{t.correction.type}</label>
        <select id="cr-kind" className="select" value={kind} onChange={(e) => setKind(e.target.value as MessageTemplate['kind'])} disabled={drafting || send.pending}>
          {KINDS.map((k) => <option key={k} value={k}>{t.correction.kinds[k]}</option>)}
        </select>
      </div>
      {drafting && <p className="small" role="status"><span className="spin" /> {t.correction.drafting}</p>}
      {draftError && <Notice kind="err">{draftError}</Notice>}
      {draft && !drafting && (
        <>
          {draft.aiDraft ? (
            <div className="row"><HandTag hand="AI" /><span className="small muted">{t.correction.aiDraft}</span></div>
          ) : (
            <Notice kind="warn" title={t.correction.aiUnavailable}>{t.correction.blankTemplate}</Notice>
          )}
          <Field label={`${t.correction.recipient} ${t.common.required}`} htmlFor="cr-to" error={touched && bad.recipient ? t.correction.recipientInvalid : null} hint={t.correction.recipientHint}>
            <input id="cr-to" className={`input${touched && bad.recipient ? ' invalid' : ''}`} value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          </Field>
          <Field label={`${t.correction.subject} ${t.common.required}`} htmlFor="cr-sub" error={touched && bad.subject ? t.correction.required : null}>
            <input id="cr-sub" className={`input${touched && bad.subject ? ' invalid' : ''}`} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label={`${t.correction.body} ${t.common.required}`} htmlFor="cr-body" error={touched && bad.body ? t.correction.required : null}>
            <textarea id="cr-body" className={`textarea${touched && bad.body ? ' invalid' : ''}`} style={{ minHeight: 160 }} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          {send.error && (
            <Notice kind="err" title={t.correction.notSent}>{send.error}</Notice>
          )}
        </>
      )}
    </Modal>
  );
}

/** SCR-19 Record cancellation notice. */
export function CancellationModal({ detail, onClose, onDone }: { detail: InvoiceDetail; onClose: () => void; onDone: (r: CancellationResult) => void }) {
  const inv = detail.invoice;
  const [reference, setReference] = useState('');
  const [date, setDate] = useState('31/10/2026');
  const [fileName, setFileName] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const rec = useAction((a: { id: string; body: Parameters<typeof recordCancellationNotice>[1] }) => recordCancellationNotice(a.id, a.body), { success: t.cancel.toast, onSuccess: onDone });
  const iso = parseDate(date);
  const bad = { reference: !reference.trim(), date: !iso };
  const effect =
    inv.state === 'SIGNED' ? t.cancel.effectSigned
    : inv.state === 'IN_BATCH' && detail.request ? t.cancel.effectInRequest.replace('{r}', detail.request.id)
    : inv.state === 'IN_BATCH' ? t.cancel.effectInBatch
    : inv.state === 'WAITING_FOR_GOODS' ? t.cancel.effectWaiting
    : t.cancel.effectException;
  return (
    <Modal
      title={t.cancel.title}
      onClose={onClose}
      dismissable={!rec.pending}
      onSubmit={() => {
        setTouched(true);
        if (!bad.reference && !bad.date) void rec.run({ id: inv.id, body: { reference, noticeDate: iso, fileName, version: inv.version } });
      }}
      footer={<><button type="button" className="btn" onClick={onClose} disabled={rec.pending}>{t.common.cancel}</button><button type="submit" className="btn btn-primary" disabled={rec.pending}>{rec.pending && <span className="spin" />}{t.cancel.record}</button></>}
    >
      <dl className="dl">
        <dt>{t.detail.seller}</dt><dd>{detail.supplierName}</dd>
        <dt>{t.invoices.colInvoice}</dt><dd className="mono">{inv.invoiceNumber}</dd>
      </dl>
      <Notice kind="info" title={t.cancel.whatHappens}>{effect}</Notice>
      <Field label={`${t.cancel.reference} ${t.common.required}`} htmlFor="cn-ref" error={touched && bad.reference ? t.cancel.referenceRequired : null}>
        <input id="cn-ref" className={`input${touched && bad.reference ? ' invalid' : ''}`} value={reference} onChange={(e) => setReference(e.target.value)} data-autofocus />
      </Field>
      <Field label={`${t.cancel.date} ${t.common.required}`} htmlFor="cn-date" hint={t.cancel.dateHint} error={touched && bad.date ? t.cancel.dateInvalid : null}>
        <input id="cn-date" className={`input${touched && bad.date ? ' invalid' : ''}`} value={date} onChange={(e) => setDate(e.target.value)} placeholder="dd/mm/yyyy" inputMode="numeric" />
      </Field>
      <Field label={t.cancel.file} htmlFor="cn-file" hint={fileName ? undefined : t.cancel.fileHint}>
        <input id="cn-file" className="input" type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
      </Field>
      <p className="xs muted">{t.cancel.dateShown.replace('{d}', fmtDate(iso))}</p>
      <ActionError error={rec.error} raw={rec.rawError} />
    </Modal>
  );
}
