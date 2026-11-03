import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, Drawer, Form, Input, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { CloseOutlined, FilterOutlined, SearchOutlined, SyncOutlined, UploadOutlined, CloudSyncOutlined } from '@ant-design/icons';
import type { InvoiceFlow, InvoiceQuery, InvoiceSource, InvoiceState } from '../api/types';
import { isMatchReason, type InvoiceRow } from '../api/invoices';
import { startErpSync } from '../api/admin';
import { useInvoices, useSuppliers, useWorklistSummary, useErpSync } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async, useForced } from '../components/Async';
import { Count, DueSoon, EmptyState, MoreMenu, Notice, PageHeader, InvNo } from '../components/Bits';
import { StateBadge } from '../components/Tags';
import { Kpi, KpiRow } from '../components/Kpi';
import { fmtDate, fmtDateTime, fmtMoney } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';
import { TOKENS } from '../theme/theme';
import { UploadDrawer } from './UploadDrawer';

type View = 'needs' | 'waiting' | 'batch' | 'done' | 'all';
const VIEWS: View[] = ['needs', 'waiting', 'batch', 'done', 'all'];
const PAGE_SIZE = 50;
const FLOWS: InvoiceFlow[] = ['GOODS_WITH_ORDER', 'SERVICES_WITH_ORDER', 'RECURRING', 'UNSUPPORTED_FOREIGN'];

interface FilterValues { state?: InvoiceState; supplier?: string; flow?: InvoiceFlow; source?: InvoiceSource }

