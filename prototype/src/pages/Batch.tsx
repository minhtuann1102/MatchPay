import { Fragment, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { BatchOverview, Invoice, PaymentRequest, SampleItem } from '../api/types';
import { closeBatchForReview, expandSample, markSampleItem, releaseBatch, reopenBatch, resendToErp } from '../api/batch';
import { useBatch, useBatchList } from '../api/hooks';
import { Async } from '../components/Async';
import { EmptyState, Menu, Notice, PageHeader } from '../components/Bits';
import { BatchBadge, HandTag, RequestBadge, StateBadge } from '../components/Chips';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { ActionError, ReasonModal } from '../components/ReasonModal';
import { fmtDate, fmtDateTime, fmtMoney } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

type Dlg = null | 'close' | 'release' | 'expand' | 'reopen' | { resend: PaymentRequest };

const STAGES = ['open', 'closed', 'sampled', 'released', 'sent'] as const;

function currentStage(o: BatchOverview): number {
  switch (o.batch.state) {
    case 'OPEN': return 0;
    case 'IN_REVIEW': return o.batch.sample.length > 0 && o.sampleRemaining === 0 ? 2 : 1;
    case 'IN_SIGNING': return 3;
    case 'SIGNED': return 3;
    case 'SENT': return 4;
    case 'COMPLETED': return 5;
  }
}

/** SCR-30 Batch Review, with SCR-31 to SCR-34 and SCR-57 as modals. */
export function Batch() {
  const list = useBatchList();
  const [sel, setSel] = useState<string | null>(null);
  const q = useBatch(sel);
  const [dlg, setDlg] = useState<Dlg>(null);
  const close = () => setDlg(null);
  return (
    <Async q={q} skeletonRows={8} isEmpty={(d) => !d} empty={<div className="card"><EmptyState icon="stack" title={t.batch.noBatchTitle} text={t.batch.noBatchText} /></div>}>
      {(o) =>
        o ? (
          <BatchView o={o} options={list.data ?? []} selected={sel ?? o.batch.id} onSelect={setSel} dlg={dlg} setDlg={setDlg} close={close} />
        ) : null
      }
    </Async>
  );
}

function BatchView({ o, options, selected, onSelect, dlg, setDlg, close }: { o: BatchOverview; options: { id: string; label: string; state: string }[]; selected: string; onSelect: (id: string) => void; dlg: Dlg; setDlg: (d: Dlg) => void; close: () => void }) {
  const b = o.batch;
  const stage = currentStage(o);
  const markAct = useAction((a: { invoiceId: string; mark: 'OK' | 'ERROR'; reason?: string }) => markSampleItem(b.id, { ...a, version: b.version }), { success: (r) => (r ? t.batch.toastMarked : t.batch.toastMarked) });
  const requestsRows = o.requests;

  const primary: ReactNode =
    b.state === 'OPEN' ? <button type="button" className="btn btn-primary" disabled={o.invoices.length === 0} onClick={() => setDlg('close')}>{t.batch.close}</button>
    : b.state === 'IN_REVIEW' ? <button type="button" className="btn btn-primary" disabled={o.sampleRemaining > 0 || o.invoices.length === 0} onClick={() => setDlg('release')}>{t.batch.release}</button>
    : null;

  const menuItems = [
    ...(b.state === 'IN_REVIEW' ? [{ label: t.batch.expand, onClick: () => setDlg('expand') }] : []),
    ...(b.state === 'IN_SIGNING' ? [{ label: t.batch.reopen, onClick: () => setDlg('reopen') }] : []),
  ];

  const dueSoonest = [...o.invoices].sort((a, c) => a.dueDate.localeCompare(c.dueDate))[0];
  const grouped = new Map<string, Invoice[]>();
  o.invoices.forEach((i) => grouped.set(i.sellerName, [...(grouped.get(i.sellerName) ?? []), i]));

  return (
    <>
      <PageHeader
        title={`${t.batch.title}: ${b.label}`}
        meta={
          <>
            <BatchBadge state={b.state} />
            {options.length > 1 && (
              <label className="row xs">
                <span className="muted">{t.batch.period}</span>
                <select className="select" style={{ width: 'auto' }} value={selected} onChange={(e) => onSelect(e.target.value)} aria-label={t.batch.period}>
                  {options.map((x) => <option key={x.id} value={x.id}>{x.label} - {t.batchState[x.state as 'OPEN']}</option>)}
                </select>
              </label>
            )}
          </>
        }
        actions={<>{menuItems.length > 0 && <Menu items={menuItems} />}{primary}</>}
      />
      {b.state === 'IN_REVIEW' && o.sampleRemaining > 0 && <p className="small muted" role="status">{t.batch.stillToMark.replace('{n}', String(o.sampleRemaining))} {t.batch.releaseNeeds}</p>}

      <ol className="stepper" aria-label={t.batch.progress}>
        {STAGES.map((k, n) => (
          <li key={k} className={`${n < stage ? 'done' : ''}${n === stage ? ' cur' : ''}`} aria-current={n === stage ? 'step' : undefined}>
            <span className="dot">{n < stage ? <Icon name="check" /> : null}</span>
            <span className="lab"><b>{t.batch.stages[k]}</b></span>
          </li>
        ))}
      </ol>

      {b.reopenedNote && b.state === 'IN_REVIEW' && <Notice kind="info" title={t.batch.reopenedDone}>{t.batch.reopenedText}</Notice>}
      {o.canResend.length > 0 && requestsRows.filter((r) => o.canResend.includes(r.id)).map((r) => (
        <Notice key={r.id} kind="warn" title={t.batch.sendFailed.replace('{r}', r.id)} action={<button type="button" className="btn btn-sm" onClick={() => setDlg({ resend: r })}>{t.batch.resend}</button>}>{t.batch.sendFailedText}</Notice>
      ))}

      <div className="kpis">
        <div className="tile"><span className="t-lbl">{t.batch.kInvoices}</span><span className="t-val">{o.invoices.length}</span><span className="t-sub">{t.batch.kInvoicesSub}</span></div>
        <div className="tile"><span className="t-lbl">{t.batch.kTotal}</span><span className="t-val" style={{ fontSize: 20 }}>{fmtMoney(o.total)}</span><span className="t-sub">{t.batch.kTotalSub.replace('{n}', String(o.invoices.length))}</span></div>
        <div className="tile"><span className="t-lbl">{t.batch.kRequests}</span><span className="t-val">{requestsRows.filter((r) => r.state !== 'CANCELLED').length || o.requestCountOnRelease}</span><span className="t-sub">{requestsRows.length ? t.batch.kRequestsReleased : t.batch.kRequestsPlanned}</span></div>
        <div className="tile"><span className="t-lbl">{t.batch.kDue}</span><span className="t-val" style={{ fontSize: 20 }}>{dueSoonest ? fmtDate(dueSoonest.dueDate) : '-'}</span><span className="t-sub">{dueSoonest ? `${dueSoonest.invoiceNumber}, ${dueSoonest.sellerName}` : t.invoices.kpiNone}</span></div>
      </div>

      {(b.sample.length > 0 || b.state === 'IN_REVIEW') && (
        <section className="blk blk-ai card" style={{ padding: 0 }}>
          <div className="blk-h" style={{ padding: '12px 16px 0' }}>
            <h3>{t.batch.sampleTitle}</h3>
            {b.selectedWithoutAi ? <span className="tagx tagx-warn">{t.batch.withoutAi}</span> : <HandTag hand="AI" />}
            <span className="grow" />
            {b.state === 'IN_REVIEW' && <button type="button" className="btn btn-sm" onClick={() => setDlg('expand')}>{t.batch.expand}</button>}
          </div>
          <p className="small" style={{ padding: '0 16px' }}>
            {t.batch.sampleExplain.replace('{n}', String(o.invoices.length + b.sample.filter((s) => s.mark === 'ERROR').length)).replace('{rate}', String(10)).replace('{size}', String(o.sampleSizeOnClose))}
          </p>
          {b.expansions.map((e) => (
            <p key={e.no} className="small muted" style={{ padding: '4px 16px' }}>{t.batch.expansionLine.replace('{time}', fmtDateTime(e.at)).replace('{who}', e.byName).replace('{reason}', e.reason).replace('{n}', String(e.added))}</p>
          ))}
          {b.sample.length === 0 ? <p className="small muted" style={{ padding: 16 }}>{t.batch.noSample}</p> : (
            <div>
              {b.sample.map((s) => (
                <SampleRow key={s.invoiceId} item={s} invoice={o.sampleInvoices.find((i) => i.id === s.invoiceId)} editable={b.state === 'IN_REVIEW'} pending={markAct.pending} onMark={(mark, reason) => markAct.run({ invoiceId: s.invoiceId, mark, reason })} />
              ))}
              <div className="tbl-foot"><span>{t.batch.stillToMark.replace('{n}', String(o.sampleRemaining))}</span><span className="muted xs">{t.batch.errorWarning}</span></div>
            </div>
          )}
          <ActionError error={markAct.error} raw={markAct.rawError} />
        </section>
      )}

      <section className="blk blk-rule card" style={{ padding: 0 }}>
        <div className="blk-h" style={{ padding: '12px 16px 0' }}><h3>{t.batch.admittedTitle}</h3><HandTag hand="RULE" /><span className="muted xs">{t.batch.groupedBy}</span></div>
        {o.invoices.length === 0 ? (
          <EmptyState icon="stack" title={t.batch.noInvoices} text={t.batch.noInvoicesText} />
        ) : (
          <div className="tbl-wrap">
            <table className="tbl compact">
              <caption className="sr">{t.batch.admittedTitle}</caption>
              <thead><tr><th>{t.invoices.colInvoice}</th><th>{t.invoices.colDue}</th><th>{t.invoices.colState}</th><th className="money">{t.invoices.colTotal}</th><th><span className="sr">{t.common.actions}</span></th></tr></thead>
              <tbody>
                {[...grouped.entries()].map(([name, list]) => (
                  <Fragment key={name}>
                    <tr className="group-row"><td colSpan={5}>{t.batch.supplierGroup.replace('{s}', name).replace('{n}', String(list.length))}</td></tr>
                    {list.map((i) => (
                      <tr key={i.id}>
                        <td><Link to={`/invoices/${i.id}`}>{i.invoiceNumber}</Link></td>
                        <td>{fmtDate(i.dueDate)}</td>
                        <td><StateBadge state={i.state} /></td>
                        <td className="money">{fmtMoney(i.totalAmount)}</td>
                        <td className="row-act"><Link className="btn btn-quiet btn-sm" to={`/invoices/${i.id}`}>{t.batch.withdrawLink}</Link></td>
                      </tr>
                    ))}
                    <tr className="subtotal"><td colSpan={3}>{t.batch.subtotal.replace('{s}', name)}</td><td className="money">{fmtMoney(list.reduce((s, i) => s + i.totalAmount, 0))}</td><td /></tr>
                  </Fragment>
                ))}
              </tbody>
              <tfoot><tr className="subtotal"><td colSpan={3}>{t.batch.totalRow.replace('{n}', String(o.invoices.length))}</td><td className="money">{fmtMoney(o.total)}</td><td /></tr></tfoot>
            </table>
          </div>
        )}
      </section>

      {requestsRows.length > 0 && (
        <section className="card">
          <div className="sec-h"><h3>{t.batch.requestsTitle}</h3><span className="muted xs">{t.batch.requestsSub.replace('{total}', fmtMoney(requestsRows.filter((r) => r.state !== 'CANCELLED').reduce((s, r) => s + r.total, 0)))}</span></div>
          <div className="tbl-wrap">
            <table className="tbl compact">
              <caption className="sr">{t.batch.requestsTitle}</caption>
              <thead><tr><th>{t.batch.colRequest}</th><th>{t.batch.colSupplier}</th><th className="money">{t.invoices.colTotal}</th><th>{t.batch.colLevel}</th><th>{t.invoices.colState}</th><th>{t.batch.colErp}</th></tr></thead>
              <tbody>
                {requestsRows.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td>{o.invoices.find((i) => r.invoiceIds.includes(i.id))?.sellerName ?? '-'}</td>
                    <td className="money">{fmtMoney(r.total)}</td>
                    <td>{t.approvalLevel[r.level]}</td>
                    <td><RequestBadge state={r.state} />{r.signatures.map((s) => <span className="sub" key={s.userId}>{t.batch.signedBy.replace('{who}', s.name).replace('{time}', fmtDateTime(s.at))}</span>)}{r.declineReason && r.state === 'CANCELLED' && <span className="sub">{r.declineReason}</span>}</td>
                    <td>
                      {t.sendStatus(r)}
                      {o.canResend.includes(r.id) && <> <button type="button" className="btn btn-sm" onClick={() => setDlg({ resend: r })}>{t.batch.resend}</button></>}
                      {r.paymentRef && <span className="sub mono">{r.paymentRef}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {dlg === 'close' && <CloseModal o={o} onClose={close} />}
      {dlg === 'release' && <ReleaseModal o={o} onClose={close} />}
      {dlg === 'expand' && <ExpandModal o={o} onClose={close} />}
      {dlg === 'reopen' && <ReopenModal o={o} onClose={close} />}
      {dlg && typeof dlg === 'object' && <ResendModal r={dlg.resend} onClose={close} />}
    </>
  );
}

function SampleRow({ item, invoice, editable, pending, onMark }: { item: SampleItem; invoice?: Invoice; editable: boolean; pending: boolean; onMark: (m: 'OK' | 'ERROR', reason?: string) => Promise<unknown> }) {
  const [errOpen, setErrOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const invalid = !reason.trim();
  return (
    <div className="sample-item">
      <div className="spread">
        <div>
          {invoice ? <Link to={`/invoices/${invoice.id}`}><b>{invoice.invoiceNumber}</b></Link> : <b>{item.invoiceId}</b>} <span className="muted small">{invoice?.sellerName}</span>
          <div className="small">{t.why(item.why.code, item.why.params)}{item.expansionNo > 0 && <span className="tagx">{t.batch.expansionTag.replace('{n}', String(item.expansionNo))}</span>}</div>
        </div>
        <div className="row">
          <b>{invoice ? fmtMoney(invoice.totalAmount) : ''}</b>
          {item.mark ? (
            <span className={`chip ${item.mark === 'OK' ? 'c-ok' : 'c-bad'}`}>{item.mark === 'OK' ? t.batch.markOk : t.batch.markError}</span>
          ) : editable ? (
            <span className="mark-btns" role="group" aria-label={t.batch.yourCheck}>
              <button type="button" className="btn btn-sm mark-ok" aria-pressed="false" disabled={pending} onClick={() => void onMark('OK')}>{t.batch.markOk}</button>
              <button type="button" className="btn btn-sm mark-err" aria-pressed={errOpen} disabled={pending} onClick={() => setErrOpen((o) => !o)}>{t.batch.markError}</button>
            </span>
          ) : (
            <span className="chip c-open">{t.batch.notMarked}</span>
          )}
        </div>
      </div>
      {item.mark && <p className="xs muted">{item.mark === 'OK' ? t.batch.markedBy.replace('{who}', item.markedBy ?? '').replace('{time}', fmtDateTime(item.markedAt)) : t.batch.errorBy.replace('{who}', item.markedBy ?? '').replace('{reason}', item.errorReason ?? '')}</p>}
      {errOpen && !item.mark && (
        <div className="field">
          <label htmlFor={`err-${item.invoiceId}`}>{t.batch.errorReason} {t.common.required}</label>
          <textarea id={`err-${item.invoiceId}`} className={`textarea${touched && invalid ? ' invalid' : ''}`} value={reason} onChange={(e) => setReason(e.target.value)} data-autofocus />
          {touched && invalid ? <span className="err-msg"><Icon name="alert" small />{t.batch.errorReasonRequired}</span> : <span className="hint">{t.batch.errorHint}</span>}
          <div className="row">
            <button type="button" className="btn btn-danger btn-sm" disabled={pending} onClick={() => { setTouched(true); if (!invalid) void onMark('ERROR', reason.trim()); }}>{t.batch.confirmError}</button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setErrOpen(false)}>{t.common.cancel}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Modals -----
function Footer({ pending, onClose, confirm, danger, disabled }: { pending: boolean; onClose: () => void; confirm: string; danger?: boolean; disabled?: boolean }) {
  return (
    <>
      <button type="button" className="btn" onClick={onClose} disabled={pending}>{t.common.cancel}</button>
      <button type="submit" className={`btn ${danger ? 'btn-danger-solid' : 'btn-primary'}`} disabled={pending || disabled}>{pending && <span className="spin" />}{confirm}</button>
    </>
  );
}

function CloseModal({ o, onClose }: { o: BatchOverview; onClose: () => void }) {
  const act = useAction(() => closeBatchForReview(o.batch.id, { version: o.batch.version }), { success: t.batch.toastClosed, onSuccess: onClose });
  const [y, m] = o.batch.period.split('-').map(Number) as [number, number];
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  return (
    <Modal title={t.batch.closeTitle} onClose={onClose} dismissable={!act.pending} onSubmit={() => void act.run(undefined)} footer={<Footer pending={act.pending} onClose={onClose} confirm={t.batch.close} />}>
      <dl className="dl">
        <dt>{t.batch.period}</dt><dd>{o.batch.label}</dd>
        <dt>{t.batch.kInvoices}</dt><dd>{t.batch.countTotal.replace('{n}', String(o.invoices.length)).replace('{total}', fmtMoney(o.total))}</dd>
        <dt>{t.batch.sampleSize}</dt><dd>{t.batch.sampleSizeValue.replace('{n}', String(o.sampleSizeOnClose))}</dd>
      </dl>
      <Notice kind="info">{t.batch.nextPeriodNote.replace('{p}', t.periodLabel(next))}</Notice>
      <ActionError error={act.error} raw={act.rawError} />
    </Modal>
  );
}

function ReleaseModal({ o, onClose }: { o: BatchOverview; onClose: () => void }) {
  const act = useAction(() => releaseBatch(o.batch.id, { version: o.batch.version }), { success: t.batch.toastReleased, onSuccess: onClose });
  return (
    <Modal title={t.batch.releaseTitle} onClose={onClose} dismissable={!act.pending} onSubmit={() => void act.run(undefined)} footer={<Footer pending={act.pending} onClose={onClose} confirm={t.batch.release} disabled={o.sampleRemaining > 0} />}>
      <dl className="dl">
        <dt>{t.batch.kInvoices}</dt><dd>{t.batch.countTotal.replace('{n}', String(o.invoices.length)).replace('{total}', fmtMoney(o.total))}</dd>
        <dt>{t.batch.sampleTitle}</dt><dd>{o.sampleRemaining === 0 ? <span className="t-ok"><Icon name="check" small /> {t.batch.allMarked}</span> : <span className="t-err">{t.batch.stillToMark.replace('{n}', String(o.sampleRemaining))}</span>}</dd>
        <dt>{t.batch.kRequests}</dt><dd>{t.batch.requestsOnRelease.replace('{n}', String(o.requestCountOnRelease))}</dd>
      </dl>
      <p className="small muted">{t.batch.afterRelease}</p>
      <ActionError error={act.error} raw={act.rawError} />
    </Modal>
  );
}

function ExpandModal({ o, onClose }: { o: BatchOverview; onClose: () => void }) {
  const original = Math.max(1, o.batch.sample.filter((s) => s.expansionNo === 0).length);
  const [all, setAll] = useState(false);
  const act = useAction((reason: string) => expandSample(o.batch.id, { reason, all, version: o.batch.version }), { success: t.batch.toastExpanded, onSuccess: onClose });
  const full = o.notInSample === 0;
  const willAdd = all ? o.notInSample : Math.min(original, o.notInSample);
  return (
    <ReasonModal
      title={t.batch.expandTitle}
      label={t.batch.expandReason}
      confirmLabel={t.batch.expand}
      pending={act.pending}
      error={act.error}
      rawError={act.rawError}
      onSubmit={(r) => void act.run(r)}
      onClose={onClose}
      intro={
        <>
          <dl className="dl">
            <dt>{t.batch.currentSample}</dt><dd>{t.batch.currentSampleValue.replace('{n}', String(o.batch.sample.length)).replace('{e}', String(o.batch.sample.filter((s) => s.mark === 'ERROR').length))}</dd>
            <dt>{t.batch.notInSample}</dt><dd>{t.batch.invoicesN.replace('{n}', String(o.notInSample))}</dd>
            <dt>{t.batch.willAdd}</dt><dd>{full ? '-' : t.batch.invoicesN.replace('{n}', String(willAdd))}</dd>
          </dl>
          {full ? <Notice kind="warn">{t.batch.sampleFull}</Notice> : (
            <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack-sm">
              <label className="check"><input type="radio" name="exp" checked={!all} onChange={() => setAll(false)} /> {t.batch.addOriginal.replace('{n}', String(Math.min(original, o.notInSample)))}</label>
              <label className="check"><input type="radio" name="exp" checked={all} onChange={() => setAll(true)} /> {t.batch.addAll.replace('{n}', String(o.notInSample))}</label>
            </fieldset>
          )}
          <p className="xs muted">{t.batch.expandNote}</p>
        </>
      }
    />
  );
}

function ReopenModal({ o, onClose }: { o: BatchOverview; onClose: () => void }) {
  const act = useAction((reason: string) => reopenBatch(o.batch.id, { reason, version: o.batch.version }), { success: t.batch.toastReopened, onSuccess: onClose });
  const signed = o.requests.find((r) => r.state !== 'CANCELLED' && r.signatures.length > 0);
  const live = o.requests.filter((r) => r.state !== 'CANCELLED').length;
  return (
    <ReasonModal
      title={t.batch.reopenTitle}
      label={t.batch.reopenReason}
      confirmLabel={t.batch.reopen}
      pending={act.pending}
      error={act.error}
      rawError={act.rawError}
      onSubmit={(r) => void act.run(r)}
      onClose={onClose}
      intro={
        <>
          {signed && <Notice kind="err" title={t.errors.REQUEST_ALREADY_SIGNED_TITLE}>{t.errors.REQUEST_ALREADY_SIGNED.replace('{request}', signed.id).replace('{by}', signed.signatures[0]!.name)}</Notice>}
          <dl className="dl">
            <dt>{t.batch.requestsCancelled}</dt><dd>{signed ? t.batch.notPossible : t.batch.noneSigned.replace('{n}', String(live))}</dd>
            <dt>{t.batch.kInvoices}</dt><dd>{t.batch.invoicesStay.replace('{n}', String(o.invoices.length))}</dd>
            <dt>{t.batch.kept}</dt><dd>{t.batch.keptValue}</dd>
          </dl>
        </>
      }
    />
  );
}

function ResendModal({ r, onClose }: { r: PaymentRequest; onClose: () => void }) {
  const act = useAction(() => resendToErp(r.id, { version: r.version }), { success: t.batch.toastResent, onSuccess: onClose });
  return (
    <Modal title={t.batch.resendTitle} onClose={onClose} dismissable={!act.pending} onSubmit={() => void act.run(undefined)} footer={<Footer pending={act.pending} onClose={onClose} confirm={t.batch.resend} />}>
      <dl className="dl">
        <dt>{t.batch.colRequest}</dt><dd><span className="mono">{r.id}</span>, {fmtMoney(r.total)}</dd>
        <dt>{t.batch.autoAttempts}</dt><dd>{t.batch.attemptsFailed.replace('{n}', String(r.attempts.filter((a) => !a.manual).length)).replace('{time}', fmtDateTime(r.attempts[r.attempts.length - 1]?.at))}</dd>
      </dl>
      <Notice kind="rule" icon="rule">{t.batch.resendNote.replace('{r}', r.id)}</Notice>
      <ActionError error={act.error} raw={act.rawError} />
    </Modal>
  );
}
