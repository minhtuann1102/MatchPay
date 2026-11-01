import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DecisionRow } from '../api/decisions';
import { decideIndividualApproval, decideTaxRiskHold } from '../api/decisions';
import { useDecisionQueue, useInvoice } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { EmptyState, Field, Notice, PageHeader, Skeleton } from '../components/Bits';
import { Chip } from '../components/Chips';
import { DataTable, type Col } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ActionError } from '../components/ReasonModal';
import { fmtDate, fmtDateTime, fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

type Kind = DecisionRow['kind'];

/** SCR-40 Decision Queue (Chief Accountant: tax-risk holds; Payment Approver: individual approvals). SCR-16 and SCR-18 are the modals. */
export function Decisions() {
  const { session } = useAuth();
  const isChief = session?.role === 'CHIEF_ACCOUNTANT';
  const q = useDecisionQueue();
  const [kind, setKind] = useState<'' | Kind>('');
  const [open, setOpen] = useState<DecisionRow | null>(null);
  const rows = (q.data ?? []).filter((r) => !kind || r.kind === kind);

  const age = (n: number) => (n <= 0 ? t.decisions.ageToday : interpolate(t.decisions.ageDays, { n }));
  const cols: Col<DecisionRow>[] = [
    {
      key: 'inv', label: t.decisions.colInvoice, header: t.decisions.colInvoice,
      render: (r) => <><b className="mono">{r.invoice.invoiceNumber}</b><span className="sub">{r.invoice.sellerName}</span>{r.groupSize > 1 && <span className="sub">{interpolate(t.decisions.groupOf, { n: r.groupSize })}</span>}</>,
    },
    {
      key: 'why', label: t.decisions.colReasons, header: t.decisions.colReasons,
      render: (r) => <span className="stack" style={{ gap: 2 }}>{r.invoice.exception?.reasons.map((x, i) => <span key={i}>{t.reason(x.code, x.params)}</span>)}</span>,
    },
    ...(isChief ? [] : [{ key: 'lvl', label: t.decisions.colLevel, header: t.decisions.colLevel, render: (r: DecisionRow) => (r.level ? <Chip kind="wait">{t.approvalLevel[r.level]}</Chip> : '') } as Col<DecisionRow>]),
    { key: 'amt', label: t.decisions.colAmount, header: t.decisions.colAmount, className: 'money', sort: (r) => r.amount, render: (r) => fmtMoney(r.amount) },
    { key: 'age', label: t.decisions.colAge, header: t.decisions.colAge, sort: (r) => r.ageDays, render: (r) => <>{age(r.ageDays)}<span className="sub">{interpolate(t.decisions.sent, { t: fmtDateTime(r.sentAt) })}</span></> },
    { key: 'act', label: '', header: <span className="sr">{t.decisions.colAction}</span>, className: 'row-act', render: (r) => <button type="button" className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); setOpen(r); }}>{t.decisions.review}</button> },
  ];

  const all = q.data ?? [];
  const oldest = [...all].sort((a, b) => b.ageDays - a.ageDays)[0];
  return (
    <>
      <PageHeader
        title={isChief ? t.decisions.titleChief : t.decisions.titleApprover}
        meta={isChief ? t.decisions.introChief : interpolate(t.decisions.introApprover, { level: session?.approvalLevel ? t.approvalLevel[session.approvalLevel] : '' })}
      />
      {all.length > 0 && (
        <div className="kpis">
          <div className="tile t-warn"><span className="t-lbl">{t.decisions.kWaiting}</span><span className="t-val">{all.length}</span><span className="t-sub">{[...new Set(all.map((r) => t.decisions.kinds[r.kind]))].join(', ')}</span></div>
          <div className="tile"><span className="t-lbl">{t.decisions.kAmount}</span><span className="t-val">{fmtMoney(all.reduce((s, r) => s + r.amount, 0))}</span></div>
          {oldest && <div className="tile"><span className="t-lbl">{t.decisions.kOldest}</span><span className="t-val">{age(oldest.ageDays)}</span><span className="t-sub">{interpolate(t.decisions.sent, { t: fmtDateTime(oldest.sentAt) })}</span></div>}
        </div>
      )}
      <section className="card">
        {all.length > 0 && (
          <div className="filters">
            <div className="field">
              <label htmlFor="dec-kind" className="sr">{t.decisions.kindFilter}</label>
              <select id="dec-kind" className="select" value={kind} onChange={(e) => setKind(e.target.value as '' | Kind)}>
                <option value="">{t.decisions.kindFilter}: {t.decisions.allKinds}</option>
                {(['TAX_RISK_HOLD', 'INDIVIDUAL_APPROVAL'] as Kind[]).filter((k) => all.some((r) => r.kind === k)).map((k) => <option key={k} value={k}>{t.decisions.kinds[k]}</option>)}
              </select>
            </div>
            <span className="xs muted">{t.decisions.onlyYours}</span>
          </div>
        )}
        <Async q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState icon="scale" title={t.decisions.emptyTitle} text={t.decisions.emptyText} />}>
          {() => (rows.length === 0 ? <EmptyState icon="search" title={t.decisions.noMatch} action={<button type="button" className="btn" onClick={() => setKind('')}>{t.common.clearFilters}</button>} /> : <DataTable columns={cols} rows={rows} rowKey={(r) => r.invoice.id} caption={t.screens['/decisions']!} onRowClick={setOpen} initialSort={{ key: 'age', dir: 'desc' }} />)}
        </Async>
      </section>
      {open && <DecideModal row={open} chief={isChief} onClose={() => setOpen(null)} />}
    </>
  );
}

