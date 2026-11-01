import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Condition, InvoiceDetail, InvoiceFlow } from '../api/types';
import {
  confirmLineMatch, correctFlow, rejectInvoice, reportWrongEntity, rerunChecks, sendForDecision, takeException, withdrawInvoiceFromBatch, type CancellationResult,
} from '../api/invoices';
import { useInvoice } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { DueSoon, Menu, Notice } from '../components/Bits';
import { ExceptionBadge, HandTag, RequestBadge, StateBadge } from '../components/Chips';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { ActionError, ReasonModal } from '../components/ReasonModal';
import { fmtDate, fmtDateTime, fmtMoney, fmtDecimal } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';
import { CancellationModal, CorrectionModal } from './InvoiceModals';

type Tab = 'overview' | 'lines' | 'checks' | 'documents' | 'anomalies' | 'history';
type Dlg = null | 'correction' | 'datafix' | 'reject' | 'cancel' | 'withdraw' | 'flow' | 'wrongEntity' | 'confirmLine' | 'sendDecision';

/** SCR-12 Invoice Detail and Evidence. */
export function InvoiceDetailPage() {
  const { id = '' } = useParams();
  const q = useInvoice(id);
  return <Async q={q}>{(d) => <Detail key={d.invoice.id} d={d} />}</Async>;
}

const STEPS = ['received', 'checked', 'outcome', 'request', 'sent', 'paid'] as const;

function stepIndex(d: InvoiceDetail): { cur: number; kind: 'normal' | 'exc' | 'bad'; label?: string } {
  const i = d.invoice;
  switch (i.state) {
    case 'RECEIVED': return { cur: 0, kind: 'normal' };
    case 'IN_CHECK': return { cur: 1, kind: 'normal' };
    case 'WAITING_FOR_GOODS': return { cur: 1, kind: 'exc', label: t.invoiceState.WAITING_FOR_GOODS };
    case 'EXCEPTION': return { cur: 2, kind: 'exc' };
    case 'IN_BATCH': return i.requestId ? { cur: 3, kind: 'normal' } : { cur: 2, kind: 'normal' };
    case 'SIGNED': return { cur: 3, kind: 'normal' };
    case 'SENT': return { cur: 4, kind: 'normal' };
    case 'PAID': return { cur: 5, kind: 'normal' };
    case 'REJECTED': return { cur: 1, kind: 'bad', label: t.invoiceState.REJECTED };
    default: return { cur: 1, kind: 'normal', label: t.invoiceState[i.state] };
  }
}

