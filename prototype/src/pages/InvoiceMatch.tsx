import { useEffect, useRef, type ReactNode, type TdHTMLAttributes } from 'react';
import { Button, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { CloseCircleFilled } from '@ant-design/icons';
import type { InvoiceDetail, MatchCellState, MatchFieldRow, MatchLineRow, ThreeWayMatch } from '../api/types';
import { InvNo } from '../components/Bits';
import { StatusDot } from '../components/Tags';
import { fmtDate, fmtDecimal, fmtMoney, fmtNumber, interpolate } from '../lib/format';
import { t } from '../i18n/vi';

const M = t.detail.match;
const DASH = '\u2013';

const signed = (n: number): string => (n > 0 ? '+' : n < 0 ? '-' : '') + fmtNumber(Math.abs(n));
const pctText = (p: number): string => `${p > 0 ? '+' : p < 0 ? '-' : ''}${fmtDecimal(Math.abs(p), 1)}%`;

/** A cell attribute bag: the tint class for a rule failure, and data attributes that name the cell for checks and tests. */
function cellProps(cell: string, state: MatchCellState | undefined, lineNo?: number, extra: TdHTMLAttributes<HTMLTableCellElement> = {}, merged = false): TdHTMLAttributes<HTMLTableCellElement> {
  return {
    ...extra,
    className: [state === 'DIFF' ? 'cell-diff' : '', merged ? 'cell-merged' : ''].filter(Boolean).join(' ') || undefined,
    ...({ 'data-cell': cell, 'data-state': state, 'data-line': lineNo } as Record<string, unknown>),
  };
}

/** A value the sample data does not have: a grey dash and a small words, never red and never a made-up number. */
const Missing = ({ text = M.noData }: { text?: string }) => (
  <span className="cell-missing"><span aria-hidden="true">{DASH}</span><span className="cell-note">{text}</span></span>
);

/** The cell of a rule failure: an icon, the value in bold red, and the size of the difference in words (never color alone). */
const Diff = ({ value, sub, note }: { value: ReactNode; sub?: ReactNode; note: ReactNode }) => (
  <span className="diff-body">
    <span><CloseCircleFilled aria-hidden="true" /> {value}</span>
    {sub}
    <span className="cell-note">{note}</span>
  </span>
);

const condText = (n: number): string => interpolate(M.condition, { n });

/** SCR-12 tab "Three-way match" (D-222): the invoice, the order, and the receipt (or acceptance) side by side. */
export function ThreeWayMatchView({ d, focusLine, onGoLines }: { d: InvoiceDetail; focusLine: number | null; onGoLines: () => void }) {
  const m = d.match;
  const box = useRef<HTMLDivElement>(null);
  // Scroll the marked line into view when this view opens on it or the line changes.
  useEffect(() => {
    if (focusLine === null) return;
    box.current?.querySelector('tr.row-focus')?.scrollIntoView({ block: 'center' });
  }, [focusLine]);

  if (!m) return <Typography.Text type="secondary">{M.noOrder}</Typography.Text>;
  const service = m.docs[2]?.kind === 'ACCEPTANCE';
  const docTitle = { INVOICE: M.docInvoice, ORDER: M.docOrder, RECEIPT: M.docReceipt, ACCEPTANCE: M.docAcceptance };
  const noThird = service ? M.noAcceptance : M.noReceipt;
  const compared = m.lines.some((l) => l.result !== 'NO_DATA');

  return (
    <div className="stack match-view" ref={box}>
      <div className="match-docs">
        {m.docs.map((doc) => (
          <div className="match-doc" key={doc.kind}>
            <div className="match-doc-title">{docTitle[doc.kind]}</div>
            <div className="match-doc-ref">
              {doc.ref === null ? <Typography.Text type="secondary">{M.noDoc}</Typography.Text> : doc.kind === 'INVOICE' ? <InvNo value={doc.ref} /> : <span className="mono">{doc.ref}</span>}
            </div>
            <div className="match-doc-date">{doc.date ? fmtDate(doc.date) : '\u00A0'}</div>
          </div>
        ))}
      </div>

      <Typography.Text type="secondary">{interpolate(M.tolerance, { tol: String(m.tolerancePct).replace('.', ',') })}</Typography.Text>

      <div className="stack" style={{ gap: 8 }}>
        <Typography.Text strong>{M.fieldsTitle}</Typography.Text>
        <FieldsTable m={m} service={service} noThird={noThird} />
      </div>

      <div className="stack" style={{ gap: 8 }}>
        <Typography.Text strong>{M.linesTitle}</Typography.Text>
        <LinesTable m={m} service={service} noThird={noThird} focusLine={focusLine} onGoLines={onGoLines} />
        {!compared && <Typography.Text type="secondary">{M.noLines}</Typography.Text>}
      </div>

      <Typography.Text type="secondary" className="xs">{M.legend}</Typography.Text>
    </div>
  );
}

function FieldsTable({ m, service, noThird }: { m: ThreeWayMatch; service: boolean; noThird: string }) {
  const thirdMissing = m.docs[2]?.ref === null;
  const value = (v: string | null, fallback?: string): ReactNode => (v === null || v === '' ? <Missing text={fallback} /> : v);
  const cols: TableColumnsType<MatchFieldRow> = [
    { title: M.colField, key: 'field', width: 200, render: (_, r) => M.fields[r.field] },
    {
      title: M.colInvoice, key: 'inv',
      onCell: (r) => cellProps('field-invoice', r.state, undefined, {}),
      render: (_, r) => (r.state === 'DIFF' ? <Diff value={r.invoice} note={M.resDiffers} /> : value(r.invoice)),
    },
    {
      title: M.colOrder, key: 'ord',
      onCell: (r) => cellProps('field-order', r.state),
      render: (_, r) => (r.state === 'DIFF' ? <Diff value={r.order} note={M.resDiffers} /> : value(r.order)),
    },
    { title: service ? M.colAcceptance : M.colReceipt, key: 'rec', render: (_, r) => (thirdMissing ? <Missing text={noThird} /> : value(r.receipt)) },
    {
      title: M.colResult, key: 'res', width: 190,
      render: (_, r) => (r.state === 'OK' ? <StatusDot tone="success">{M.resMatches}</StatusDot>
        : r.state === 'DIFF' ? <><StatusDot tone="error">{M.resDiffers}</StatusDot><span className="cell-note">{condText(1)}</span></>
          : <StatusDot tone="neutral">{M.resNoData}</StatusDot>),
    },
  ];
  return <Table<MatchFieldRow> size="small" rowKey="field" columns={cols} dataSource={m.fields} pagination={false} scroll={{ x: 720 }} />;
}

function LinesTable({ m, service, noThird, focusLine, onGoLines }: { m: ThreeWayMatch; service: boolean; noThird: string; focusLine: number | null; onGoLines: () => void }) {
  // A row with no quantity data at all is merged into two sentences; an unidentified line merges the order and receipt cells into one.
  const noData = (r: MatchLineRow) => r.result === 'NO_DATA' && r.invoice.quantity === null;
  const mergeInvoice = (r: MatchLineRow) => noData(r);
  const mergeRest = (r: MatchLineRow) => noData(r) || r.result === 'UNIDENTIFIED';
  // Each document shows its own quantity and price first; when its unit is not the item unit, the converted value follows in small grey text.
  const convNote = (r: MatchLineRow, converted: number | null, factor: number, grey = false) => (factor !== 1 && converted !== null && r.baseUnit
    ? <span className={grey ? 'cell-note cell-sub cell-nw' : 'cell-note cell-nw'}>{interpolate(M.converted, { c: fmtNumber(converted), u: r.baseUnit })}</span> : null);
  const perUnitNote = (r: MatchLineRow, price: number | null, factor: number, grey = false) => (factor !== 1 && price !== null && r.baseUnit
    ? <span className={grey ? 'cell-note cell-sub cell-nw' : 'cell-note cell-nw'}>{interpolate(M.perUnit, { p: fmtNumber(price), u: r.baseUnit })}</span> : null);

  const cols: TableColumnsType<MatchLineRow> = [
    { title: '#', dataIndex: 'lineNo', key: 'no', width: 32 },
    {
      title: M.colItem, key: 'item', width: 130,
      render: (_, r) => (<>{r.invoiceText}{r.itemName && <><br /><Typography.Text type="secondary" className="xs">{r.itemName}</Typography.Text></>}</>),
    },
    {
      title: M.colInvoice, key: 'inv',
      children: [
        {
          title: M.colQty, key: 'iq', align: 'right', width: 96,
          onCell: (r) => cellProps('invoice-qty', undefined, r.lineNo, { colSpan: mergeInvoice(r) ? 2 : 1 }, mergeInvoice(r)),
          render: (_, r) => {
            if (mergeInvoice(r)) return <Missing />;
            if (r.invoice.quantity === null) return <Missing />;
            return (
              <>
                {fmtNumber(r.invoice.quantity)} {r.invoice.unit}
                {convNote(r, r.invoice.convertedQuantity, r.invoice.unitFactor)}
              </>
            );
          },
        },
        {
          title: M.colPrice, key: 'ip', align: 'right', width: 112,
          onCell: (r) => cellProps('invoice-price', r.price.state, r.lineNo, { colSpan: mergeInvoice(r) ? 0 : 1 }),
          render: (_, r) => {
            if (r.invoice.unitPrice === null) return <Missing />;
            const conv = perUnitNote(r, r.invoice.convertedUnitPrice, r.invoice.unitFactor, true);
            if (r.price.state === 'DIFF' && r.price.pct !== null) {
              return (
                <Diff
                  value={<span className="nowrap">{fmtMoney(r.invoice.unitPrice)}</span>}
                  sub={conv}
                  note={interpolate(M.priceOver, { pct: pctText(r.price.pct), tol: String(m.tolerancePct).replace('.', ',') })}
                />
              );
            }
            return (
              <>
                <span className="nowrap">{fmtMoney(r.invoice.unitPrice)}</span>{conv}
                {r.price.state === 'WITHIN' && r.price.pct !== null && <span className="cell-note">{interpolate(M.priceWithin, { pct: pctText(r.price.pct), tol: String(m.tolerancePct).replace('.', ',') })}</span>}
              </>
            );
          },
        },
        { title: M.colAmount, key: 'ia', align: 'right', width: 100, render: (_, r) => <span className="nowrap">{fmtMoney(r.invoice.amount)}</span> },
      ],
    },
    {
      title: M.colOrder, key: 'ord',
      children: [
        {
          title: M.colQty, key: 'oq', align: 'right', width: 84,
          onCell: (r) => cellProps('order-qty', r.qtyOrdered.state, r.lineNo, { colSpan: mergeRest(r) ? 3 : 1 }, mergeRest(r)),
          render: (_, r) => {
            if (r.result === 'UNIDENTIFIED') {
              return (
                <span className="cell-warn">
                  {interpolate(M.unidentified, { p: fmtDecimal(r.probability ?? 0) })}{' '}
                  <Button type="link" size="small" className="link-inline" onClick={onGoLines}>{M.goLines}</Button>
                </span>
              );
            }
            if (noData(r)) return <Missing />;
            if (!r.order) return <Missing />;
            return (
              <>
                {fmtNumber(r.order.quantity)} {r.order.unit}
                {convNote(r, r.order.convertedQuantity, r.order.unitFactor)}
                {r.qtyOrdered.state === 'WITHIN' && r.qtyOrdered.diff !== null && <span className="cell-note">{interpolate(M.vsOrder, { n: signed(r.qtyOrdered.diff), u: r.baseUnit ?? r.order.unit })}</span>}
              </>
            );
          },
        },
        {
          title: M.colPrice, key: 'op', align: 'right', width: 92,
          onCell: (r) => cellProps('order-price', undefined, r.lineNo, { colSpan: mergeRest(r) ? 0 : 1 }),
          render: (_, r) => (r.order ? <><span className="nowrap">{fmtMoney(r.order.unitPrice)}</span>{perUnitNote(r, r.order.convertedUnitPrice, r.order.unitFactor)}</> : <Missing />),
        },
      ],
    },
    {
      title: service ? M.colAcceptance : M.colReceipt, key: 'rec',
      children: [
        {
          title: M.colReceived, key: 'rq', align: 'right', width: 104,
          onCell: (r) => cellProps('received-qty', r.qtyReceived.state, r.lineNo, { colSpan: mergeRest(r) ? 0 : 1 }),
          render: (_, r) => {
            if (!r.order) return <Missing />;
            if (r.received === null) return <Typography.Text type="secondary" className="xs">{noThird}</Typography.Text>;
            if (r.qtyReceived.state === 'DIFF' && r.invoice.convertedQuantity !== null && r.receivedConverted !== null) {
              return (
                <Diff
                  value={<span className="nowrap">{fmtNumber(r.received)} {r.order.unit}</span>}
                  sub={convNote(r, r.receivedConverted, r.order.unitFactor, true)}
                  note={interpolate(M.receivedOver, { q: fmtNumber(r.invoice.convertedQuantity), r: fmtNumber(r.receivedConverted), u: r.baseUnit ?? r.order.unit })}
                />
              );
            }
            return <>{fmtNumber(r.received)} {r.order.unit}{convNote(r, r.receivedConverted, r.order.unitFactor)}</>;
          },
        },
      ],
    },
    {
      title: M.colResult, key: 'res', width: 128,
      render: (_, r) => {
        switch (r.result) {
          case 'MATCHES': return <StatusDot tone="success">{M.resMatches}</StatusDot>;
          case 'DIFFERS': return <><StatusDot tone="error">{M.resDiffers}</StatusDot><span className="cell-note">{condText(r.conditionNo ?? 3)}</span></>;
          case 'UNIDENTIFIED': return <><StatusDot tone="warning">{M.resUnidentified}</StatusDot><span className="cell-note">{condText(r.conditionNo ?? 2)}</span></>;
          case 'NO_RECEIPT': return <StatusDot tone="warning">{service ? M.resNoAcceptance : M.resNoReceipt}</StatusDot>;
          default: return <StatusDot tone="neutral">{M.resNoData}</StatusDot>;
        }
      },
    },
  ];

  return (
    <Table<MatchLineRow>
      size="small"
      rowKey="lineNo"
      columns={cols}
      dataSource={m.lines}
      pagination={false}
      scroll={{ x: 800 }}
      onRow={(r) => ({ className: r.lineNo === focusLine ? 'row-focus' : undefined, id: `match-line-${r.lineNo}`, 'aria-current': r.lineNo === focusLine ? 'true' : undefined })}
    />
  );
}
