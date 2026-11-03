import { useState } from 'react';
import { Button, Card, Drawer, Form, Input, InputNumber, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { confirmSimReceipt, createSimPurchaseOrder, type SimOrderRow } from '../api/sim';
import { useSimMaster, useSimOrders, useSimReceipts } from '../api/hooks';
import type { PoLine, SimPersonaKind, SimReceipt } from '../api/types';
import { Async } from '../components/Async';
import { Count, EmptyState, PageHeader } from '../components/Bits';
import { StatusDot } from '../components/Tags';
import { ActionError } from '../components/Dialogs';
import { MoneyInput } from '../components/Inputs';
import { fmtDateTime, fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

type Tab = 'orders' | 'receipts';
const PERSONAS: SimPersonaKind[] = ['BUYER', 'WAREHOUSE_KEEPER', 'ACCEPTOR'];

/** SCR-80 ERP Simulator (Demo Operator), with SCR-81 (create purchase order) and SCR-82 (confirm receipt) as drawers. */
export function ErpSimulator() {
  const master = useSimMaster();
  const [entityId, setEntityId] = useState('');
  const [tab, setTab] = useState<Tab>('orders');
  const [dlg, setDlg] = useState<null | 'po' | { receipt: SimOrderRow | null }>(null);
  const eid = entityId || master.data?.entities[0]?.id || '';
  const orders = useSimOrders(eid);
  const receipts = useSimReceipts(eid);
  const supplierName = (id: string) => master.data?.suppliers.find((s) => s.id === id)?.name ?? id;

  const oCols: TableColumnsType<SimOrderRow> = [
    { title: t.erp.colPo, key: 'id', width: 110, defaultSortOrder: 'descend', sorter: (a, b) => a.id.localeCompare(b.id), render: (_, p) => <b className="mono">{p.id}</b> },
    { title: t.erp.colSupplier, key: 's', width: 220, render: (_, p) => p.supplierName },
    { title: t.erp.colKind, key: 'k', width: 120, render: (_, p) => <Tag>{t.erp.kinds[p.kind]}</Tag> },
    { title: t.erp.colLines, key: 'l', width: 300, ellipsis: true, responsive: ['lg'], render: (_, p) => p.lines.map((l) => `${l.item} x ${l.quantity} ${l.unit}, ${fmtMoney(l.price)}`).join('; ') },
    { title: t.erp.colQty, key: 'q', width: 180, render: (_, p) => <>{p.receivedQuantity} / {p.totalQuantity} {p.unit}{p.outstanding > 0 && <><br /><Typography.Text type="secondary" className="xs">{interpolate(t.erp.outstanding, { n: p.outstanding })}</Typography.Text></>}</> },
    { title: t.erp.colBy, key: 'b', width: 190, responsive: ['md'], render: (_, p) => <>{t.erp.personas[p.createdByPersona]}<br /><Typography.Text type="secondary" className="xs">{fmtDateTime(p.createdAt)}</Typography.Text></> },
    { title: <span className="sr">{t.common.actions}</span>, key: 'act', fixed: 'right', width: 190, render: (_, p) => (p.outstanding > 0 ? <Button size="small" onClick={() => setDlg({ receipt: p })}>{t.erp.confirmReceipt}</Button> : null) },
  ];
  const rCols: TableColumnsType<SimReceipt> = [
    { title: t.erp.colGrn, key: 'id', width: 110, defaultSortOrder: 'descend', sorter: (a, b) => a.id.localeCompare(b.id), render: (_, r) => <b className="mono">{r.id}</b> },
    { title: t.erp.colPo, key: 'po', width: 110, render: (_, r) => <span className="mono">{r.poId}</span> },
    { title: t.erp.colQtyRecv, key: 'q', align: 'right', width: 110, render: (_, r) => r.quantity },
    { title: t.erp.colPersona, key: 'p', width: 170, render: (_, r) => t.erp.personas[r.persona] },
    { title: t.erp.colNote, key: 'n', width: 220, responsive: ['md'], render: (_, r) => r.note || '-' },
    { title: t.erp.colAt, key: 'at', width: 150, render: (_, r) => fmtDateTime(r.at) },
  ];

  return (
    <>
      <PageHeader
        title={t.erp.title}
        meta={<><StatusDot tone="warning">{t.erp.demoNote}</StatusDot> {t.erp.intro}</>}
        actions={<><Button onClick={() => setDlg({ receipt: null })} disabled={!orders.data?.some((o) => o.outstanding > 0)}>{t.erp.confirmReceipt}</Button><Button type="primary" icon={<PlusOutlined />} onClick={() => setDlg('po')}>{t.erp.newOrder}</Button></>}
      />
      <Card styles={{ body: { padding: 0 } }}>
        <Async q={master} skeletonRows={3}>
          {(m) => (
            <>
              <div className="toolbar">
                <Select aria-label={t.erp.entity} style={{ minWidth: 280 }} value={eid} onChange={setEntityId} options={m.entities.map((e) => ({ value: e.id, label: e.name }))} />
              </div>
              <Tabs
                className="view-tabs"
                aria-label={t.erp.savedViews}
                activeKey={tab}
                onChange={(k) => setTab(k as Tab)}
                items={[
                  { key: 'orders', label: <span>{t.erp.tabs.orders} <Count n={orders.data?.length} /></span> },
                  { key: 'receipts', label: <span>{t.erp.tabs.receipts} <Count n={receipts.data?.length} /></span> },
                ]}
              />
              {tab === 'orders' ? (
                <Async q={orders} isEmpty={(d) => d.length === 0} empty={<EmptyState title={t.erp.emptyOrders} text={t.erp.emptyOrdersText} action={<Button type="primary" onClick={() => setDlg('po')}>{t.erp.newOrder}</Button>} />}>
                  {(d) => <Table<SimOrderRow> size="middle" rowKey="id" columns={oCols} dataSource={d} pagination={{ pageSize: 20, hideOnSinglePage: true }} scroll={{ x: 800 }} sticky={{ offsetHeader: 56 }} />}
                </Async>
              ) : (
                <Async q={receipts} isEmpty={(d) => d.length === 0} empty={<EmptyState title={t.erp.emptyReceipts} text={t.erp.emptyReceiptsText} />}>
                  {(d) => <Table<SimReceipt> size="middle" rowKey="id" columns={rCols} dataSource={d} pagination={{ pageSize: 20, hideOnSinglePage: true }} scroll={{ x: 700 }} sticky={{ offsetHeader: 56 }} />}
                </Async>
              )}
            </>
          )}
        </Async>
      </Card>
      {dlg === 'po' && master.data && <PoDrawer entityId={eid} suppliers={master.data.suppliers} onClose={() => setDlg(null)} />}
      {dlg && typeof dlg === 'object' && <ReceiptDrawer entityId={eid} orders={orders.data ?? []} preset={dlg.receipt} supplierName={supplierName} onClose={() => setDlg(null)} />}
    </>
  );
}

interface PoValues { supplierId?: string; kind: 'GOODS' | 'SERVICE'; persona: SimPersonaKind; lines: { item?: string; quantity?: number; unit?: string; price?: number }[] }

function PoDrawer({ entityId, suppliers, onClose }: { entityId: string; suppliers: { id: string; name: string }[]; onClose: () => void }) {
  const [form] = Form.useForm<PoValues>();
  const save = useAction((v: PoValues) => createSimPurchaseOrder({ entityId, supplierId: v.supplierId!, kind: v.kind, persona: v.persona, lines: v.lines as PoLine[] }), { success: (po) => interpolate(t.erp.orderCreated, { po: po.id }), onSuccess: onClose });
  return (
    <Drawer
      open
      title={t.erp.orderTitle}
      width={640}
      onClose={onClose}
      maskClosable={!save.pending}
      destroyOnHidden
      footer={<Space><Button onClick={onClose} disabled={save.pending}>{t.common.cancel}</Button><Button type="primary" loading={save.pending} onClick={() => { void form.validateFields().then((v) => save.run(v)).catch(() => undefined); }}>{t.erp.create}</Button></Space>}
    >
      <Form form={form} layout="vertical" initialValues={{ kind: 'GOODS', persona: 'BUYER', lines: [{ item: t.erp.defaultItem, quantity: 100, unit: t.erp.defaultUnit, price: 45000 }] }}>
        <div className="form-grid">
          <Form.Item name="supplierId" label={t.erp.supplier} rules={[{ required: true, message: t.common.chooseOne }]}>
            <Select showSearch optionFilterProp="label" placeholder={t.common.choose} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
          <Form.Item name="kind" label={t.erp.kind}><Select options={[{ value: 'GOODS', label: t.erp.kinds.GOODS }, { value: 'SERVICE', label: t.erp.kinds.SERVICE }]} /></Form.Item>
          <Form.Item name="persona" label={t.erp.persona}><Select options={PERSONAS.map((p) => ({ value: p, label: t.erp.personas[p] }))} /></Form.Item>
        </div>
        <Typography.Text strong>{t.erp.lines}</Typography.Text>
        <Form.List name="lines">
          {(fields, { add, remove }) => (
            <div className="stack" style={{ marginTop: 8 }}>
              {fields.map((f) => (
                <div className="po-line" key={f.key}>
                  <Form.Item name={[f.name, 'item']} rules={[{ required: true, whitespace: true, message: t.errors.LINE_INVALID }]} noStyle><Input aria-label={t.erp.item} placeholder={t.erp.item} /></Form.Item>
                  <Form.Item name={[f.name, 'quantity']} rules={[{ required: true, type: 'number', min: 0.0001, message: t.errors.LINE_INVALID }]} noStyle><InputNumber<number> aria-label={t.erp.qty} placeholder={t.erp.qty} min={0} style={{ width: '100%' }} /></Form.Item>
                  <Form.Item name={[f.name, 'unit']} noStyle><Input aria-label={t.erp.unit} placeholder={t.erp.unit} /></Form.Item>
                  <Form.Item name={[f.name, 'price']} rules={[{ required: true, type: 'number', min: 1, message: t.errors.LINE_INVALID }]} noStyle><MoneyInput aria-label={t.erp.price} placeholder={t.erp.price} /></Form.Item>
                  {fields.length > 1 ? <Button type="text" icon={<CloseOutlined />} aria-label={t.erp.removeLine} onClick={() => remove(f.name)} /> : <span />}
                </div>
              ))}
              <div><Button icon={<PlusOutlined />} onClick={() => add({ item: '', unit: t.erp.defaultUnit })}>{t.erp.addLine}</Button></div>
            </div>
          )}
        </Form.List>
        <div style={{ marginTop: 12 }}><ActionError error={save.error} raw={save.rawError} /></div>
      </Form>
    </Drawer>
  );
}

function ReceiptDrawer({ entityId, orders, preset, supplierName, onClose }: { entityId: string; orders: SimOrderRow[]; preset: SimOrderRow | null; supplierName: (id: string) => string; onClose: () => void }) {
  const open = orders.filter((o) => o.outstanding > 0);
  const [form] = Form.useForm<{ poId?: string; quantity?: number; persona: SimPersonaKind; note?: string }>();
  const poId = Form.useWatch('poId', form);
  const po = orders.find((o) => o.id === poId);
  const save = useAction((v: { poId: string; persona: SimPersonaKind; quantity: number; note: string }) => confirmSimReceipt({ entityId, ...v }), { success: (r) => interpolate(t.erp.receiptCreated, { grn: r.id }), onSuccess: onClose });
  return (
    <Drawer
      open
      title={t.erp.receiptTitle}
      width={480}
      onClose={onClose}
      maskClosable={!save.pending}
      destroyOnHidden
      footer={<Space><Button onClick={onClose} disabled={save.pending}>{t.common.cancel}</Button><Button type="primary" loading={save.pending} onClick={() => { void form.validateFields().then((v) => save.run({ poId: v.poId!, persona: v.persona, quantity: v.quantity!, note: v.note ?? '' })).catch(() => undefined); }}>{t.erp.confirmReceipt}</Button></Space>}
    >
      <Form form={form} layout="vertical" initialValues={{ poId: preset?.id, quantity: preset?.outstanding, persona: 'WAREHOUSE_KEEPER' }}>
        <Form.Item name="poId" label={t.erp.order} rules={[{ required: true, message: t.errors.ORDER_REQUIRED }]}>
          <Select
            placeholder={t.common.choose}
            showSearch
            optionFilterProp="label"
            onChange={(id) => form.setFieldValue('quantity', orders.find((x) => x.id === id)?.outstanding)}
            options={open.map((o) => ({ value: o.id, label: `${o.id}, ${supplierName(o.supplierId)}, ${interpolate(t.erp.outstanding, { n: o.outstanding })}` }))}
          />
        </Form.Item>
        <Form.Item name="quantity" label={t.erp.quantity} extra={po ? interpolate(t.erp.outstanding, { n: po.outstanding }) : undefined} rules={[{ required: true, type: 'number', min: 0.0001, message: t.errors.LINE_INVALID }]}>
          <InputNumber<number> min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="persona" label={t.erp.colPersona} extra={po ? `${t.erp.colBy}: ${t.erp.personas[po.createdByPersona]}. ${t.erp.sameHint}` : t.erp.sameHint}>
          <Select options={PERSONAS.map((p) => ({ value: p, label: t.erp.personas[p] }))} />
        </Form.Item>
        <Form.Item name="note" label={t.erp.note}><Input /></Form.Item>
        <ActionError error={save.error} raw={save.rawError} />
      </Form>
    </Drawer>
  );
}
