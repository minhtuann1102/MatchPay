import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { InvoiceFlow, InvoiceQuery, InvoiceSource, InvoiceState } from '../api/types';
import type { InvoiceRow } from '../api/invoices';
import { startErpSync } from '../api/admin';
import { useInvoices, useSuppliers, useWorklistSummary, useErpSync } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async, useForced } from '../components/Async';
import { DueSoon, EmptyState, Field, Menu, Notice, PageHeader, Tabs } from '../components/Bits';
import { StateBadge, ExceptionBadge } from '../components/Chips';
import { DataTable, Pager, type Col } from '../components/DataTable';
import { Icon } from '../components/Icon';
import { fmtDate, fmtDateTime, fmtMoney } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';
import { UploadDrawer } from './UploadDrawer';

type View = 'needs' | 'waiting' | 'batch' | 'done' | 'all';
const VIEWS: View[] = ['needs', 'waiting', 'batch', 'done', 'all'];
const PAGE_SIZE = 50;

/** SCR-10 Invoice Worklist. Saved views are tabs, search and filters live in the query string (Back restores them). */
export function Invoices() {
  const { session } = useAuth();
  const nav = useNavigate();
  const forced = useForced();
  const [sp, setSp] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(sp.has('filters'));
  const [uploadOpen, setUploadOpen] = useState(false);
  const isAp = session?.role === 'AP_ACCOUNTANT';

  const view = (VIEWS.includes(sp.get('view') as View) ? sp.get('view') : 'needs') as View;
  const search = sp.get('q') ?? '';
  const q: InvoiceQuery = {
    view,
    search,
    state: (sp.get('state') ?? '') as InvoiceState | '',
    supplierId: sp.get('supplier') ?? '',
    flow: (sp.get('flow') ?? '') as InvoiceFlow | '',
    source: (sp.get('source') ?? '') as InvoiceSource | '',
    reminderDue: sp.get('reminder') === '1',
    dueSoon: sp.get('duesoon') === '1',
    figure: sp.get('figure') ?? undefined,
    page: Number(sp.get('page') ?? 1),
    pageSize: PAGE_SIZE,
  };
  const set = (patch: Record<string, string | null>, keepPage = false) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    if (!keepPage) next.delete('page');
    setSp(next, { replace: true });
  };

  const summary = useWorklistSummary();
  const sync = useErpSync();
  const list = useInvoices(q);
  const suppliers = useSuppliers();
  const doSync = useAction(startErpSync, { success: (r) => t.invoices.syncDone.replace('{n}', String(r.admitted)) });

  const [draft, setDraft] = useState({ state: q.state ?? '', supplier: q.supplierId ?? '', flow: q.flow ?? '', source: q.source ?? '', reminder: !!q.reminderDue });
  const sm = summary.data;
  const activeFilters: { key: string; label: string }[] = [];
  if (q.state) activeFilters.push({ key: 'state', label: `${t.invoices.fState}: ${t.invoiceState[q.state]}` });
  if (q.supplierId) activeFilters.push({ key: 'supplier', label: `${t.invoices.fSupplier}: ${suppliers.data?.find((s) => s.id === q.supplierId)?.name ?? ''}` });
  if (q.flow) activeFilters.push({ key: 'flow', label: `${t.invoices.fFlow}: ${t.flow[q.flow]}` });
  if (q.source) activeFilters.push({ key: 'source', label: `${t.invoices.fSource}: ${t.source[q.source]}` });
  if (q.reminderDue) activeFilters.push({ key: 'reminder', label: t.invoices.reminderDue });
  if (q.dueSoon) activeFilters.push({ key: 'duesoon', label: t.common.dueSoon });
  if (q.figure) activeFilters.push({ key: 'figure', label: `${t.invoices.figure}: ${t.dashboard.figures[q.figure] ?? q.figure}` });

  const cols: Col<InvoiceRow>[] = [
    {
      key: 'inv', label: t.invoices.colInvoice, header: t.invoices.colInvoice, sort: (r) => r.invoiceNumber,
      render: (r) => (<><Link to={`/invoices/${r.id}`}>{r.invoiceNumber}</Link><span className="sub">{r.sellerName}</span></>),
    },
    { key: 'flow', label: t.invoices.colFlow, header: t.invoices.colFlow, render: (r) => <span className="flow" title={t.flow[r.flow]}>{t.flow[r.flow]}</span> },
    { key: 'src', label: t.invoices.colSource, header: t.invoices.colSource, render: (r) => <span className="src-tag">{t.source[r.source]}</span> },
    { key: 'due', label: t.invoices.colDue, header: t.invoices.colDue, sort: (r) => r.dueDate, render: (r) => <><span className="due">{fmtDate(r.dueDate)}</span>{r.dueSoon && <DueSoon />}</> },
    {
      key: 'state', label: t.invoices.colState, header: t.invoices.colState, sort: (r) => r.state,
      render: (r) => (<><StateBadge state={r.state} />{r.exception && r.exception.state !== 'CLOSED' && <span className="sub"><ExceptionBadge state={r.exception.state} /></span>}</>),
    },
    { key: 'why', label: t.invoices.colReasons, header: t.invoices.colReasons, render: (r) => <ReasonsCell r={r} /> },
    { key: 'total', label: t.invoices.colTotal, header: t.invoices.colTotal, className: 'money', sort: (r) => r.totalAmount, render: (r) => fmtMoney(r.totalAmount) },
    {
      key: 'go', label: '', header: <span className="sr">{t.common.open}</span>, className: 'row-act',
      render: (r) => <Link className="btn btn-quiet btn-sm" to={`/invoices/${r.id}`} aria-label={`${t.common.open} ${r.invoiceNumber}`} title={t.common.open}><Icon name="chevronr" small /></Link>,
    },
  ];

  const items = list.data?.items ?? [];
  const noInvoicesAtAll = sm && sm.views.all === 0;

  return (
    <>
      <PageHeader
        title={t.invoices.title}
        readOnly={!isAp}
        actions={isAp ? (
          <>
            <Menu items={[{ label: t.invoices.syncNow, onClick: () => void doSync.run(undefined as never) }]} />
            <button type="button" className="btn btn-primary" onClick={() => setUploadOpen(true)}><Icon name="upload" />{t.invoices.upload}</button>
          </>
        ) : undefined}
        meta={
          <>
            {sync.data && (
              <span className={`sync${sync.data.lastSyncFailed ? ' sync-stale' : ''}`}>
                <Icon name="refresh" small />
                {t.invoices.lastSync}: {fmtDateTime(sync.data.lastSyncAt)}
              </span>
            )}
            <span>{t.invoices.ofEntity.replace('{entity}', session?.entityName ?? '')}</span>
          </>
        }
      />

      {sync.data?.lastSyncFailed && <Notice kind="warn" title={t.invoices.syncFailed.replace('{time}', fmtDateTime(sync.data.lastSyncAt))}>{t.invoices.syncFailedHint}</Notice>}
      {doSync.error && <Notice kind="err">{doSync.error}</Notice>}

      {sm && !search && forced === 'none' && !noInvoicesAtAll && (
        <div className="kpis">
          <button type="button" className="tile t-warn" onClick={() => set({ view: 'needs', figure: null })}>
            <span className="t-lbl">{t.invoices.kpiExceptions}</span>
            <span className="t-val">{sm.openExceptions}</span>
            <span className="t-sub">{t.invoices.kpiExceptionsSub.replace('{d}', String(sm.waitingDecision)).replace('{s}', String(sm.waitingSupplier))}</span>
          </button>
          <button type="button" className="tile" onClick={() => set({ view: 'all', duesoon: '1', figure: null })}>
            <span className="t-lbl">{t.invoices.kpiDue}</span>
            <span className="t-val">{sm.dueWithin7Days}</span>
            <span className="t-sub">{sm.dueDates.slice(0, 2).map(fmtDate).join(', ') || t.invoices.kpiNone}</span>
          </button>
          <button type="button" className="tile" onClick={() => set({ view: 'batch', figure: null })}>
            <span className="t-lbl">{t.invoices.kpiBatch}</span>
            <span className="t-val">{sm.inBatch}</span>
            <span className="t-sub">{fmtMoney(sm.inBatchTotal)}</span>
          </button>
          <button type="button" className="tile" onClick={() => set({ view: 'waiting', figure: null })}>
            <span className="t-lbl">{t.invoices.kpiWaiting}</span>
            <span className="t-val">{sm.waitingForGoods}</span>
            <span className="t-sub">{t.invoices.kpiWaitingSub}</span>
          </button>
        </div>
      )}

      <section className="card" aria-label={t.invoices.listLabel}>
        {sm && !search && !q.figure && (
          <Tabs<View>
            label={t.invoices.savedViews}
            value={view}
            onChange={(v) => set({ view: v, duesoon: null })}
            tabs={VIEWS.map((v) => ({ id: v, label: t.invoices.views[v], count: sm.views[v], tone: v === 'needs' && sm.views.needs ? 'warn' : undefined }))}
          />
        )}
        <div className="toolbar">
          <div className="search">
            <Icon name="search" />
            <input className="input" type="search" placeholder={t.invoices.searchPlaceholder} aria-label={t.invoices.searchLabel} value={search} onChange={(e) => set({ q: e.target.value })} />
          </div>
          <button type="button" className="btn" aria-expanded={filtersOpen} aria-controls="f-panel" onClick={() => setFiltersOpen((o) => !o)}>
            <Icon name="filter" small />
            {t.invoices.filters}
            {activeFilters.length > 0 && <span className="fcount">{activeFilters.length}</span>}
          </button>
          {activeFilters.map((f) => (
            <span className="fchip" key={f.key}>
              {f.label}
              <button type="button" aria-label={t.invoices.removeFilter.replace('{f}', f.label)} onClick={() => set({ [f.key]: null })}><Icon name="x" small /></button>
            </span>
          ))}
          {search && <span className="fchip">{t.invoices.searchChip.replace('{q}', search)}<button type="button" aria-label={t.invoices.removeSearch} onClick={() => set({ q: null })}><Icon name="x" small /></button></span>}
          <span className="grow" />
          {list.data && (
            <span className="muted small">
              {search
                ? t.invoices.countAnyState.replace('{n}', String(list.data.anyStateCount))
                : t.invoices.countOf.replace('{n}', String(list.data.total)).replace('{total}', String(sm?.views[view] ?? list.data.total))}
            </span>
          )}
        </div>
        {filtersOpen && (
          <div className="filter-panel" id="f-panel">
            <form
              className="filters"
              onSubmit={(e) => {
                e.preventDefault();
                set({ state: draft.state, supplier: draft.supplier, flow: draft.flow, source: draft.source, reminder: draft.reminder ? '1' : null });
              }}
            >
              <Field label={t.invoices.fState} htmlFor="f-state">
                <select id="f-state" className="select" value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value as InvoiceState })}>
                  <option value="">{t.invoices.allStates}</option>
                  {(Object.keys(t.invoiceState) as InvoiceState[]).map((s) => <option key={s} value={s}>{t.invoiceState[s]}</option>)}
                </select>
              </Field>
              <Field label={t.invoices.fSupplier} htmlFor="f-sup">
                <select id="f-sup" className="select" value={draft.supplier} onChange={(e) => setDraft({ ...draft, supplier: e.target.value })}>
                  <option value="">{t.invoices.allSuppliers}</option>
                  {suppliers.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
              <Field label={t.invoices.fFlow} htmlFor="f-flow">
                <select id="f-flow" className="select" value={draft.flow} onChange={(e) => setDraft({ ...draft, flow: e.target.value as InvoiceFlow })}>
                  <option value="">{t.invoices.allFlows}</option>
                  {(['GOODS_WITH_ORDER', 'SERVICES_WITH_ORDER', 'RECURRING', 'UNSUPPORTED_FOREIGN'] as InvoiceFlow[]).map((f) => <option key={f} value={f}>{t.flow[f]}</option>)}
                </select>
              </Field>
              <Field label={t.invoices.fSource} htmlFor="f-src">
                <select id="f-src" className="select" value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value as InvoiceSource })}>
                  <option value="">{t.invoices.allSources}</option>
                  <option value="UPLOAD">{t.source.UPLOAD}</option>
                  <option value="EMAIL">{t.source.EMAIL}</option>
                </select>
              </Field>
              <label className="check" style={{ paddingBottom: 8 }}>
                <input type="checkbox" checked={draft.reminder} onChange={(e) => setDraft({ ...draft, reminder: e.target.checked })} /> {t.invoices.reminderDue}
              </label>
              <button className="btn btn-primary" type="submit" style={{ marginBottom: 2 }}>{t.common.apply}</button>
              <button
                className="btn btn-quiet"
                type="button"
                style={{ marginBottom: 2 }}
                onClick={() => {
                  setDraft({ state: '', supplier: '', flow: '', source: '', reminder: false });
                  set({ state: null, supplier: null, flow: null, source: null, reminder: null, duesoon: null, figure: null });
                }}
              >
                {t.common.clearFilters}
              </button>
            </form>
          </div>
        )}
        {search && (
          <div className="toolbar" style={{ borderBottom: 0, paddingTop: 0 }}>
            <label className="xs muted" htmlFor="f-narrow">{t.invoices.narrowByState}</label>
            <select id="f-narrow" className="select" style={{ width: 'auto' }} value={q.state ?? ''} onChange={(e) => set({ state: e.target.value })}>
              <option value="">{t.invoices.anyState}</option>
              {(Object.keys(t.invoiceState) as InvoiceState[]).map((s) => <option key={s} value={s}>{t.invoiceState[s]}</option>)}
            </select>
          </div>
        )}
        <Async
          q={list}
          isEmpty={(d) => d.total === 0}
          empty={emptyNode({ noInvoicesAtAll: !!noInvoicesAtAll, search, hasFilters: activeFilters.length > 0, isAp, onUpload: () => setUploadOpen(true), onClear: () => set({ q: null, state: null, supplier: null, flow: null, source: null, reminder: null, duesoon: null, figure: null }) })}
        >
          {(data) => (
            <>
              <DataTable
                columns={cols}
                rows={items}
                rowKey={(r) => r.id}
                caption={t.invoices.title}
                onRowClick={(r) => nav(`/invoices/${r.id}`)}
                footer={<Pager total={data.total} page={data.page} pageSize={data.pageSize} onPage={(p) => set({ page: String(p) }, true)} />}
              />
            </>
          )}
        </Async>
      </section>

      {uploadOpen && <UploadDrawer onClose={() => setUploadOpen(false)} />}
    </>
  );
}

