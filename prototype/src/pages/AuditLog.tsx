import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, DatePicker, Descriptions, Drawer, Form, Input, Select, Space, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import type { AuditEntry, AuditEventType } from '../api/types';
import { useAudit } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { EmptyState, PageHeader } from '../components/Bits';
import { HandTag } from '../components/Tags';
import { fmtDateTime } from '../lib/format';
import { t } from '../i18n/vi';

const TYPES = Object.keys(t.auditEventType) as AuditEventType[];

export const eventText = (a: AuditEntry): string => t.event(a.event.code, a.event.params);

interface Filters { range?: [Dayjs, Dayjs] | null; document?: string; eventType?: AuditEventType }

/** SCR-61 Audit Log: read only, filtered by date, document and event type, with a detail drawer. */
export function AuditLog() {
  const { session } = useAuth();
  const [form] = Form.useForm<Filters>();
  const [applied, setApplied] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<AuditEntry | null>(null);
  const q = useAudit({
    from: applied.range?.[0]?.format('YYYY-MM-DD'), to: applied.range?.[1]?.format('YYYY-MM-DD'),
    document: applied.document || undefined, eventType: applied.eventType ?? '', page, pageSize: 15,
  });
  const filtered = !!(applied.range || applied.document || applied.eventType);
  const clear = () => { form.resetFields(); setApplied({}); setPage(1); };

  const cols: TableColumnsType<AuditEntry> = [
    { title: t.audit.colTime, key: 'at', width: 150, render: (_, a) => <span className="nowrap">{fmtDateTime(a.at)}</span> },
    { title: t.audit.colHand, key: 'hand', width: 170, render: (_, a) => <HandTag hand={a.hand} /> },
    { title: t.audit.colActor, key: 'who', width: 170, responsive: ['md'], render: (_, a) => a.actorName ?? <Typography.Text type="secondary">{t.audit.system}</Typography.Text> },
    { title: t.audit.colType, key: 'type', width: 200, responsive: ['lg'], render: (_, a) => t.auditEventType[a.eventType] },
    { title: t.audit.colObject, key: 'obj', width: 150, render: (_, a) => <span className="mono">{a.objectLabel}</span> },
    { title: t.audit.colEvent, key: 'ev', width: 320, render: (_, a) => <>{eventText(a)}{a.note && <><br /><Typography.Text type="secondary" className="xs">"{a.note}"</Typography.Text></>}</> },
  ];

  return (
    <>
      <PageHeader title={t.audit.title} readOnly meta={t.audit.intro} />
      <Card styles={{ body: { padding: 0 } }}>
        <Form form={form} layout="inline" className="filter-bar" role="search" aria-label={t.audit.filters} onFinish={(v) => { setApplied(v); setPage(1); }}>
          <Form.Item name="range" label={t.audit.range}><DatePicker.RangePicker format="DD/MM/YYYY" placeholder={[t.audit.from, t.audit.to]} /></Form.Item>
          <Form.Item name="document" label={t.audit.document}><Input allowClear prefix={<SearchOutlined />} placeholder={t.audit.documentPlaceholder} style={{ width: 220 }} /></Form.Item>
          <Form.Item name="eventType" label={t.audit.eventType}>
            <Select allowClear placeholder={t.audit.allTypes} style={{ minWidth: 220 }} options={TYPES.map((k) => ({ value: k, label: t.auditEventType[k] }))} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">{t.audit.apply}</Button>
              {filtered && <Button onClick={clear}>{t.common.clearFilters}</Button>}
            </Space>
          </Form.Item>
        </Form>
        <Async q={q} isEmpty={(d) => d.total === 0} empty={filtered ? <EmptyState title={t.audit.noMatch} action={<Button onClick={clear}>{t.common.clearFilters}</Button>} /> : <EmptyState title={t.audit.emptyTitle} text={t.audit.emptyText} />}>
          {(d) => (
            <Table<AuditEntry>
              size="middle"
              rowKey="id"
              columns={cols}
              dataSource={d.items}
              scroll={{ x: 760 }}
              sticky={{ offsetHeader: 56 }}
              onRow={(a) => ({ onClick: () => setOpen(a), style: { cursor: 'pointer' } })}
              pagination={{ current: d.page, pageSize: d.pageSize, total: d.total, showSizeChanger: false, showTotal: (total, [f, to]) => t.common.showing.replace('{from}', String(f)).replace('{to}', String(to)).replace('{total}', String(total)), onChange: setPage }}
            />
          )}
        </Async>
      </Card>
      {open && <EntryDrawer a={open} canOpen={session?.role === 'CHIEF_ACCOUNTANT'} onClose={() => setOpen(null)} />}
    </>
  );
}

function EntryDrawer({ a, canOpen, onClose }: { a: AuditEntry; canOpen: boolean; onClose: () => void }) {
  return (
    <Drawer open title={t.audit.detailTitle} width={480} onClose={onClose} destroyOnHidden footer={<Button onClick={onClose}>{t.common.close}</Button>}>
      <div className="stack">
        <Descriptions colon={false}
          size="small"
          column={1}
          bordered
          items={[
            { key: 'id', label: t.audit.id, children: <span className="mono">{a.id}</span> },
            { key: 'time', label: t.audit.time, children: fmtDateTime(a.at) },
            { key: 'hand', label: t.audit.hand, children: <HandTag hand={a.hand} /> },
            { key: 'actor', label: t.audit.actor, children: a.actorName ?? t.audit.system },
            { key: 'type', label: t.audit.type, children: t.auditEventType[a.eventType] },
            { key: 'obj', label: t.audit.object, children: <span className="mono">{a.objectLabel}</span> },
            { key: 'event', label: t.audit.event, children: eventText(a) },
            ...(a.note ? [{ key: 'note', label: t.audit.note, children: `"${a.note}"` }] : []),
            ...(a.model ? [{ key: 'model', label: t.audit.model, children: <span className="mono">{a.model}</span> }] : []),
            ...(a.task ? [{ key: 'task', label: t.audit.task, children: <span className="mono">{a.task}</span> }] : []),
          ]}
        />
        <div>
          <Typography.Text strong>{t.audit.raw}</Typography.Text>
          <pre className="json-block">{JSON.stringify({ id: a.id, at: a.at, hand: a.hand, eventType: a.eventType, object: `${a.objectType}:${a.objectId}`, event: a.event }, null, 2)}</pre>
        </div>
        {canOpen && a.objectType === 'INVOICE' && a.objectId.startsWith('inv-') && <Link to={`/invoices/${a.objectId}`}>{t.audit.openInvoice}</Link>}
        <Typography.Text type="secondary" className="xs">{t.audit.readOnlyNote}</Typography.Text>
      </div>
    </Drawer>
  );
}