/** SCR-10 Invoice Worklist. Saved views are tabs, search and filters live in the query string (Back restores them). */
export function Invoices() {
  const { session } = useAuth();
  const nav = useNavigate();
  const forced = useForced();
  const [sp, setSp] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(sp.has('filters'));
  const [uploadOpen, setUploadOpen] = useState(false);
  const [form] = Form.useForm<FilterValues>();
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
  const clearAll = { q: null, state: null, supplier: null, flow: null, source: null, reminder: null, duesoon: null, figure: null };

  const summary = useWorklistSummary();
  const sync = useErpSync();
  const list = useInvoices(q);
  const suppliers = useSuppliers();
  const doSync = useAction(startErpSync, { success: (r) => t.invoices.syncDone.replace('{n}', String(r.admitted)) });

  const sm = summary.data;
  const activeFilters: { key: string; label: string }[] = [];
  if (q.state) activeFilters.push({ key: 'state', label: `${t.invoices.fState}: ${t.invoiceState[q.state]}` });
  if (q.supplierId) activeFilters.push({ key: 'supplier', label: `${t.invoices.fSupplier}: ${suppliers.data?.find((s) => s.id === q.supplierId)?.name ?? ''}` });
  if (q.flow) activeFilters.push({ key: 'flow', label: `${t.invoices.fFlow}: ${t.flow[q.flow]}` });
  if (q.source) activeFilters.push({ key: 'source', label: `${t.invoices.fSource}: ${t.source[q.source]}` });
  if (q.reminderDue) activeFilters.push({ key: 'reminder', label: t.invoices.reminderDue });
  if (q.dueSoon) activeFilters.push({ key: 'duesoon', label: t.common.dueSoon });
  if (q.figure) activeFilters.push({ key: 'figure', label: `${t.invoices.figure}: ${t.dashboard.figures[q.figure] ?? q.figure}` });

  const cols: TableColumnsType<InvoiceRow> = [
    {
      key: 'inv', title: t.invoices.colInvoice, sorter: (a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber, 'vi'), width: 200,
      render: (_, r) => (<><Link to={`/invoices/${r.id}`} onClick={(e) => e.stopPropagation()}><InvNo value={r.invoiceNumber} /></Link><br /><Typography.Text type="secondary" className="xs">{r.sellerName}</Typography.Text></>),
    },
    { key: 'flow', title: t.invoices.colFlow, ellipsis: true, width: 190, responsive: ['lg'], render: (_, r) => t.flow[r.flow] },
    { key: 'src', title: t.invoices.colSource, width: 80, responsive: ['md'], render: (_, r) => <Typography.Text type="secondary">{t.source[r.source]}</Typography.Text> },
    {
      key: 'due', title: t.invoices.colDue, width: 160, sorter: (a, b) => a.dueDate.localeCompare(b.dueDate),
      render: (_, r) => <Space direction="vertical" size={2}><span className="nowrap">{fmtDate(r.dueDate)}</span>{r.dueSoon && <DueSoon />}</Space>,
    },
    {
      key: 'state', title: t.invoices.colState, width: 160, sorter: (a, b) => a.state.localeCompare(b.state),
      render: (_, r) => (<Space direction="vertical" size={2}><StateBadge state={r.state} />{r.exception && r.exception.state !== 'CLOSED' && <Typography.Text type="secondary" className="xs">{t.exceptionState[r.exception.state]}</Typography.Text>}</Space>),
    },
    { key: 'why', title: t.invoices.colReasons, width: 200, responsive: ['xl'], render: (_, r) => <ReasonsCell r={r} /> },
    { key: 'total', title: t.invoices.colTotal, align: 'right', width: 140, sorter: (a, b) => a.totalAmount - b.totalAmount, render: (_, r) => <span className="nowrap">{fmtMoney(r.totalAmount)}</span> },
  ];

  const noInvoicesAtAll = sm && sm.views.all === 0;
  const emptyNode = (): ReactNode => {
    const clear = <Button size="small" onClick={() => set(clearAll)}>{t.common.clearFilters}</Button>;
    if (search) return <EmptyState title={t.invoices.noneFound} text={t.invoices.noneFoundHint} action={clear} />;
    if (activeFilters.length > 0) return <EmptyState title={t.invoices.noMatch} action={clear} />;
    if (noInvoicesAtAll) {
      return (
        <EmptyState
          title={t.invoices.emptyTitle}
          text={isAp ? t.invoices.emptyApText : t.invoices.emptyRoText}
          action={isAp ? <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>{t.invoices.upload}</Button> : undefined}
        />
      );
    }
    return <EmptyState title={t.invoices.emptyViewTitle} text={t.invoices.emptyViewText} />;
  };

  return (
    <>
      <PageHeader
        title={t.invoices.title}
        readOnly={!isAp}
        actions={isAp ? (
          <>
            <MoreMenu items={[{ label: t.invoices.syncNow, onClick: () => void doSync.run(undefined as never) }]} />
            <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>{t.invoices.upload}</Button>
          </>
        ) : undefined}
        meta={
          <Space size={16} wrap>
            {sync.data && (
              <span>
                <CloudSyncOutlined style={{ marginInlineEnd: 6 }} />
                {t.invoices.lastSync}: {fmtDateTime(sync.data.lastSyncAt)}
              </span>
            )}
            <span>{t.invoices.ofEntity.replace('{entity}', session?.entityName ?? '')}</span>
          </Space>
        }
      />

      {sync.data?.lastSyncFailed && <Notice kind="warn" title={t.invoices.syncFailed.replace('{time}', fmtDateTime(sync.data.lastSyncAt))}>{t.invoices.syncFailedHint}</Notice>}
      {doSync.error && <Notice kind="err">{doSync.error}</Notice>}

      {sm && !search && forced === 'none' && !noInvoicesAtAll && (
        <KpiRow>
          {[
            <Kpi key="e" title={t.invoices.kpiExceptions} value={sm.openExceptions} color={sm.openExceptions > 0 ? TOKENS.warning : undefined} sub={t.invoices.kpiExceptionsSub.replace('{d}', String(sm.waitingDecision)).replace('{s}', String(sm.waitingSupplier))} onClick={() => set({ view: 'needs', figure: null })} />,
            <Kpi key="d" title={t.invoices.kpiDue} value={sm.dueWithin7Days} sub={sm.dueDates.slice(0, 2).map(fmtDate).join(', ') || t.invoices.kpiNone} onClick={() => set({ view: 'all', duesoon: '1', figure: null })} />,
            <Kpi key="b" title={t.invoices.kpiBatch} value={sm.inBatch} sub={fmtMoney(sm.inBatchTotal)} onClick={() => set({ view: 'batch', figure: null })} />,
            <Kpi key="w" title={t.invoices.kpiWaiting} value={sm.waitingForGoods} sub={t.invoices.kpiWaitingSub} onClick={() => set({ view: 'waiting', figure: null })} />,
          ]}
        </KpiRow>
      )}

      <Card className="list-card" aria-label={t.invoices.listLabel} styles={{ body: { padding: 0 } }}>
        {sm && !search && !q.figure && (
          <Tabs
            className="view-tabs"
            aria-label={t.invoices.savedViews}
            activeKey={view}
            onChange={(v) => set({ view: v, duesoon: null })}
            items={VIEWS.map((v) => ({
              key: v,
              label: <span>{t.invoices.views[v]} <Count n={sm.views[v]} strong={v === 'needs' && sm.views.needs > 0} /></span>,
            }))}
          />
        )}
        <div className="toolbar">
          <Input.Search
            className="toolbar-search"
            allowClear
            placeholder={t.invoices.searchPlaceholder}
            aria-label={t.invoices.searchLabel}
            prefix={<SearchOutlined />}
            enterButton={false}
            value={search}
            onChange={(e) => set({ q: e.target.value })}
          />
          <Badge count={activeFilters.length} size="small" color={TOKENS.primary}>
            <Button icon={<FilterOutlined />} onClick={() => { form.setFieldsValue({ state: q.state || undefined, supplier: q.supplierId || undefined, flow: q.flow || undefined, source: q.source || undefined }); setFiltersOpen(true); }}>{t.invoices.filters}</Button>
          </Badge>
          {search && (
            <Select
              aria-label={t.invoices.narrowByState}
              style={{ minWidth: 180 }}
              allowClear
              placeholder={t.invoices.anyState}
              value={q.state || undefined}
              onChange={(v) => set({ state: v ?? null })}
              options={(Object.keys(t.invoiceState) as InvoiceState[]).map((s) => ({ value: s, label: t.invoiceState[s] }))}
            />
          )}
          {activeFilters.map((f) => (
            <Tag key={f.key} closable bordered onClose={(e) => { e.preventDefault(); set({ [f.key]: null }); }} closeIcon={<span aria-label={t.invoices.removeFilter.replace('{f}', f.label)} role="button"><CloseOutlined /></span>}>{f.label}</Tag>
          ))}
          <span style={{ flex: 1 }} />
          {list.data && (
            <Typography.Text type="secondary">
              {search
                ? t.invoices.countAnyState.replace('{n}', String(list.data.anyStateCount))
                : t.invoices.countOf.replace('{n}', String(list.data.total)).replace('{total}', String(sm?.views[view] ?? list.data.total))}
            </Typography.Text>
          )}
        </div>
        <Async q={list} isEmpty={(d) => d.total === 0} empty={emptyNode()}>
          {(data) => (
            <Table<InvoiceRow>
              size="middle"
              rowKey="id"
              columns={cols}
              dataSource={data.items}
              scroll={{ x: 760 }}
              sticky={{ offsetHeader: 56 }}
              onRow={(r) => ({ onClick: () => nav(`/invoices/${r.id}`), style: { cursor: 'pointer' } })}
              loading={list.isFetching && !list.isPending}
              pagination={{
                current: data.page,
                pageSize: data.pageSize,
                total: data.total,
                hideOnSinglePage: false,
                showSizeChanger: false,
                showTotal: (total, [from, to]) => t.common.showing.replace('{from}', String(from)).replace('{to}', String(to)).replace('{total}', String(total)),
                onChange: (p) => set({ page: String(p) }, true),
              }}
            />
          )}
        </Async>
      </Card>

      <Drawer
        open={filtersOpen}
        title={t.invoices.filterTitle}
        width={360}
        onClose={() => setFiltersOpen(false)}
        destroyOnHidden
        footer={
          <Space>
            <Button onClick={() => { form.resetFields(); set({ state: null, supplier: null, flow: null, source: null, reminder: null, duesoon: null, figure: null }); setFiltersOpen(false); }}>{t.common.clearFilters}</Button>
            <Button type="primary" onClick={() => { const v = form.getFieldsValue(); set({ state: v.state ?? null, supplier: v.supplier ?? null, flow: v.flow ?? null, source: v.source ?? null }); setFiltersOpen(false); }}>{t.common.apply}</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="state" label={t.invoices.fState}>
            <Select allowClear placeholder={t.invoices.allStates} options={(Object.keys(t.invoiceState) as InvoiceState[]).map((s) => ({ value: s, label: t.invoiceState[s] }))} />
          </Form.Item>
          <Form.Item name="supplier" label={t.invoices.fSupplier}>
            <Select allowClear showSearch optionFilterProp="label" placeholder={t.invoices.allSuppliers} options={suppliers.data?.map((s) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
          <Form.Item name="flow" label={t.invoices.fFlow}>
            <Select allowClear placeholder={t.invoices.allFlows} options={FLOWS.map((f) => ({ value: f, label: t.flow[f] }))} />
          </Form.Item>
          <Form.Item name="source" label={t.invoices.fSource}>
            <Select allowClear placeholder={t.invoices.allSources} options={[{ value: 'UPLOAD', label: t.source.UPLOAD }, { value: 'EMAIL', label: t.source.EMAIL }]} />
          </Form.Item>
        </Form>
      </Drawer>

      {uploadOpen && <UploadDrawer onClose={() => setUploadOpen(false)} />}
    </>
  );
}

function ReasonsCell({ r }: { r: InvoiceRow }) {
  const e = r.exception;
  if (e && e.state !== 'CLOSED') {
    const first = e.reasons[0];
    // A reason of conditions 1 to 3 opens the three-way match tab at the first line that needs attention. When the first reason is another one,
    // a small link after the count does the same.
    const to = r.matchLink ? `/invoices/${r.id}?tab=match${r.matchLink.line ? `&line=${r.matchLink.line}` : ''}` : null;
    const firstText = first ? t.reason(first.code, first.params) : '';
    const firstIsMatch = !!first && isMatchReason(first);
    return (
      <Space size={4} wrap>
        {first && (to && firstIsMatch
          ? <Link to={to} className="reason-link" title={firstText} onClick={(ev) => ev.stopPropagation()}>{firstText}</Link>
          : <Typography.Text ellipsis={{ tooltip: firstText }} style={{ maxWidth: 168 }}>{firstText}</Typography.Text>)}
        {e.reasons.length > 1 && <Tag style={{ marginInlineEnd: 0 }}>+{e.reasons.length - 1}</Tag>}
        {to && !firstIsMatch && <Link to={to} className="xs" onClick={(ev) => ev.stopPropagation()}>{t.detail.match.viewMatch}</Link>}
        {r.reminderDue && <Typography.Text className="xs" style={{ color: TOKENS.warning }}><SyncOutlined aria-hidden="true" /> {t.invoices.reminderDue}</Typography.Text>}
      </Space>
    );
  }
  if (r.state === 'REJECTED' && r.rejection) return <Typography.Text type="secondary">{t.rejection[r.rejection.code]}{r.rejection.note && r.rejection.code === 'REJECTED_BY_PERSON' ? `: ${r.rejection.note}` : ''}</Typography.Text>;
  if (r.state === 'PAID' && r.paymentRef) return <Typography.Text type="secondary" className="mono">{r.paymentRef}</Typography.Text>;
  return <Typography.Text type="secondary">{t.note(r.note)}</Typography.Text>;
}
