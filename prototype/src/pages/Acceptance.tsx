import { useState } from 'react';
import type { AcceptanceRow } from '../api/acceptance';
import { decideServiceAcceptance } from '../api/acceptance';
import { useAcceptanceQueue, useSuppliers } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { DueSoon, EmptyState, Field, Notice, PageHeader, InvNo } from '../components/Bits';
import { DataTable, type Col } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ActionError } from '../components/ReasonModal';
import { fmtDate, fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

/** SCR-22 Acceptance Queue, with SCR-23 (confirm or reject) as a modal. Goods invoices are never listed. */
export function Acceptance() {
  const { session } = useAuth();
  const [supplierId, setSupplierId] = useState('');
  const [dueSoon, setDueSoon] = useState(false);
  const [open, setOpen] = useState<AcceptanceRow | null>(null);
  const suppliers = useSuppliers();
  const q = useAcceptanceQueue({ supplierId: supplierId || undefined, dueSoon: dueSoon || undefined });
  const all = useAcceptanceQueue({});
  const filtered = !!supplierId || dueSoon;
  const items = all.data?.items ?? [];
  const oldest = [...items].sort((a, b) => a.invoice.receivedAt.localeCompare(b.invoice.receivedAt))[0];
  const dueCount = items.filter((i) => i.dueSoon).length;

  const cols: Col<AcceptanceRow>[] = [
    { key: 'inv', label: t.acceptance.colInvoice, header: t.acceptance.colInvoice, render: (r) => <><InvNo value={r.invoice.invoiceNumber} /><span className="sub">{r.invoice.sellerName}</span></> },
    { key: 'po', label: t.acceptance.colOrder, header: t.acceptance.colOrder, render: (r) => <span className="mono">{r.poRef}</span> },
    { key: 'lines', label: t.acceptance.colLines, header: t.acceptance.colLines, render: (r) => r.serviceLines },
    { key: 'amt', label: t.acceptance.colAmount, header: t.acceptance.colAmount, className: 'money', sort: (r) => r.invoice.totalAmount, render: (r) => fmtMoney(r.invoice.totalAmount) },
    { key: 'due', label: t.acceptance.colDue, header: t.acceptance.colDue, sort: (r) => r.invoice.dueDate, render: (r) => <>{fmtDate(r.invoice.dueDate)}{r.dueSoon && <> <DueSoon /></>}</> },
    { key: 'act', label: '', header: <span className="sr">{t.common.actions}</span>, className: 'row-act', render: (r) => <button type="button" className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setOpen(r); }}>{t.acceptance.review}</button> },
  ];

  return (
    <>
      <PageHeader title={t.acceptance.title} meta={interpolate(t.acceptance.intro, { entity: session?.entityName ?? '' })} />
      {all.data && items.length > 0 && (
        <div className="kpis">
          <div className="tile"><span className="t-lbl">{t.acceptance.kWaiting}</span><span className="t-val">{items.length}</span><span className="t-sub">{fmtMoney(items.reduce((s, i) => s + i.invoice.totalAmount, 0))}</span></div>
          <div className="tile"><span className="t-lbl">{t.acceptance.kDue}</span><span className="t-val">{dueCount}</span><span className="t-sub">{items.filter((i) => i.dueSoon).map((i) => i.invoice.invoiceNumber).join(', ') || t.acceptance.kDueNone}</span></div>
          {oldest && <div className="tile"><span className="t-lbl">{t.acceptance.kOldest}</span><span className="t-val">{fmtDate(oldest.invoice.receivedAt)}</span><span className="t-sub">{oldest.invoice.invoiceNumber}</span></div>}
        </div>
      )}
      <section className="card">
        <div className="filters" role="group" aria-label={t.acceptance.savedViews}>
          <div className="field">
            <label htmlFor="acc-sup" className="sr">{t.acceptance.supplier}</label>
            <select id="acc-sup" className="select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">{t.acceptance.allSuppliers}</option>
              {suppliers.data?.filter((s) => items.some((i) => i.invoice.supplierId === s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={dueSoon} onChange={(e) => setDueSoon(e.target.checked)} />{t.acceptance.dueOnly}</label>
          {filtered && <button type="button" className="btn btn-quiet btn-sm" onClick={() => { setSupplierId(''); setDueSoon(false); }}>{t.common.clearFilters}</button>}
        </div>
        <Async q={q} isEmpty={(d) => d.items.length === 0} empty={filtered && q.data?.totalAll ? <EmptyState icon="search" title={t.acceptance.noMatch} action={<button type="button" className="btn" onClick={() => { setSupplierId(''); setDueSoon(false); }}>{t.common.clearFilters}</button>} /> : <EmptyState icon="checkcircle" title={t.acceptance.emptyTitle} text={t.acceptance.emptyText} />}>
          {(d) => <DataTable columns={cols} rows={d.items} rowKey={(r) => r.id} caption={t.acceptance.title} onRowClick={setOpen} footer={<div className="tbl-foot"><span>{interpolate(t.acceptance.counted, { n: d.items.length })}</span></div>} />}
        </Async>
      </section>
      {open && <DecideModal item={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function DecideModal({ item, onClose }: { item: AcceptanceRow; onClose: () => void }) {
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const [which, setWhich] = useState<'CONFIRM' | 'REJECT'>('CONFIRM');
  const run = useAction((decision: 'CONFIRM' | 'REJECT') => decideServiceAcceptance(item.id, { decision, note: note.trim(), version: item.version }), {
    success: () => interpolate(which === 'CONFIRM' ? t.acceptance.confirmed : t.acceptance.rejected, { n: item.invoice.invoiceNumber }),
    onSuccess: onClose,
  });
  const noteBad = touched && which === 'REJECT' && !note.trim();
  const raw = run.rawError as { code?: string } | null;
  const creator = raw?.code === 'CREATED_THE_ORDER';
  const submit = (d: 'CONFIRM' | 'REJECT') => {
    setWhich(d);
    setTouched(true);
    if (d === 'REJECT' && !note.trim()) return;
    void run.run(d);
  };
  return (
    <Modal
      title={t.acceptance.modalTitle}
      onClose={onClose}
      dismissable={!run.pending}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={run.pending}>{t.common.cancel}</button>
          <button type="button" className="btn btn-danger" onClick={() => submit('REJECT')} disabled={run.pending}>{t.acceptance.reject}</button>
          <button type="button" className="btn btn-primary" onClick={() => submit('CONFIRM')} disabled={run.pending}>{run.pending && <span className="spin" />}{t.acceptance.confirm}</button>
        </>
      }
    >
      {creator && <Notice kind="warn" icon="lock">{t.acceptance.creatorBlocked}</Notice>}
      <dl className="dl">
        <dt>{t.acceptance.invoice}</dt><dd><InvNo value={item.invoice.invoiceNumber} />, {item.invoice.sellerName}</dd>
        <dt>{t.acceptance.order}</dt><dd className="mono">{item.poRef}</dd>
        <dt>{t.acceptance.lines}</dt><dd>{item.serviceLines}</dd>
        <dt>{t.acceptance.amount}</dt><dd>{fmtMoney(item.invoice.totalAmount)}</dd>
        <dt>{t.acceptance.due}</dt><dd>{fmtDate(item.invoice.dueDate)}</dd>
      </dl>
      <Field label={t.acceptance.note} htmlFor="acc-note" hint={t.acceptance.noteHint} error={noteBad ? t.acceptance.noteRequired : null}>
        <textarea id="acc-note" className={`textarea${noteBad ? ' invalid' : ''}`} value={note} onChange={(e) => setNote(e.target.value)} data-autofocus />
      </Field>
      {!creator && <ActionError error={run.error} raw={run.rawError} />}
    </Modal>
  );
}