function DecideModal({ row, chief, onClose }: { row: DecisionRow; chief: boolean; onClose: () => void }) {
  const detail = useInvoice(row.invoice.id);
  const inv = detail.data?.invoice ?? row.invoice;
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [which, setWhich] = useState<string>('');
  const reasonBad = touched && !reason.trim();
  const run = useAction(
    async (decision: string): Promise<void> => {
      if (chief) await decideTaxRiskHold(inv.id, { decision: decision as 'RELEASE' | 'REJECT', reason: reason.trim(), version: inv.version });
      else await decideIndividualApproval(inv.id, { decision: decision as 'APPROVE' | 'DECLINE', reason: reason.trim(), version: inv.version });
    },
    { success: () => (which === 'RELEASE' ? t.decisions.released : which === 'REJECT' ? t.decisions.rejected : which === 'APPROVE' ? t.decisions.approved : t.decisions.declined), onSuccess: onClose },
  );
  // Both decisions of the Chief Accountant need a reason; the approver needs one only to decline.
  const submit = (d: string) => {
    setWhich(d);
    setTouched(true);
    if (!reason.trim() && (chief || d === 'DECLINE')) return;
    void run.run(d);
  };
  const group = detail.data?.linkedGroup ?? [];
  const failed = inv.conditions.filter((c) => c.result === 'FAIL');
  return (
    <Modal
      title={chief ? t.decisions.taxTitle : t.decisions.approveTitle}
      onClose={onClose}
      dismissable={!run.pending}
      large
      footer={
        <>
          <Link className="btn btn-quiet" to={`/invoices/${inv.id}`} onClick={onClose}>{t.decisions.openInvoice}</Link>
          <span className="grow" />
          <button type="button" className="btn" onClick={onClose} disabled={run.pending}>{t.common.cancel}</button>
          <button type="button" className="btn btn-danger" onClick={() => submit(chief ? 'REJECT' : 'DECLINE')} disabled={run.pending}>{chief ? t.decisions.reject : t.decisions.decline}</button>
          <button type="button" className="btn btn-primary" onClick={() => submit(chief ? 'RELEASE' : 'APPROVE')} disabled={run.pending}>{run.pending && <span className="spin" />}{chief ? t.decisions.release : t.decisions.approve}</button>
        </>
      }
    >
      {detail.isPending ? <Skeleton rows={3} /> : (
        <>
          <section aria-label={t.decisions.evidence}>
            <dl className="dl">
              <dt>{t.decisions.colInvoice}</dt><dd><b className="mono">{inv.invoiceNumber}</b></dd>
              <dt>{t.decisions.supplier}</dt><dd>{inv.sellerName}</dd>
              <dt>{t.decisions.amount}</dt><dd>{fmtMoney(inv.totalAmount)}</dd>
              <dt>{t.decisions.due}</dt><dd>{fmtDate(inv.dueDate)}</dd>
              {detail.data?.requiredLevel && <><dt>{t.decisions.colLevel}</dt><dd>{t.approvalLevel[detail.data.requiredLevel]}</dd></>}
              <dt>{t.decisions.reasons}</dt><dd>{inv.exception?.reasons.map((x) => t.reason(x.code, x.params)).join('; ')}</dd>
            </dl>
          </section>
          {chief && detail.data?.tax && <Notice kind="rule" title={t.decisions.taxTitle}>{interpolate(t.decisions.taxText, { supplier: inv.sellerName, date: fmtDate(detail.data.tax.listedAt) })}</Notice>}
          {failed.length > 0 && (
            <ul className="reason-list" aria-label={t.decisions.checks}>
              {failed.map((c) => <li key={c.no}><b>{t.conditionTitle[c.no]}</b>: {t.condition(c.detail)}</li>)}
            </ul>
          )}
          {group.length > 1 && (
            <Notice kind="warn" title={t.decisions.combinedNote}>
              {group.map((g) => `${g.invoiceNumber} (${fmtMoney(g.totalAmount)})`).join(', ')}. {interpolate(t.decisions.combined, { total: fmtMoney(group.reduce((s, g) => s + g.totalAmount, 0)) })}
            </Notice>
          )}
        </>
      )}
      <Field label={chief ? `${t.decisions.reason} ${t.common.required}` : t.decisions.reason} htmlFor="dec-reason" hint={chief ? t.decisions.reasonHint : undefined} error={reasonBad && (chief || which === 'DECLINE') ? t.decisions.reasonRequired : null}>
        <textarea id="dec-reason" className={`textarea${reasonBad && (chief || which === 'DECLINE') ? ' invalid' : ''}`} value={reason} onChange={(e) => setReason(e.target.value)} data-autofocus />
      </Field>
      {(run.rawError as { code?: string } | null)?.code === 'PROCESSED_BY_YOU' ? <Notice kind="warn" icon="lock">{t.decisions.processedByYou}</Notice> : <ActionError error={run.error} raw={run.rawError} />}
    </Modal>
  );
}
