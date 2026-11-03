import { useState } from 'react';
import { Button, Card, Checkbox, Descriptions, Form, Input, Modal, Select, Space, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import type { AcceptanceRow } from '../api/acceptance';
import { decideServiceAcceptance } from '../api/acceptance';
import { useAcceptanceQueue, useSuppliers } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { DueSoon, EmptyState, Notice, PageHeader, InvNo } from '../components/Bits';
import { ActionError } from '../components/Dialogs';
import { Kpi, KpiRow } from '../components/Kpi';
import { fmtDate, fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';
import { TOKENS } from '../theme/theme';

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
  const clear = () => { setSupplierId(''); setDueSoon(false); };

  const cols: TableColumnsType<AcceptanceRow> = [
    { title: t.acceptance.colInvoice, key: 'inv', width: 230, render: (_, r) => <><InvNo value={r.invoice.invoiceNumber} /><br /><Typography.Text type="secondary" className="xs">{r.invoice.sellerName}</Typography.Text></> },
    { title: t.acceptance.colOrder, key: 'po', width: 130, render: (_, r) => <span className="mono">{r.poRef}</span> },
    { title: t.acceptance.colLines, key: 'lines', width: 90, responsive: ['md'], render: (_, r) => r.serviceLines },
    { title: t.acceptance.colAmount, key: 'amt', align: 'right', width: 150, sorter: (a, b) => a.invoice.totalAmount - b.invoice.totalAmount, render: (_, r) => <span className="nowrap">{fmtMoney(r.invoice.totalAmount)}</span> },
    { title: t.acceptance.colDue, key: 'due', width: 170, sorter: (a, b) => a.invoice.dueDate.localeCompare(b.invoice.dueDate), render: (_, r) => <Space size={8} wrap>{fmtDate(r.invoice.dueDate)}{r.dueSoon && <DueSoon />}</Space> },
    { title: <span className="sr">{t.common.actions}</span>, key: 'act', fixed: 'right', width: 110, render: (_, r) => <Button size="small" onClick={(e) => { e.stopPropagation(); setOpen(r); }}>{t.acceptance.review}</Button> },
  ];

  return (
    <>
      <PageHeader title={t.acceptance.title} meta={interpolate(t.acceptance.intro, { entity: session?.entityName ?? '' })} />
      {all.data && items.length > 0 && (
        <KpiRow span={8}>
          {[
            <Kpi key="w" title={t.acceptance.kWaiting} value={items.length} color={items.length > 0 ? TOKENS.warning : undefined} sub={fmtMoney(items.reduce((s, i) => s + i.invoice.totalAmount, 0))} />,
            <Kpi key="d" title={t.acceptance.kDue} value={dueCount} sub={items.filter((i) => i.dueSoon).map((i) => i.invoice.invoiceNumber).join(', ') || t.acceptance.kDueNone} />,
            oldest ? <Kpi key="o" title={t.acceptance.kOldest} value={fmtDate(oldest.invoice.receivedAt)} sub={oldest.invoice.invoiceNumber} /> : null,
          ]}
        </KpiRow>
      )}
      <Card styles={{ body: { padding: 0 } }}>
        <div className="toolbar" role="group" aria-label={t.acceptance.savedViews}>
          <Select
            aria-label={t.acceptance.supplier}
            style={{ minWidth: 240 }}
            value={supplierId}
            onChange={setSupplierId}
            options={[{ value: '', label: t.acceptance.allSuppliers }, ...(suppliers.data?.filter((s) => items.some((i) => i.invoice.supplierId === s.id)).map((s) => ({ value: s.id, label: s.name })) ?? [])]}
          />
          <Checkbox checked={dueSoon} onChange={(e) => setDueSoon(e.target.checked)}>{t.acceptance.dueOnly}</Checkbox>
          {filtered && <Button type="link" size="small" onClick={clear}>{t.common.clearFilters}</Button>}
        </div>
        <Async q={q} isEmpty={(d) => d.items.length === 0} empty={filtered && q.data?.totalAll ? <EmptyState title={t.acceptance.noMatch} action={<Button onClick={clear}>{t.common.clearFilters}</Button>} /> : <EmptyState title={t.acceptance.emptyTitle} text={t.acceptance.emptyText} />}>
          {(d) => (
            <>
              <Table<AcceptanceRow> size="middle" rowKey="id" columns={cols} dataSource={d.items} pagination={false} scroll={{ x: 760 }} sticky={{ offsetHeader: 56 }} onRow={(r) => ({ onClick: () => setOpen(r), style: { cursor: 'pointer' } })} />
              <Typography.Text type="secondary" className="xs" style={{ display: 'block', padding: '8px 16px 12px' }}>{interpolate(t.acceptance.counted, { n: d.items.length })}</Typography.Text>
            </>
          )}
        </Async>
      </Card>
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
      open
      title={t.acceptance.modalTitle}
      onCancel={onClose}
      maskClosable={!run.pending}
      keyboard={!run.pending}
      destroyOnHidden
      footer={
        <Space wrap>
          <Button onClick={onClose} disabled={run.pending}>{t.common.cancel}</Button>
          <Button danger onClick={() => submit('REJECT')} disabled={run.pending}>{t.acceptance.reject}</Button>
          <Button type="primary" loading={run.pending} onClick={() => submit('CONFIRM')}>{t.acceptance.confirm}</Button>
        </Space>
      }
    >
      <div className="modal-body">
        {creator && <Notice kind="warn" icon={<LockOutlined />}>{t.acceptance.creatorBlocked}</Notice>}
        <Descriptions colon={false} size="small" column={1} items={[
          { key: 'i', label: t.acceptance.invoice, children: <><InvNo value={item.invoice.invoiceNumber} />, {item.invoice.sellerName}</> },
          { key: 'o', label: t.acceptance.order, children: <span className="mono">{item.poRef}</span> },
          { key: 'l', label: t.acceptance.lines, children: item.serviceLines },
          { key: 'a', label: t.acceptance.amount, children: fmtMoney(item.invoice.totalAmount) },
          { key: 'd', label: t.acceptance.due, children: fmtDate(item.invoice.dueDate) },
        ]} />
        <Form layout="vertical">
          <Form.Item label={t.acceptance.note} extra={t.acceptance.noteHint} validateStatus={noteBad ? 'error' : undefined} help={noteBad ? t.acceptance.noteRequired : undefined}>
            <Input.TextArea rows={3} maxLength={500} showCount autoFocus value={note} onChange={(e) => setNote(e.target.value)} aria-label={t.acceptance.note} />
          </Form.Item>
        </Form>
        {!creator && <ActionError error={run.error} raw={run.rawError} />}
      </div>
    </Modal>
  );
}