function Stepper({ d }: { d: InvoiceDetail }) {
  const s = stepIndex(d);
  const i = d.invoice;
  return (
    <ol className="stepper" aria-label={t.detail.progress}>
      {STEPS.map((k, n) => {
        const done = n < s.cur;
        const cur = n === s.cur;
        const label = cur && s.label ? s.label : k === 'outcome' ? (i.state === 'EXCEPTION' ? t.invoiceState.EXCEPTION : t.invoiceState.IN_BATCH) : t.detail.steps[k];
        const small = cur && k === 'received' ? fmtDateTime(i.receivedAt) : cur && i.state === 'EXCEPTION' && i.exception ? t.exceptionState[i.exception.state] : cur && i.state === 'IN_BATCH' && d.batch ? d.batch.label : '';
        return (
          <li key={k} className={`${done ? 'done' : ''}${cur ? ` cur${s.kind === 'exc' ? ' exc' : s.kind === 'bad' ? ' bad' : ''}` : ''}`} aria-current={cur ? 'step' : undefined}>
            <span className="dot">{done ? <Icon name="check" /> : cur && s.kind === 'exc' ? <Icon name="alert" /> : cur && s.kind === 'bad' ? <Icon name="x" /> : null}</span>
            <span className="lab"><b>{label}</b>{small && <small>{small}</small>}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Detail({ d }: { d: InvoiceDetail }) {
  const { session } = useAuth();
  const inv = d.invoice;
  const [tab, setTab] = useState<Tab>('overview');
  const [dlg, setDlg] = useState<Dlg>(null);
  const [notice, setNotice] = useState<ReactNode>(null);
  const a = d.actions;
  const close = () => setDlg(null);
  const failed = inv.conditions.filter((c) => c.result === 'FAIL').length;
  const notEval = inv.conditions.filter((c) => c.result === 'NOT_EVALUATED').length;

  const take = useAction(() => takeException(inv.id), { success: t.detail.toastTaken });
  const rerun = useAction(() => rerunChecks(inv.id), { success: t.detail.toastRerun });
  const confirmLine = useAction((lineNo: number) => confirmLineMatch(inv.id, { lineNo, version: inv.version }), { success: t.detail.toastLine, onSuccess: close });
  const flow = useAction((f: InvoiceFlow) => correctFlow(inv.id, { flow: f, version: inv.version }), { success: t.detail.toastFlow, onSuccess: close });
  const wrong = useAction((note: string) => reportWrongEntity(inv.id, { note, version: inv.version }), { success: t.detail.toastWrongEntity, onSuccess: close });
  const decide = useAction(() => sendForDecision(inv.id, { version: inv.version }), { success: t.detail.toastSent, onSuccess: close });
  const reject = useAction((reason: string) => rejectInvoice(inv.id, { reason, version: inv.version }), { success: t.detail.toastRejected, onSuccess: close });
  const withdraw = useAction((reason: string) => withdrawInvoiceFromBatch(inv.id, { reason, version: inv.version }), { success: t.detail.toastWithdrawn, onSuccess: close });

  const doubtLine = inv.lines.find((l) => (l.probability ?? 1) < 0.9 && !l.confirmedBy);
  const exc = inv.exception && inv.exception.state !== 'CLOSED' ? inv.exception : null;
  const waitingDecision = exc?.state === 'WAITING_FOR_DECISION';

  // One primary action per page: the next step for the AP Accountant. The same action is left out of the overflow menu.
  type Key = 'take' | 'rerun' | 'line' | 'foreign' | 'correction';
  let primary: ReactNode = null;
  let primaryKey: Key | null = null;
  let nextTitle = '';
  let nextText = '';
  if (a.takeException) {
    primaryKey = 'take';
    nextTitle = t.detail.nextTake;
    nextText = t.detail.nextTakeText;
    primary = <button type="button" className="btn btn-primary" onClick={() => void take.run(undefined)} disabled={take.pending}>{take.pending && <span className="spin" />}{t.detail.take}</button>;
  } else if (inv.aiAvailable === false && a.rerunChecks) {
    primaryKey = 'rerun';
    nextTitle = t.detail.nextRerun;
    nextText = t.detail.nextRerunText;
    primary = <button type="button" className="btn btn-primary" onClick={() => void rerun.run(undefined)} disabled={rerun.pending}>{rerun.pending && <span className="spin" />}{t.detail.rerun}</button>;
  } else if (a.confirmLine && doubtLine) {
    primaryKey = 'line';
    nextTitle = t.detail.nextLine.replace('{n}', String(doubtLine.lineNo));
    nextText = t.detail.nextLineText.replace('{item}', doubtLine.matchedItem ?? '');
    primary = <button type="button" className="btn btn-primary" onClick={() => setDlg('confirmLine')}>{t.detail.confirmLine}</button>;
  } else if (exc && !waitingDecision && inv.flow === 'UNSUPPORTED_FOREIGN') {
    primaryKey = 'foreign';
    nextTitle = t.detail.nextForeign;
    nextText = t.detail.nextForeignText;
    primary = <button type="button" className="btn btn-danger-solid" onClick={() => setDlg('reject')}>{t.detail.reject}</button>;
  } else if (a.requestCorrection) {
    primaryKey = 'correction';
    nextTitle = t.detail.nextCorrection;
    nextText = t.detail.nextCorrectionText;
    primary = <button type="button" className="btn btn-primary" onClick={() => setDlg('correction')}>{t.detail.requestCorrection}</button>;
  }

  const menu = ([
    { key: 'correction', show: a.requestCorrection, label: t.detail.requestCorrection, onClick: () => setDlg('correction') },
    { key: 'datafix', show: a.requestCorrection, label: t.detail.dataFix, onClick: () => setDlg('datafix') },
    { key: 'decision', show: a.sendForDecision, label: t.detail.sendForDecision, onClick: () => setDlg('sendDecision') },
    { key: 'line', show: a.confirmLine && !!doubtLine, label: t.detail.confirmLine, onClick: () => setDlg('confirmLine') },
    { key: 'flow', show: a.correctFlow, label: t.detail.correctFlow, onClick: () => setDlg('flow') },
    { key: 'wrong', show: !!exc && a.correctFlow, label: t.detail.reportWrongEntity, onClick: () => setDlg('wrongEntity') },
    { key: 'rerun', show: a.rerunChecks, label: t.detail.rerun, onClick: () => void rerun.run(undefined) },
    { key: 'cancel', show: a.recordCancellation, label: t.detail.recordCancellation, onClick: () => setDlg('cancel'), separatorBefore: true },
    { key: 'foreign', show: a.reject, label: t.detail.reject, onClick: () => setDlg('reject'), danger: true },
  ] as { key: string; show: boolean; label: string; onClick: () => void; separatorBefore?: boolean; danger?: boolean }[]).filter((m) => m.show && m.key !== primaryKey);

  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: 'overview', label: t.detail.tabs.overview },
    { id: 'lines', label: t.detail.tabs.lines, badge: String(inv.lines.length) },
    { id: 'checks', label: t.detail.tabs.checks, badge: failed ? t.detail.failedN.replace('{n}', String(failed)) : notEval ? t.detail.notEvalN.replace('{n}', String(notEval)) : inv.conditions.length ? t.detail.passedAll : undefined },
    { id: 'documents', label: t.detail.tabs.documents },
    { id: 'anomalies', label: t.detail.tabs.anomalies },
    { id: 'history', label: t.detail.tabs.history, badge: String(d.history.length) },
  ];

  const showPanel = !d.readOnly || a.decideTaxRisk || a.decideApproval;
  const actionErr = take.error ?? rerun.error;

  return (
    <div className="obj">
      <nav className="crumbs" aria-label={t.detail.breadcrumb}>
        <Link to="/invoices">{t.nav.invoices}</Link>
        <Icon name="chevronr" small />
        <span aria-current="page">{inv.invoiceNumber}</span>
      </nav>

      {notice}
      {actionErr && <Notice kind="err">{actionErr}</Notice>}

      <section className="ph obj-head" aria-label={t.detail.summary}>
        <div className="ph-top">
          <div className="ph-title">
            <h1>{inv.invoiceNumber}</h1>
            <StateBadge state={inv.state} />
            {exc && <ExceptionBadge state={exc.state} />}
            {exc?.route && <span className="muted small">{t.detail.waitingFor.replace('{who}', exc.route === 'CHIEF_ACCOUNTANT' ? t.roles.CHIEF_ACCOUNTANT : t.roles.PAYMENT_APPROVER)}</span>}
            {d.batch && inv.state === 'IN_BATCH' && <span className="tagx">{d.batch.label}</span>}
            <span className="src-tag">{t.source[inv.source]}</span>
            {d.readOnly && <span className="ro-tag"><Icon name="lock" small />{t.common.readOnly}</span>}
          </div>
          <div className="ph-amount">{fmtMoney(inv.totalAmount)}</div>
        </div>
        <dl className="facts">
          <div><dt>{t.detail.supplier}</dt><dd>{d.supplierName}{inv.sellerTaxCode ? ` ${inv.sellerTaxCode}` : <span className="muted"> {t.detail.noVnTax}</span>}</dd></div>
          <div><dt>{t.detail.entity}</dt><dd>{d.entityName} <span className="mono muted">{inv.buyerTaxCode}</span></dd></div>
          <div><dt>{t.detail.dueDate}</dt><dd>{fmtDate(inv.dueDate)}{d.dueSoon && <DueSoon />}</dd></div>
          <div><dt>{t.detail.flow}</dt><dd>{t.flow[inv.flow]} {inv.flowConfidence !== null && <HandTag hand="AI" />}</dd></div>
          {d.requiredLevel && <div><dt>{t.detail.approvalLevel}</dt><dd>{t.approvalLevel[d.requiredLevel]}</dd></div>}
          <div><dt>{t.detail.authority}</dt><dd>{inv.authorityStatus ? t.authority[inv.authorityStatus] : t.detail.notChecked}{inv.authorityCheckedAt && <span className="muted"> {t.detail.lookedUp.replace('{time}', fmtDateTime(inv.authorityCheckedAt))}</span>}</dd></div>
        </dl>
        {exc && (
          <div className="ph-reasons">
            <span className="lbl">{t.detail.reasons}</span>
            {exc.reasons.map((r, n) => <span key={n} className="reason">{t.reason(r.code, r.params)}</span>)}
          </div>
        )}
        {inv.rejection && (
          <div className="ph-reasons">
            <span className="lbl">{t.detail.rejectedBecause}</span>
            <span className="reason">{t.rejection[inv.rejection.code]}</span>
            {inv.rejection.note && <span className="small">{inv.rejection.note}</span>}
          </div>
        )}
      </section>

      <Stepper d={d} />

      <div className="obj-grid">
        <div className="d-ev" style={{ display: 'grid', gap: 12 }}>
          <div className="tabs" role="tablist" aria-label={t.detail.sections}>
            {tabs.map((x) => (
              <button key={x.id} id={`dtab-${x.id}`} className="tab" role="tab" type="button" aria-selected={tab === x.id} aria-controls={`dpanel-${x.id}`} tabIndex={tab === x.id ? 0 : -1} onClick={() => setTab(x.id)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                  const i = tabs.findIndex((y) => y.id === tab);
                  const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]!;
                  setTab(n.id);
                  requestAnimationFrame(() => document.getElementById(`dtab-${n.id}`)?.focus());
                }}>
                {x.label}
                {x.badge && <span className={`pill${x.id === 'checks' && failed ? ' p-err' : ''}`}>{x.badge}</span>}
              </button>
            ))}
          </div>
          <div id={`dpanel-${tab}`} role="tabpanel" aria-labelledby={`dtab-${tab}`} className="tab-body">
            {tab === 'overview' && <Overview d={d} go={setTab} />}
            {tab === 'lines' && <Lines d={d} />}
            {tab === 'checks' && <Checks d={d} />}
            {tab === 'documents' && <Documents d={d} />}
            {tab === 'anomalies' && <Anomalies d={d} />}
            {tab === 'history' && <History d={d} />}
          </div>
        </div>

        <aside className="obj-act" aria-label={t.detail.actionPanel}>
          {showPanel ? (
            <section className="actpanel">
              <div className="ap-h"><h2>{t.detail.resolve}</h2><span className="au au-person"><Icon name="seal" />{t.hands.PERSON}</span></div>
              {primary ? (
                <div className="nextstep">
                  <span className="eyebrow">{t.detail.nextStep}</span>
                  <h3>{nextTitle}</h3>
                  <p>{nextText}</p>
                  <div className="actions">{primary}</div>
                </div>
              ) : (
                <div style={{ padding: 16 }} className="small muted">{panelMessage(d, session?.role)}</div>
              )}
              {(menu.length > 0 || a.withdraw) && (
                <div style={{ padding: '0 16px 16px' }} className="actions">
                  {a.withdraw && <button type="button" className="btn" onClick={() => setDlg('withdraw')}>{t.detail.withdraw}</button>}
                  {menu.length > 0 && <Menu label={t.detail.otherActions} items={menu} />}
                </div>
              )}
              {(a.decideTaxRisk || a.decideApproval) && (
                <div style={{ padding: '0 16px 16px' }}>
                  <Link className="btn btn-primary" to="/decisions">{t.detail.openDecisions}</Link>
                </div>
              )}
            </section>
          ) : (
            <section className="actpanel">
              <div className="ap-h"><h2>{t.detail.noAction}</h2></div>
              <p className="small muted" style={{ padding: 16 }}>{panelMessage(d, session?.role)}</p>
            </section>
          )}
        </aside>
      </div>

      {(dlg === 'correction' || dlg === 'datafix') && (
        <CorrectionModal detail={d} initialKind={dlg === 'datafix' ? 'DATA_FIX_NOTICE' : 'CORRECTION_REQUEST'} onClose={close} />
      )}
      {dlg === 'cancel' && <CancellationModal detail={d} onClose={close} onDone={(r) => { close(); setNotice(<CancelNotice r={r} />); }} />}
      {dlg === 'reject' && (
        <ReasonModal
          title={t.reject.title}
          intro={<p className="small">{t.reject.intro.replace('{n}', inv.invoiceNumber)}{inv.flow === 'UNSUPPORTED_FOREIGN' ? ` ${t.reject.foreign}` : ''}</p>}
          label={t.reject.reason}
          placeholder={t.reject.placeholder}
          confirmLabel={t.reject.confirm}
          danger
          pending={reject.pending}
          error={reject.error}
          rawError={reject.rawError}
          onSubmit={(r) => void reject.run(r)}
          onClose={close}
        />
      )}
      {dlg === 'withdraw' && (
        <ReasonModal
          title={t.detail.withdrawTitle}
          intro={<p className="small">{t.detail.withdrawIntro}</p>}
          label={t.detail.withdrawReason}
          confirmLabel={t.detail.withdraw}
          pending={withdraw.pending}
          error={withdraw.error}
          rawError={withdraw.rawError}
          onSubmit={(r) => void withdraw.run(r)}
          onClose={close}
        />
      )}
      {dlg === 'wrongEntity' && (
        <ReasonModal
          title={t.detail.reportWrongEntity}
          intro={<WrongEntityTrace d={d} />}
          label={t.detail.wrongEntityNote}
          confirmLabel={t.detail.reportWrongEntity}
          pending={wrong.pending}
          error={wrong.error}
          rawError={wrong.rawError}
          onSubmit={(r) => void wrong.run(r)}
          onClose={close}
        />
      )}
      {dlg === 'confirmLine' && doubtLine && (
        <ConfirmDialog title={t.detail.confirmLineTitle.replace('{n}', String(doubtLine.lineNo))} confirmLabel={t.detail.confirmLineSave} pending={confirmLine.pending} error={confirmLine.error} onCancel={close} onConfirm={() => void confirmLine.run(doubtLine.lineNo)}>
          <p>{t.detail.confirmLineText.replace('{text}', doubtLine.text).replace('{item}', doubtLine.matchedItem ?? '')}</p>
          <p className="small muted">{t.detail.confirmLineHint}</p>
        </ConfirmDialog>
      )}
      {dlg === 'sendDecision' && (
        <ConfirmDialog title={t.detail.sendTitle} confirmLabel={t.detail.sendForDecision} pending={decide.pending} error={decide.error} onCancel={close} onConfirm={() => void decide.run(undefined)}>
          <p>{exc?.reasons.some((r) => r.code === 'TAX_RISK_HOLD') ? t.detail.sendToChief : t.detail.sendToApprover}</p>
          {inv.exception?.linkedGroup && <p className="small muted">{t.detail.sendGroup.replace('{n}', String(d.linkedGroup.length))}</p>}
        </ConfirmDialog>
      )}
      {dlg === 'flow' && <FlowModal current={inv.flow} pending={flow.pending} error={flow.error} onSave={(f) => void flow.run(f)} onClose={close} />}
    </div>
  );
}

function panelMessage(d: InvoiceDetail, role?: string): string {
  const inv = d.invoice;
  if (d.readOnly) return t.detail.readOnlyPanel;
  if (inv.state === 'IN_BATCH') return t.detail.admittedPanel;
  if (inv.exception?.state === 'WAITING_FOR_DECISION') return t.detail.waitingPanel;
  void role;
  return t.detail.nothingToDo;
}

function CancelNotice({ r }: { r: CancellationResult }) {
  const key = r.outcome === 'WITHDRAWN' ? 'withdrawn' : r.outcome === 'REQUEST_CANCELLED' ? 'requestCancelled' : 'rejected';
  return (
    <Notice kind="ok" title={t.cancel.done}>
      {t.cancel[key].replace('{n}', r.invoice.invoiceNumber).replace('{r}', r.requestId ?? '').replace('{total}', r.newTotal !== null ? fmtMoney(r.newTotal) : '').replace('{level}', r.newLevel ? t.approvalLevel[r.newLevel as 'CFO'] : '')}
    </Notice>
  );
}

function WrongEntityTrace({ d }: { d: InvoiceDetail }) {
  const i = d.invoice;
  const rows: [string, string, boolean][] = [
    [t.detail.buyerTaxCode, i.buyerTaxCode, true],
    [t.detail.buyerName, i.buyerName, i.buyerName === d.entityName],
    [t.detail.orderRef, i.poRef ?? '-', true],
  ];
  return (
    <div className="stack-sm">
      <p className="small">{t.detail.wrongEntityIntro}</p>
      <table className="tbl compact">
        <tbody>
          {rows.map(([k, v, same]) => (
            <tr key={k}><td>{k}</td><td>{v}</td><td>{same ? <span className="tagx tagx-ok">{t.detail.same}</span> : <span className="tagx tagx-warn">{t.detail.differs}</span>}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="small muted">{t.detail.wrongEntityHint.replace('{entity}', d.entityName)}</p>
    </div>
  );
}

function FlowModal({ current, pending, error, onSave, onClose }: { current: InvoiceFlow; pending: boolean; error: string | null; onSave: (f: InvoiceFlow) => void; onClose: () => void }) {
  const [f, setF] = useState<InvoiceFlow>(current);
  const options: InvoiceFlow[] = ['GOODS_WITH_ORDER', 'SERVICES_WITH_ORDER', 'RECURRING', 'EMPLOYEE_EXPENSE', 'OTHER'];
  return (
    <Modal
      title={t.detail.correctFlow}
      onClose={onClose}
      dismissable={!pending}
      onSubmit={() => onSave(f)}
      footer={<><button type="button" className="btn" onClick={onClose} disabled={pending}>{t.common.cancel}</button><button type="submit" className="btn btn-primary" disabled={pending}>{pending && <span className="spin" />}{t.detail.saveFlow}</button></>}
    >
      <p className="small">{t.detail.flowHint}</p>
      <div className="field">
        <label htmlFor="flow-sel">{t.detail.flow}</label>
        <select id="flow-sel" className="select" value={f} onChange={(e) => setF(e.target.value as InvoiceFlow)} data-autofocus>
          {options.map((o) => <option key={o} value={o}>{t.flow[o]}</option>)}
        </select>
      </div>
      <ActionError error={error} />
    </Modal>
  );
}

// ---------- Tabs ----------
function condTitle(c: Condition): string {
  return t.conditionTitle[c.no];
}

function Overview({ d, go }: { d: InvoiceDetail; go: (t: Tab) => void }) {
  const inv = d.invoice;
  const failing = inv.conditions.filter((c) => c.result === 'FAIL');
  const total = inv.conditions.length;
  const allPass = total > 0 && failing.length === 0 && inv.conditions.every((c) => c.result === 'PASS');
  const notEval = inv.conditions.filter((c) => c.result === 'NOT_EVALUATED');
  const title = allPass ? t.detail.allSixHold : failing.length ? t.detail.failedOfSix.replace('{n}', String(failing.length)) : notEval.length ? t.detail.notEvaluated.replace('{n}', String(notEval.length)) : '';
  return (
    <>
      {total > 0 && (
        <section className={`attn-card${allPass ? ' ok' : ''}`} aria-label={t.detail.ruleResult}>
          <div className="attn-h"><h2><Icon name={allPass ? 'check' : 'alert'} />{title}</h2><HandTag hand="RULE" /></div>
          {failing.map((c) => (
            <div className="attn-row" key={c.no}>
              <span className="no">{c.no}</span>
              <div><b>{condTitle(c)}</b><div className="why">{t.condition(c.detail)}</div></div>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => go('checks')}>{t.detail.viewInChecks}</button>
            </div>
          ))}
          {allPass && inv.note && <div className="attn-note">{t.note(inv.note)}</div>}
          {!allPass && failing.length > 0 && <div className="attn-note">{t.detail.passedList.replace('{list}', inv.conditions.filter((c) => c.result === 'PASS').map((c) => c.no).join(', ')).replace('{x}', '')}</div>}
          {notEval.length > 0 && failing.length === 0 && <div className="attn-note">{t.condition(notEval[0]!.detail)}</div>}
        </section>
      )}

      <section className="card">
        <div className="sec-h"><h3>{t.detail.keyFacts}</h3><button type="button" className="btn btn-quiet btn-sm" onClick={() => go('documents')}>{t.detail.openDocuments}</button></div>
        <dl className="kf">
          <div><dt>{t.detail.invoiceDate}</dt><dd>{fmtDate(inv.invoiceDate)}</dd></div>
          <div><dt>{t.detail.order}</dt><dd className={inv.poRef ? 'mono' : undefined}>{inv.poRef ?? t.detail.none}</dd></div>
          <div><dt>{t.detail.receipt}</dt><dd className={inv.receiptRef ? 'mono' : undefined}>{inv.receiptRef ?? (inv.flow === 'SERVICES_WITH_ORDER' ? t.detail.noneService : t.detail.none)}</dd></div>
          <div><dt>{t.detail.trust}</dt><dd>{t.trust[inv.trust]}</dd></div>
          <div><dt>{t.detail.signatureCheck}</dt><dd><HandTag hand="RULE" /> {inv.authorityStatus ? t.detail.sigValid : t.detail.sigPending}</dd></div>
          <div><dt>{t.detail.lastSync}</dt><dd>{d.erpItems[0] ? fmtDateTime(d.erpItems[0].syncedAt) : t.detail.none}</dd></div>
        </dl>
      </section>

      {inv.flowConfidence !== null && inv.flowReason && (
        <section className="blk blk-ai card">
          <div className="blk-h"><HandTag hand="AI" /><h3>{t.detail.flowIdent}</h3></div>
          <p className="small">{t.flow[inv.flow]}, {t.detail.confidence} <span className="mono">{fmtDecimal(inv.flowConfidence)}</span>. {t.flowReason(inv.flowReason)}</p>
          <p className="xs muted">{t.detail.versions}: model 2026.10 - prompt v14</p>
        </section>
      )}

      {inv.serviceAcceptance && (
        <section className="card">
          <div className="sec-h"><h3>{t.detail.acceptance}</h3></div>
          <dl className="kf">
            <div><dt>{t.detail.source}</dt><dd>{t.roles.REQUESTING_DEPARTMENT}</dd></div>
            <div><dt>{t.detail.confirmedBy}</dt><dd>{inv.serviceAcceptance.by}, {fmtDateTime(inv.serviceAcceptance.at)}</dd></div>
            <div><dt>{t.detail.note}</dt><dd>{inv.serviceAcceptance.note || t.detail.none}</dd></div>
          </dl>
        </section>
      )}

      {d.tax && (
        <section className="card blk blk-rule">
          <div className="blk-h"><HandTag hand="RULE" /><h3>{t.detail.taxRisk}</h3></div>
          <p className="small">{t.detail.taxRiskText.replace('{supplier}', d.supplierName).replace('{date}', fmtDate(d.tax.listedAt))}</p>
        </section>
      )}

      {d.linkedGroup.length > 1 && (
        <section className="card">
          <div className="sec-h"><h3>{t.detail.linked}</h3><HandTag hand="AI" /></div>
          <div className="tbl-wrap">
            <table className="tbl compact">
              <thead><tr><th>{t.invoices.colInvoice}</th><th>{t.detail.order}</th><th className="money">{t.invoices.colTotal}</th></tr></thead>
              <tbody>
                {d.linkedGroup.map((l) => (
                  <tr key={l.id}><td>{l.id === inv.id ? <>{l.invoiceNumber} <span className="muted">{t.detail.thisPage}</span></> : <Link to={`/invoices/${l.id}`}>{l.invoiceNumber}</Link>}</td><td className="mono">{l.poRef}</td><td className="money">{fmtMoney(l.totalAmount)}</td></tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={2}>{t.detail.combined}</td><td className="money">{fmtMoney(d.linkedGroup.reduce((s, l) => s + l.totalAmount, 0))}</td></tr></tfoot>
            </table>
          </div>
        </section>
      )}

      {d.request ? (
        <section className="card">
          <div className="sec-h"><h3>{t.detail.paymentRequest}</h3><RequestBadge state={d.request.state} /></div>
          <div style={{ padding: '8px 16px 16px', display: 'grid', gap: 8 }}>
            <p className="small"><span className="mono">{d.request.id}</span>, {fmtMoney(d.request.total)}, {t.approvalLevel[d.request.level]}</p>
            {d.request.signatures.length === 0 && <p className="small muted">{t.detail.noSignatures}</p>}
            {d.request.signatures.map((s) => (
              <div className="sig" key={s.userId + s.step}>
                <span className="seal">{s.name.slice(0, 1)}</span>
                <div><b>{s.onBehalfOfName ? t.detail.signedOnBehalf.replace('{who}', s.name).replace('{for}', s.onBehalfOfName) : t.detail.signedBy.replace('{who}', s.name)}</b><div className="meta">{fmtDateTime(s.at)} - <span className="mono">{s.contentHash}</span></div></div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="small muted">{t.detail.noRequest}</p>
      )}
      {inv.paymentRef && <p className="small">{t.detail.paymentRef}: <span className="mono">{inv.paymentRef}</span></p>}
      {d.cancellation && (
        <section className="card"><div className="sec-h"><h3>{t.detail.cancellationNotice}</h3></div><dl className="kf"><div><dt>{t.cancel.reference}</dt><dd>{d.cancellation.reference}</dd></div><div><dt>{t.cancel.date}</dt><dd>{fmtDate(d.cancellation.noticeDate)}</dd></div><div><dt>{t.cancel.file}</dt><dd>{d.cancellation.fileName ?? t.detail.none}</dd></div></dl></section>
      )}
    </>
  );
}

function Lines({ d }: { d: InvoiceDetail }) {
  const inv = d.invoice;
  if (!inv.lines.length) return <div className="card"><p className="small muted" style={{ padding: 16 }}>{inv.aiAvailable ? t.detail.noLines : t.detail.aiMissing}</p></div>;
  return (
    <section className="blk blk-ai card" style={{ padding: 0 }}>
      <div className="blk-h" style={{ padding: '12px 16px 0' }}><HandTag hand="AI" /><h3>{t.detail.lineMatches}</h3></div>
      <div className="tbl-wrap">
        <table className="tbl compact lines">
          <thead><tr><th>#</th><th>{t.detail.lineText}</th><th>{t.detail.lineMatched}</th><th>{t.detail.lineMethod}</th><th>{t.detail.lineProb}</th><th className="money">{t.detail.lineTotal}</th></tr></thead>
          <tbody>
            {inv.lines.map((l) => (
              <tr key={l.lineNo}>
                <td>{l.lineNo}</td><td>{l.text}</td>
                <td>{l.matchedItem ?? t.detail.none}{l.confirmedBy && <span className="sub">{t.detail.confirmedByName.replace('{who}', l.confirmedBy)}</span>}</td>
                <td>{l.method ? t.method[l.method] : ''}</td>
                <td>{l.probability !== null && <span className={`line-prob${l.probability < 0.9 ? ' low' : ''}`}>{fmtDecimal(l.probability)} {l.probability < 0.9 ? t.detail.doubtful : t.detail.matched}</span>}{l.doubtNote && <span className="sub">{t.doubt[l.doubtNote as 'UNIT_UNKNOWN'] ?? l.doubtNote}</span>}</td>
                <td className="money">{fmtMoney(l.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan={5}>{t.detail.vat}: {fmtMoney(inv.vatAmount)}</td><td className="money">{t.detail.totalWithVat} {fmtMoney(inv.totalAmount)}</td></tr></tfoot>
        </table>
      </div>
    </section>
  );
}

function Checks({ d }: { d: InvoiceDetail }) {
  const cs = d.invoice.conditions;
  if (!cs.length) return <div className="card"><p className="small muted" style={{ padding: 16 }}>{t.detail.noChecks}</p></div>;
  const shown = cs.filter((c) => c.result !== 'PASS');
  const passed = cs.filter((c) => c.result === 'PASS');
  const row = (c: Condition) => (
    <div className={`chk${c.result === 'FAIL' ? ' fail' : ''}`} key={c.no}>
      <span className="no">{c.no}</span>
      <span>{condTitle(c)}</span>
      <span className="val">{t.condition(c.detail)}</span>
      <span className={`res res-${c.result === 'PASS' ? 'pass' : c.result === 'FAIL' ? 'fail' : 'skip'}`}>{t.conditionResult[c.result]}</span>
    </div>
  );
  return (
    <section className="blk blk-rule card" style={{ padding: 0 }}>
      <div className="blk-h" style={{ padding: '12px 16px 0' }}><HandTag hand="RULE" /><h3>{t.detail.sixConditions}</h3></div>
      {shown.map(row)}
      {passed.length > 0 && (
        <details className="passed" open={shown.length === 0}>
          <summary>{t.detail.passedSummary.replace('{n}', String(passed.length)).replace('{list}', passed.map((c) => c.no).join(', '))}</summary>
          {passed.map(row)}
        </details>
      )}
    </section>
  );
}

function Documents({ d }: { d: InvoiceDetail }) {
  const i = d.invoice;
  return (
    <>
      <section className="card">
        <div className="sec-h"><h3>{t.detail.sourceDocument}</h3><span className="au au-data">{t.detail.documentData}</span></div>
        <dl className="dl" style={{ padding: 16 }}>
          <dt>{t.detail.seller}</dt><dd>{i.sellerName}{i.sellerTaxCode ? `, ${t.detail.taxCode} ${i.sellerTaxCode}` : ''}</dd>
          <dt>{t.detail.seriesNumber}</dt><dd className="mono">{i.series} / {i.number}</dd>
          <dt>{t.detail.buyerTaxCode}</dt><dd>{i.buyerTaxCode}</dd>
          <dt>{t.detail.buyerName}</dt><dd>{i.buyerName}</dd>
          <dt>{t.detail.orderRef}</dt><dd className={i.poRef ? "mono" : undefined}>{i.poRef ?? t.detail.none}</dd>
          <dt>{t.detail.storedHash}</dt><dd className="mono">{i.hash}</dd>
        </dl>
        <p className="evidence-note" style={{ padding: '0 16px 12px' }}>{t.detail.injectionNote}</p>
      </section>
      <section className="card">
        <div className="sec-h"><h3>{t.detail.erpData}</h3><span className="au au-data">{t.detail.erpDataTag}</span></div>
        {d.erpItems.length === 0 ? <p className="small muted" style={{ padding: 16 }}>{t.detail.noErp}</p> : (
          <div className="tbl-wrap">
            <table className="tbl compact">
              <thead><tr><th>{t.detail.erpDoc}</th><th>{t.detail.erpItem}</th><th>{t.detail.erpQty}</th><th>{t.detail.erpPrice}</th><th>{t.detail.lastSync}</th></tr></thead>
              <tbody>{d.erpItems.map((e, n) => <tr key={n}><td className="mono">{e.doc}</td><td>{e.item}</td><td>{e.quantity}</td><td>{e.price ? fmtMoney(Number(e.price)) : ''}</td><td>{fmtDateTime(e.syncedAt)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Anomalies({ d }: { d: InvoiceDetail }) {
  const list = d.invoice.anomalies;
  return (
    <section className="blk blk-ai card">
      <div className="blk-h"><HandTag hand="AI" /><h3>{t.detail.anomalyNumbers}</h3></div>
      {list.length === 0 ? <p className="small muted">{t.detail.noAnomalies}</p> : (
        <dl className="dl">
          {list.map((a, n) => (<div key={n} style={{ display: 'contents' }}><dt>{t.anomalyTitle(a.code)}</dt><dd>{t.anomaly(a)} {a.flagged && <span className="tagx tagx-err">{t.detail.flagged}</span>}</dd></div>))}
        </dl>
      )}
    </section>
  );
}

function History({ d }: { d: InvoiceDetail }) {
  return (
    <section className="card">
      <div className="sec-h"><h3>{t.detail.history}</h3><span className="muted xs">{t.detail.historyHint}</span></div>
      {d.history.length === 0 ? <p className="small muted" style={{ padding: 16 }}>{t.detail.noHistory}</p> : (
        <div className="timeline">
          {d.history.map((h) => (
            <div className="tl tl-c" key={h.id}>
              <time dateTime={h.at}>{fmtDateTime(h.at)}</time>
              <span>{h.hand === 'AI' || h.hand === 'RULE' || h.hand === 'PERSON' ? <HandTag hand={h.hand} /> : <span className="au au-data">{t.hands[h.hand]}</span>}{h.hand === 'PERSON' && h.actorName ? <b style={{ marginLeft: 6 }}>{h.actorName}</b> : null}</span>
              <span>{t.event(h.event.code, h.event.params)}{h.note ? <> <q className="muted">{h.note}</q></> : null}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
