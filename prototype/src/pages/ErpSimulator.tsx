import { useState } from 'react';
import { confirmSimReceipt, createSimPurchaseOrder, type SimOrderRow } from '../api/sim';
import { useSimMaster, useSimOrders, useSimReceipts } from '../api/hooks';
import type { PoLine, SimPersonaKind, SimReceipt } from '../api/types';
import { Async } from '../components/Async';
import { EmptyState, Field, Notice, PageHeader, Tabs } from '../components/Bits';
import { Chip } from '../components/Chips';
import { DataTable, type Col } from '../components/DataTable';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { ActionError } from '../components/ReasonModal';
import { fmtDateTime, fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

type Tab = 'orders' | 'receipts';
const PERSONAS: SimPersonaKind[] = ['BUYER', 'WAREHOUSE_KEEPER', 'ACCEPTOR'];

/** SCR-80 ERP Simulator (Demo Operator), with SCR-81 (create purchase order) and SCR-82 (confirm receipt) as modals. */
export function ErpSimulator() {
  const master = useSimMaster();
  const [entityId, setEntityId] = useState('');
  const [tab, setTab] = useState<Tab>('orders');
  const [dlg, setDlg] = useState<null | 'po' | { receipt: SimOrderRow | null }>(null);
  const eid = entityId || master.data?.entities[0]?.id || '';
  const orders = useSimOrders(eid);
  const receipts = useSimReceipts(eid);
  const supplierName = (id: string) => master.data?.suppliers.find((s) => s.id === id)?.name ?? id;

  const oCols: Col<SimOrderRow>[] = [
    { key: 'id', label: t.erp.colPo, header: t.erp.colPo, sort: (p) => p.id, render: (p) => <b className="mono">{p.id}</b> },
    { key: 's', label: t.erp.colSupplier, header: t.erp.colSupplier, render: (p) => p.supplierName },
    { key: 'k', label: t.erp.colKind, header: t.erp.colKind, render: (p) => <Chip kind={p.kind === 'GOODS' ? 'open' : 'work'}>{t.erp.kinds[p.kind]}</Chip> },
    { key: 'l', label: t.erp.colLines, header: t.erp.colLines, render: (p) => p.lines.map((l) => `${l.item} x ${l.quantity} ${l.unit}, ${fmtMoney(l.price)}`).join('; ') },
    { key: 'q', label: t.erp.colQty, header: t.erp.colQty, render: (p) => <>{p.receivedQuantity} / {p.totalQuantity} {p.unit}{p.outstanding > 0 && <span className="sub">{interpolate(t.erp.outstanding, { n: p.outstanding })}</span>}</> },
    { key: 'b', label: t.erp.colBy, header: t.erp.colBy, render: (p) => <>{t.erp.personas[p.createdByPersona]}<span className="sub">{fmtDateTime(p.createdAt)}</span></> },
    { key: 'act', label: '', header: <span className="sr">{t.common.actions}</span>, className: 'row-act', render: (p) => (p.outstanding > 0 ? <button type="button" className="btn btn-sm" onClick={() => setDlg({ receipt: p })}>{t.erp.confirmReceipt}</button> : null) },
  ];
  const rCols: Col<SimReceipt>[] = [
    { key: 'id', label: t.erp.colGrn, header: t.erp.colGrn, sort: (r) => r.id, render: (r) => <b className="mono">{r.id}</b> },
    { key: 'po', label: t.erp.colPo, header: t.erp.colPo, render: (r) => <span className="mono">{r.poId}</span> },
    { key: 'q', label: t.erp.colQtyRecv, header: t.erp.colQtyRecv, className: 'money', render: (r) => r.quantity },
    { key: 'p', label: t.erp.colPersona, header: t.erp.colPersona, render: (r) => t.erp.personas[r.persona] },
    { key: 'n', label: t.erp.colNote, header: t.erp.colNote, render: (r) => r.note || '-' },
    { key: 'at', label: t.erp.colAt, header: t.erp.colAt, render: (r) => fmtDateTime(r.at) },
  ];

  return (
    <>
      <PageHeader
        title={t.erp.title}
        meta={<><span className="demo-mark">{t.erp.demoNote}</span> {t.erp.intro}</>}
        actions={<><button type="button" className="btn" onClick={() => setDlg({ receipt: null })} disabled={!orders.data?.some((o) => o.outstanding > 0)}>{t.erp.confirmReceipt}</button><button type="button" className="btn btn-primary" onClick={() => setDlg('po')}><Icon name="plus" />{t.erp.newOrder}</button></>}
      />
      <section className="card">
        <Async q={master} skeletonRows={3}>
          {(m) => (
            <>
              <div className="filters">
                <div className="field">
                  <label htmlFor="sim-ent" className="sr">{t.erp.entity}</label>
                  <select id="sim-ent" className="select" value={eid} onChange={(e) => setEntityId(e.target.value)}>
                    {m.entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <Tabs<Tab> label={t.erp.savedViews} value={tab} onChange={setTab} tabs={[{ id: 'orders', label: t.erp.tabs.orders, count: orders.data?.length }, { id: 'receipts', label: t.erp.tabs.receipts, count: receipts.data?.length }]} />
              {tab === 'orders' ? (
                <Async q={orders} isEmpty={(d) => d.length === 0} empty={<EmptyState icon="server" title={t.erp.emptyOrders} text={t.erp.emptyOrdersText} action={<button type="button" className="btn btn-primary" onClick={() => setDlg('po')}>{t.erp.newOrder}</button>} />}>
                  {(d) => <DataTable columns={oCols} rows={d} rowKey={(p) => p.id} caption={t.erp.tabs.orders} initialSort={{ key: 'id', dir: 'desc' }} />}
                </Async>
              ) : (
                <Async q={receipts} isEmpty={(d) => d.length === 0} empty={<EmptyState icon="stack" title={t.erp.emptyReceipts} text={t.erp.emptyReceiptsText} />}>
                  {(d) => <DataTable columns={rCols} rows={d} rowKey={(r) => r.id} caption={t.erp.tabs.receipts} initialSort={{ key: 'id', dir: 'desc' }} />}
                </Async>
              )}
            </>
          )}
        </Async>
      </section>
      {dlg === 'po' && master.data && <PoModal entityId={eid} suppliers={master.data.suppliers} onClose={() => setDlg(null)} />}
      {dlg && typeof dlg === 'object' && <ReceiptModal entityId={eid} orders={orders.data ?? []} preset={dlg.receipt} supplierName={supplierName} onClose={() => setDlg(null)} />}
    </>
  );
}

interface Line { item: string; quantity: string; unit: string; price: string }

function PoModal({ entityId, suppliers, onClose }: { entityId: string; suppliers: { id: string; name: string }[]; onClose: () => void }) {
  const [supplierId, setSupplierId] = useState('');
  const [kind, setKind] = useState<'GOODS' | 'SERVICE'>('GOODS');
  const [persona, setPersona] = useState<SimPersonaKind>('BUYER');
  const [lines, setLines] = useState<Line[]>([{ item: t.erp.defaultItem, quantity: '100', unit: t.erp.defaultUnit, price: '45000' }]);
  const [touched, setTouched] = useState(false);
  const save = useAction(() => createSimPurchaseOrder({ entityId, supplierId, kind, persona, lines: parsed }), { success: (po) => interpolate(t.erp.orderCreated, { po: po.id }), onSuccess: onClose });
  const parsed: PoLine[] = lines.map((l) => ({ item: l.item, quantity: Number(l.quantity.replace(',', '.')), unit: l.unit, price: Number(l.price.replace(/[^\d]/g, '')) }));
  const lineBad = (i: number) => !parsed[i]!.item.trim() || !(parsed[i]!.quantity > 0) || !(parsed[i]!.price > 0);
  const bad = !supplierId || lines.some((_, i) => lineBad(i));
  const setLine = (i: number, k: keyof Line, v: string) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  return (
    <Modal
      title={t.erp.orderTitle}
      large
      onClose={onClose}
      dismissable={!save.pending}
      onSubmit={() => { setTouched(true); if (bad) return; void save.run(undefined); }}
      footer={<><button type="button" className="btn" onClick={onClose} disabled={save.pending}>{t.common.cancel}</button><button type="submit" className="btn btn-primary" disabled={save.pending}>{save.pending && <span className="spin" />}{t.erp.create}</button></>}
    >
      <div className="grid-3">
        <Field label={`${t.erp.supplier} ${t.common.required}`} htmlFor="po-sup" error={touched && !supplierId ? t.common.chooseOne : null}>
          <select id="po-sup" className={`select${touched && !supplierId ? ' invalid' : ''}`} value={supplierId} onChange={(e) => setSupplierId(e.target.value)} data-autofocus>
            <option value="">{t.common.choose}</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label={t.erp.kind} htmlFor="po-kind"><select id="po-kind" className="select" value={kind} onChange={(e) => setKind(e.target.value as 'GOODS' | 'SERVICE')}><option value="GOODS">{t.erp.kinds.GOODS}</option><option value="SERVICE">{t.erp.kinds.SERVICE}</option></select></Field>
        <Field label={t.erp.persona} htmlFor="po-persona"><select id="po-persona" className="select" value={persona} onChange={(e) => setPersona(e.target.value as SimPersonaKind)}>{PERSONAS.map((p) => <option key={p} value={p}>{t.erp.personas[p]}</option>)}</select></Field>
      </div>
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend className="lbl">{t.erp.lines}</legend>
        <div className="stack">
          {lines.map((l, i) => (
            <div className="row" key={i} style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
              <div className="grow"><label className="sr" htmlFor={`po-item-${i}`}>{t.erp.item}</label><input id={`po-item-${i}`} className={`input${touched && lineBad(i) ? ' invalid' : ''}`} placeholder={t.erp.item} value={l.item} onChange={(e) => setLine(i, 'item', e.target.value)} /></div>
              <div style={{ width: 90 }}><label className="sr" htmlFor={`po-qty-${i}`}>{t.erp.qty}</label><input id={`po-qty-${i}`} className="input" inputMode="decimal" placeholder={t.erp.qty} value={l.quantity} onChange={(e) => setLine(i, 'quantity', e.target.value)} /></div>
              <div style={{ width: 80 }}><label className="sr" htmlFor={`po-unit-${i}`}>{t.erp.unit}</label><input id={`po-unit-${i}`} className="input" placeholder={t.erp.unit} value={l.unit} onChange={(e) => setLine(i, 'unit', e.target.value)} /></div>
              <div style={{ width: 130 }}><label className="sr" htmlFor={`po-price-${i}`}>{t.erp.price}</label><input id={`po-price-${i}`} className="input" inputMode="numeric" placeholder={t.erp.price} value={l.price} onChange={(e) => setLine(i, 'price', e.target.value)} /></div>
              {lines.length > 1 && <button type="button" className="btn btn-quiet btn-sm" aria-label={t.erp.removeLine} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}><Icon name="x" small /></button>}
            </div>
          ))}
          <div><button type="button" className="btn btn-sm" onClick={() => setLines((ls) => [...ls, { item: '', quantity: '', unit: t.erp.defaultUnit, price: '' }])}><Icon name="plus" small />{t.erp.addLine}</button></div>
        </div>
      </fieldset>
      {touched && bad && <Notice kind="err">{t.errors.LINE_INVALID}</Notice>}
      <ActionError error={save.error} raw={save.rawError} />
    </Modal>
  );
}

function ReceiptModal({ entityId, orders, preset, supplierName, onClose }: { entityId: string; orders: SimOrderRow[]; preset: SimOrderRow | null; supplierName: (id: string) => string; onClose: () => void }) {
  const open = orders.filter((o) => o.outstanding > 0);
  const [poId, setPoId] = useState(preset?.id ?? '');
  const [persona, setPersona] = useState<SimPersonaKind>('WAREHOUSE_KEEPER');
  const po = orders.find((o) => o.id === poId);
  const [qty, setQty] = useState(preset ? String(preset.outstanding) : '');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const quantity = Number(qty.replace(',', '.'));
  const save = useAction(() => confirmSimReceipt({ entityId, poId, persona, quantity, note }), { success: (r) => interpolate(t.erp.receiptCreated, { grn: r.id }), onSuccess: onClose });
  const bad = { po: !poId, qty: !(quantity > 0) };
  return (
    <Modal
      title={t.erp.receiptTitle}
      onClose={onClose}
      dismissable={!save.pending}
      onSubmit={() => { setTouched(true); if (bad.po || bad.qty) return; void save.run(undefined); }}
      footer={<><button type="button" className="btn" onClick={onClose} disabled={save.pending}>{t.common.cancel}</button><button type="submit" className="btn btn-primary" disabled={save.pending}>{save.pending && <span className="spin" />}{t.erp.confirmReceipt}</button></>}
    >
      <Field label={`${t.erp.order} ${t.common.required}`} htmlFor="rc-po" error={touched && bad.po ? t.errors.ORDER_REQUIRED : null}>
        <select id="rc-po" className={`select${touched && bad.po ? ' invalid' : ''}`} value={poId} onChange={(e) => { setPoId(e.target.value); const o = orders.find((x) => x.id === e.target.value); setQty(o ? String(o.outstanding) : ''); }} data-autofocus>
          <option value="">{t.common.choose}</option>
          {open.map((o) => <option key={o.id} value={o.id}>{o.id}, {supplierName(o.supplierId)}, {interpolate(t.erp.outstanding, { n: o.outstanding })}</option>)}
        </select>
      </Field>
      <div className="grid-2">
        <Field label={`${t.erp.quantity} ${t.common.required}`} htmlFor="rc-qty" hint={po ? interpolate(t.erp.outstanding, { n: po.outstanding }) : undefined} error={touched && bad.qty ? t.errors.LINE_INVALID : null}>
          <input id="rc-qty" className={`input${touched && bad.qty ? ' invalid' : ''}`} inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label={t.erp.colPersona} htmlFor="rc-persona" hint={po ? `${t.erp.colBy}: ${t.erp.personas[po.createdByPersona]}. ${t.erp.sameHint}` : t.erp.sameHint}>
          <select id="rc-persona" className="select" value={persona} onChange={(e) => setPersona(e.target.value as SimPersonaKind)}>{PERSONAS.map((p) => <option key={p} value={p}>{t.erp.personas[p]}</option>)}</select>
        </Field>
      </div>
      <Field label={t.erp.note} htmlFor="rc-note"><input id="rc-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <ActionError error={save.error} raw={save.rawError} />
    </Modal>
  );
}
