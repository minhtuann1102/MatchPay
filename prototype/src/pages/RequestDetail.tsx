import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { resendToErp } from '../api/batch';
import { declineRequest, removeRequestLine, type RequestDetail as Detail } from '../api/signing';
import { useRequest } from '../api/hooks';
import { Async, useForced } from '../components/Async';
import { Notice, InvNo, ReqNo, SealStamp } from '../components/Bits';
import { Chip, HandTag, RequestBadge, StateBadge } from '../components/Chips';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Icon } from '../components/Icon';
import { ReasonModal } from '../components/ReasonModal';
import { fmtDate, fmtDateTime, fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { signReasonText, SignModal } from './Signing';
import { t } from '../i18n/vi';

const STEPS = ['AWAITING_CHIEF_ACCOUNTANT', 'AWAITING_PAYMENT_APPROVER', 'SIGNED', 'SENT', 'PAID'] as const;

/** SCR-51 Payment Request Detail with SCR-53 (remove line), SCR-54 (decline), SCR-52 (sign) and SCR-57 (resend to ERP). */
export function RequestDetailPage() {
  const { id = '' } = useParams();
  const q = useRequest(id);
  return (
    <>
      <p className="crumbs"><Link to="/signing">{t.request.back}</Link></p>
      <Async q={q} skeletonRows={8}>{(d) => <Body d={d} />}</Async>
    </>
  );
}

type Dlg = null | 'sign' | 'decline' | 'resend' | { remove: string };

function Body({ d }: { d: Detail }) {
  const r = d.request;
  const forced = useForced();
  const [dlg, setDlg] = useState<Dlg>(null);
  const close = () => setDlg(null);
  const stepIdx = Math.max(0, STEPS.indexOf(r.state as (typeof STEPS)[number]));
  const awaiting = r.state.startsWith('AWAITING');
  const cancelled = r.state === 'CANCELLED';
  const blocked = awaiting && !r.sign.canSign;
  const summaryOk = d.summary && forced !== 'ai-error';

  return (
    <>
      <section className="ph obj-head" aria-label={t.request.titleFallback}>
        <div className="ph-top">
          <div className="ph-title">
            <h1><ReqNo value={r.id} /></h1>
            <RequestBadge state={r.state} />
          </div>
          <div className="ph-amount">{fmtMoney(r.total)}</div>
        </div>
        {(r.signatures.length > 0 && !cancelled) || awaiting || d.canResend || r.sign.canSign ? (
          <div className="ph-reasons spread">
            <div className="seals" aria-label={t.request.sigTitle}>
              {!cancelled && r.signatures.map((s) => (
                <div className="stamped" key={s.step}>
                  <SealStamp role={s.role} at={s.at} small />
                  <div><b>{s.name}</b><div className="small muted">{t.roles[s.role]}, {fmtDateTime(s.at)}</div></div>
                </div>
              ))}
            </div>
            <div className="ph-actions">
              {awaiting && <button type="button" className="btn" onClick={() => setDlg('decline')}>{t.request.decline}</button>}
              {d.canResend && <button type="button" className="btn" onClick={() => setDlg('resend')}>{t.request.resend}</button>}
              {r.sign.canSign && <button type="button" className="btn btn-primary" onClick={() => setDlg('sign')}><Icon name="pen" />{t.request.signCta}</button>}
            </div>
          </div>
        ) : null}
      </section>

      {cancelled && r.declineReason && <Notice kind="err" icon="alert">{interpolate(t.request.cancelledNote, { r: r.declineReason, who: r.declinedByName ?? '' })}</Notice>}
      {d.canResend && <Notice kind="warn" title={interpolate(t.batch.sendFailed, { r: r.id })} action={<button type="button" className="btn btn-sm" onClick={() => setDlg('resend')}>{t.request.resend}</button>}>{t.batch.sendFailedText}</Notice>}
      {d.delegatedUntil && awaiting && <Notice kind="info" icon="handover">{interpolate(t.request.delegatedAway, { date: fmtDate(d.delegatedUntil) })}</Notice>}
      {r.sign.onBehalfOf && r.sign.canSign && <Notice kind="info" icon="handover">{interpolate(t.request.onBehalfNote, { who: r.sign.onBehalfOf })}</Notice>}
      {blocked && (
        <Notice kind="warn" icon="lock" title={t.request.blockedHeading}>{signReasonText(r.sign.reason)}</Notice>
      )}

      {!cancelled && (
        <ol className="stepper" aria-label={t.request.steps[r.state as keyof typeof t.request.steps] ?? ''}>
          {STEPS.map((k, n) => (
            <li key={k} className={`${n < stepIdx ? 'done' : ''}${n === stepIdx ? ' cur' : ''}`} aria-current={n === stepIdx ? 'step' : undefined}>
              <span className="dot">{n < stepIdx ? <Icon name="check" /> : null}</span>
              <span className="lab"><b>{t.request.steps[k]}</b>{k === 'AWAITING_CHIEF_ACCOUNTANT' && r.signatures[0] && <small>{r.signatures[0].name}, {fmtDateTime(r.signatures[0].at)}</small>}{k === 'AWAITING_PAYMENT_APPROVER' && r.signatures[1] && <small>{r.signatures[1].name}, {fmtDateTime(r.signatures[1].at)}</small>}{k === 'SENT' && n === stepIdx && r.sendStatus === 'IN_ERP' && <small>{t.sendStatus(r)}</small>}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="split">
        <div className="stack-lg">
          <section className="card">
            <div className="card-h"><h2>{t.request.invoicesTitle}</h2><span className="xs muted">{t.request.openInvoice}</span></div>
            <div className="tbl-wrap">
              <table className="tbl compact">
                <caption className="sr">{t.request.invoicesTitle}</caption>
                <thead><tr><th>{t.request.colInvoice}</th><th>{t.request.colDue}</th><th className="money">{t.request.colTotal}</th><th>{t.request.colState}</th><th><span className="sr">{t.request.colAction}</span></th></tr></thead>
                <tbody>
                  {d.invoices.map((i) => (
                    <tr key={i.id}>
                      <td><Link to={`/invoices/${i.id}`}><InvNo value={i.invoiceNumber} /></Link><span className="sub">{i.sellerName}</span></td>
                      <td>{fmtDate(i.dueDate)}</td>
                      <td className="money">{fmtMoney(i.totalAmount)}</td>
                      <td><StateBadge state={i.state} /></td>
                      <td className="row-act">{awaiting && <button type="button" className="btn btn-sm btn-quiet" onClick={() => setDlg({ remove: i.id })}>{t.request.remove}</button>}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan={2}>{t.request.invoices}: {d.invoices.length}</td><td className="money">{fmtMoney(r.total)}</td><td colSpan={2} /></tr></tfoot>
              </table>
            </div>
          </section>

          <section className="card">
            <div className="card-h"><h2>{t.request.summaryTitle}</h2></div>
            <div className="card-b">
              {summaryOk ? (
                <div className="blk blk-ai"><div className="blk-h"><HandTag hand="AI" /></div><p className="small">{interpolate(t.request.summaryText, { n: d.invoices.length })}</p></div>
              ) : (
                <Notice kind="ai">{t.request.summaryUnavailable}</Notice>
              )}
              <div className="blk blk-rule" style={{ marginTop: 12 }}>
                <div className="blk-h"><HandTag hand="RULE" /><h3>{t.request.totalsTitle}</h3></div>
                <dl className="dl">
                  <dt>{t.request.byEntity}</dt><dd>{d.summary?.byEntity.map((x) => `${x.name}: ${fmtMoney(x.total)}`).join('; ') ?? fmtMoney(r.total)}</dd>
                  <dt>{t.request.bySupplier}</dt><dd>{d.summary?.bySupplier.map((x) => `${x.name}: ${fmtMoney(x.total)}`).join('; ') ?? `${r.supplierName}: ${fmtMoney(r.total)}`}</dd>
                  <dt>{t.request.largeInvoices}</dt><dd>{d.largeInvoices.length ? d.largeInvoices.join(', ') : t.request.none}</dd>
                  {d.summary && d.summary.sampleTotal > 0 && <><dt>{t.request.sample}</dt><dd>{interpolate(t.request.sampleValue, { ok: d.summary.sampleOk, total: d.summary.sampleTotal })}</dd></>}
                </dl>
              </div>
            </div>
          </section>
        </div>

        <aside className="stack-lg">
          <section className="card">
            <div className="card-h"><h2>{t.request.signHeading}</h2></div>
            <div className="card-b stack">
              <dl className="dl">
                <dt>{t.request.supplier}</dt><dd>{r.supplierName}</dd>
                <dt>{t.request.level}</dt><dd>{interpolate(r.level === 'CFO' ? t.request.levelRule : t.request.levelRuleLow, { level: t.approvalLevel[r.level] })}</dd>
                <dt>{t.request.flags}</dt>
                <dd>
                  {r.flags.bankChanged || r.flags.newSupplier ? <span className="stack" style={{ gap: 4 }}>{r.flags.bankChanged && <Chip kind="exc">{t.request.flagBank}</Chip>}{r.flags.newSupplier && <Chip kind="exc">{t.request.flagNew}</Chip>}</span> : interpolate(t.request.noFlags, { s: r.supplierName })}
                </dd>
              </dl>
              {r.sign.canSign ? (
                <button type="button" className="btn btn-primary" onClick={() => setDlg('sign')}><Icon name="pen" />{t.request.signCta}</button>
              ) : (
                <p className="small muted">{awaiting ? signReasonText(r.sign.reason) : cancelled ? '' : t.request.readOnlyNote}</p>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-h"><h2>{t.request.sigTitle}</h2></div>
            <div className="card-b stack">
              {([1, 2] as const).map((step) => {
                const s = r.signatures.find((x) => x.step === step);
                if (r.individuallyApproved && step === 2) return null;
                return s ? (
                  <div className="sig" key={step}>
                    <span className="seal">{s.name.slice(0, 1)}</span>
                    <div><b>{s.name}</b>{s.onBehalfOfName && <> <span className="obo">{interpolate(t.request.sigOnBehalf, { who: s.onBehalfOfName })}</span></>}<div className="meta">{t.roles[s.role]}, {fmtDateTime(s.at)}</div><div className="meta mono">{t.request.hash}: {s.contentHash}</div></div>
                  </div>
                ) : (
                  <div className="sig sig-pending" key={step}>
                    <span className="seal">{step}</span>
                    <div><b>{step === 1 ? t.roles.CHIEF_ACCOUNTANT : `${t.roles.PAYMENT_APPROVER}, ${t.approvalLevel[r.level]}`}</b><div className="meta">{t.request.sigWaiting}</div></div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card">
            <div className="card-h"><h2>{t.request.erpTitle}</h2></div>
            <div className="card-b stack">
              <p className="small">{r.state === 'CANCELLED' ? '' : t.sendStatus(r)}</p>
              {r.paymentRef && <p className="small">{t.request.paymentRef}: <span className="mono">{r.paymentRef}</span></p>}
              {d.attempts.length === 0 ? <p className="small muted">{t.request.noAttempts}</p> : (
                <ul className="reason-list" aria-label={t.request.erpAttempts}>
                  {d.attempts.map((a) => (
                    <li key={a.no}>{interpolate(t.request.attemptNo, { n: a.no })}: {t.request.attemptResult[a.result]}, {fmtDateTime(a.at)}{a.manual ? `. ${interpolate(t.request.attemptManual, { who: a.byName ?? '' })}` : ''}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </aside>
      </div>

      {dlg === 'sign' && <SignModal items={[r]} onClose={close} />}
      {dlg === 'decline' && <DeclineModal d={d} onClose={close} />}
      {dlg === 'resend' && <ResendConfirm d={d} onClose={close} />}
      {dlg && typeof dlg === 'object' && <RemoveModal d={d} invoiceId={dlg.remove} onClose={close} />}
    </>
  );
}

function RemoveModal({ d, invoiceId, onClose }: { d: Detail; invoiceId: string; onClose: () => void }) {
  const inv = d.invoices.find((i) => i.id === invoiceId)!;
  const act = useAction((reason: string) => removeRequestLine(d.request.id, { invoiceId, reason, version: d.request.version }), { success: t.request.removed, onSuccess: onClose });
  return (
    <ReasonModal title={interpolate(t.request.removeTitle, { n: inv.invoiceNumber })} intro={<p className="small">{t.request.removeText}</p>} label={t.request.removeReason} confirmLabel={t.request.remove} danger pending={act.pending} error={act.error} rawError={act.rawError} onSubmit={(x) => void act.run(x)} onClose={onClose} />
  );
}

function DeclineModal({ d, onClose }: { d: Detail; onClose: () => void }) {
  const act = useAction((reason: string) => declineRequest(d.request.id, { reason, version: d.request.version }), { success: t.request.declined, onSuccess: onClose });
  return (
    <ReasonModal title={interpolate(t.request.declineTitle, { r: d.request.id })} intro={<p className="small">{t.request.declineText}</p>} label={t.request.declineReason} confirmLabel={t.request.decline} danger pending={act.pending} error={act.error} rawError={act.rawError} onSubmit={(x) => void act.run(x)} onClose={onClose} />
  );
}

function ResendConfirm({ d, onClose }: { d: Detail; onClose: () => void }) {
  const act = useAction(() => resendToErp(d.request.id, { version: d.request.version }), { success: t.request.resent, onSuccess: onClose });
  return (
    <ConfirmDialog title={interpolate(t.request.resendTitle, { r: d.request.id })} confirmLabel={t.request.resend} pending={act.pending} error={act.error} onCancel={onClose} onConfirm={() => void act.run(undefined)}>
      <p className="small">{t.request.resendText}</p>
    </ConfirmDialog>
  );
}