function emptyNode(o: { noInvoicesAtAll: boolean; search: string; hasFilters: boolean; isAp: boolean; onUpload: () => void; onClear: () => void }): ReactNode {
  if (o.search) {
    return <EmptyState icon="search" title={t.invoices.noneFound} text={t.invoices.noneFoundHint} action={<button type="button" className="btn btn-sm" onClick={o.onClear}>{t.common.clearFilters}</button>} />;
  }
  if (o.hasFilters) {
    return <EmptyState icon="filter" title={t.invoices.noMatch} action={<button type="button" className="btn btn-sm" onClick={o.onClear}>{t.common.clearFilters}</button>} />;
  }
  if (o.noInvoicesAtAll) {
    return (
      <EmptyState
        title={t.invoices.emptyTitle}
        text={o.isAp ? t.invoices.emptyApText : t.invoices.emptyRoText}
        action={o.isAp ? <button type="button" className="btn btn-primary" onClick={o.onUpload}><Icon name="upload" />{t.invoices.upload}</button> : undefined}
      />
    );
  }
  return <EmptyState title={t.invoices.emptyViewTitle} text={t.invoices.emptyViewText} />;
}

function ReasonsCell({ r }: { r: InvoiceRow }) {
  const e = r.exception;
  if (e && e.state !== 'CLOSED') {
    const first = e.reasons[0];
    return (
      <>
        {first && <span className="reason">{t.reason(first.code, first.params)}</span>}
        {e.reasons.length > 1 && <span className="more-n">+{e.reasons.length - 1}</span>}
        {r.reminderDue && <span className="tagx tagx-warn">{t.invoices.reminderDue}</span>}
      </>
    );
  }
  if (r.state === 'REJECTED' && r.rejection) return <span className="clip muted">{t.rejection[r.rejection.code]}{r.rejection.note && r.rejection.code === 'REJECTED_BY_PERSON' ? `: ${r.rejection.note}` : ''}</span>;
  if (r.state === 'PAID' && r.paymentRef) return <span className="clip muted mono">{r.paymentRef}</span>;
  return <span className="clip muted">{t.note(r.note)}</span>;
}
