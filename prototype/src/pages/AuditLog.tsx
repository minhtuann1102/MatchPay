import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AuditEntry, AuditEventType } from '../api/types';
import { useAudit } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { EmptyState, Field, PageHeader } from '../components/Bits';
import { DataTable, Pager, type Col } from '../components/DataTable';
import { Drawer } from '../components/Modal';
import { fmtDateTime, parseDate } from '../lib/format';
import { t } from '../i18n/vi';

const HANDS: Record<AuditEntry['hand'], string> = t.hands;
const TYPES = Object.keys(t.auditEventType) as AuditEventType[];

export const eventText = (a: AuditEntry): string => t.event(a.event.code, a.event.params);

/** SCR-61 Audit Log: read only, filtered by date, document and event type, with a detail drawer. */
export function AuditLog() {
  const { session } = useAuth();
  const [draft, setDraft] = useState({ from: '', to: '', document: '', eventType: '' as '' | AuditEventType });
  const [applied, setApplied] = useState(draft);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<AuditEntry | null>(null);
  const from = draft.from ? parseDate(draft.from) : '';
  const to = draft.to ? parseDate(draft.to) : '';
  const badFrom = !!draft.from && !from;
  const badTo = !!draft.to && !to;
  const q = useAudit({
    from: applied.from ? parseDate(applied.from) : undefined, to: applied.to ? parseDate(applied.to) : undefined,
    document: applied.document || undefined, eventType: applied.eventType, page, pageSize: 15,
  });
  const filtered = !!(applied.from || applied.to || applied.document || applied.eventType);
  const clear = () => { const e = { from: '', to: '', document: '', eventType: '' as const }; setDraft(e); setApplied(e); setPage(1); };

  const cols: Col<AuditEntry>[] = [
    { key: 'at', label: t.audit.colTime, header: t.audit.colTime, render: (a) => <span className="nowrap">{fmtDateTime(a.at)}</span> },
    { key: 'hand', label: t.audit.colHand, header: t.audit.colHand, render: (a) => <span className={`au au-${a.hand === 'AI' ? 'ai' : a.hand === 'RULE' ? 'rule' : a.hand === 'PERSON' ? 'person' : 'data'}`}>{HANDS[a.hand]}</span> },
    { key: 'who', label: t.audit.colActor, header: t.audit.colActor, render: (a) => a.actorName ?? <span className="muted">{t.audit.system}</span> },
    { key: 'type', label: t.audit.colType, header: t.audit.colType, render: (a) => t.auditEventType[a.eventType] },
    { key: 'obj', label: t.audit.colObject, header: t.audit.colObject, render: (a) => <span className="mono">{a.objectLabel}</span> },
    { key: 'ev', label: t.audit.colEvent, header: t.audit.colEvent, render: (a) => <>{eventText(a)}{a.note && <span className="sub">"{a.note}"</span>}</> },
  ];

  return (
    <>
      <PageHeader title={t.audit.title} readOnly meta={t.audit.intro} />
      <section className="card">
        <form className="filters" role="search" aria-label={t.audit.filters} onSubmit={(e) => { e.preventDefault(); if (badFrom || badTo) return; setApplied(draft); setPage(1); }} style={{ alignItems: 'flex-start' }}>
          <Field label={t.audit.from} htmlFor="au-from" error={badFrom ? t.audit.badDate : null}><input id="au-from" className={`input${badFrom ? ' invalid' : ''}`} placeholder="dd/MM/yyyy" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></Field>
          <Field label={t.audit.to} htmlFor="au-to" error={badTo ? t.audit.badDate : null}><input id="au-to" className={`input${badTo ? ' invalid' : ''}`} placeholder="dd/MM/yyyy" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></Field>
          <Field label={t.audit.document} htmlFor="au-doc"><input id="au-doc" className="input" placeholder={t.audit.documentPlaceholder} value={draft.document} onChange={(e) => setDraft({ ...draft, document: e.target.value })} /></Field>
          <Field label={t.audit.eventType} htmlFor="au-type">
            <select id="au-type" className="select" value={draft.eventType} onChange={(e) => setDraft({ ...draft, eventType: e.target.value as '' | AuditEventType })}>
              <option value="">{t.audit.allTypes}</option>
              {TYPES.map((k) => <option key={k} value={k}>{t.auditEventType[k]}</option>)}
            </select>
          </Field>
          <div className="row" style={{ alignSelf: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">{t.audit.apply}</button>
            {filtered && <button type="button" className="btn btn-quiet" onClick={clear}>{t.common.clearFilters}</button>}
          </div>
        </form>
        <Async q={q} isEmpty={(d) => d.total === 0} empty={filtered ? <EmptyState icon="search" title={t.audit.noMatch} action={<button type="button" className="btn" onClick={clear}>{t.common.clearFilters}</button>} /> : <EmptyState icon="book" title={t.audit.emptyTitle} text={t.audit.emptyText} />}>
          {(d) => <DataTable columns={cols} rows={d.items} rowKey={(a) => a.id} caption={t.audit.title} onRowClick={setOpen} footer={<Pager total={d.total} page={d.page} pageSize={d.pageSize} onPage={setPage} />} />}
        </Async>
      </section>
      {open && <EntryDrawer a={open} canOpen={session?.role === 'CHIEF_ACCOUNTANT'} onClose={() => setOpen(null)} />}
    </>
  );
}

function EntryDrawer({ a, canOpen, onClose }: { a: AuditEntry; canOpen: boolean; onClose: () => void }) {
  return (
    <Drawer title={t.audit.detailTitle} onClose={onClose} footer={<button type="button" className="btn" onClick={onClose}>{t.common.close}</button>}>
      <dl className="dl">
        <dt>{t.audit.id}</dt><dd className="mono">{a.id}</dd>
        <dt>{t.audit.time}</dt><dd>{fmtDateTime(a.at)}</dd>
        <dt>{t.audit.hand}</dt><dd>{HANDS[a.hand]}</dd>
        <dt>{t.audit.actor}</dt><dd>{a.actorName ?? t.audit.system}</dd>
        <dt>{t.audit.type}</dt><dd>{t.auditEventType[a.eventType]}</dd>
        <dt>{t.audit.object}</dt><dd className="mono">{a.objectLabel}</dd>
        <dt>{t.audit.event}</dt><dd>{eventText(a)}</dd>
        {a.note && <><dt>{t.audit.note}</dt><dd>"{a.note}"</dd></>}
        {a.model && <><dt>{t.audit.model}</dt><dd className="mono">{a.model}</dd></>}
        {a.task && <><dt>{t.audit.task}</dt><dd className="mono">{a.task}</dd></>}
      </dl>
      {canOpen && a.objectType === 'INVOICE' && a.objectId.startsWith('inv-') && <p><Link to={`/invoices/${a.objectId}`}>{t.audit.openInvoice}</Link></p>}
      <p className="xs muted" style={{ marginTop: 16 }}>{t.audit.readOnlyNote}</p>
    </Drawer>
  );
}
