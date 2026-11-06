import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Button, Modal, Segmented } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { InvoiceDetail, MarkTarget, MatchDocKind, MatchField, MatchMark, ThreeWayMatch } from '../api/types';
import { InvNo } from '../components/Bits';
import { StatusDot } from '../components/Tags';
import { fmtDateTime, fmtNumber, interpolate } from '../lib/format';
import { t } from '../i18n/vi';

const P = t.detail.matchPopup;
const S = P.sheet;
const DOC_ORDER: MatchDocKind[] = ['INVOICE', 'ORDER', 'RECEIPT'];
const DASH = '\u2013';
const WIDE_QUERY = '(min-width: 992px)';

const num = (n: number | null): string => (n === null ? '' : fmtNumber(n));
const dateLine = (iso: string | null): string => {
  if (!iso) return '';
  const [y, mo, da] = iso.slice(0, 10).split('-');
  return interpolate(S.dateLine, { d: Number(da), m: Number(mo), y: y ?? '' });
};
const issueText = (k: MatchMark): string => P.issue(k.issue.code, k.issue.params);

/** True from 992 px up; read once at the first render so the first paint already has the right layout. */
function useWide(): boolean {
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(WIDE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const on = (): void => setWide(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

// ---------- Marks on the sheets ----------
type Where = { field: MatchField } | { lineNo: number; cell: 'item' | 'quantity' | 'unitPrice' | 'received' };
const hits = (tg: MarkTarget, doc: MatchDocKind, at: Where): boolean =>
  tg.doc === doc && ('field' in at ? 'field' in tg && tg.field === at.field : 'lineNo' in tg && tg.lineNo === at.lineNo && tg.cell === at.cell);

const MarkCtx = createContext<{ marks: MatchMark[]; selected: number | null }>({ marks: [], selected: null });

/** A value on a sheet. When a mark points at it the value is boxed, numbered, and labelled with the issue text; the box is never the only signal. */
function Mk({ doc, at, children }: { doc: MatchDocKind; at: Where; children: ReactNode }) {
  const { marks, selected } = useContext(MarkCtx);
  const found = marks.filter((k) => k.targets.some((tg) => hits(tg, doc, at)));
  return (
    <>
      {found.reduceRight<ReactNode>((inner, k) => (
        <span
          className={`doc-mark doc-mark-${k.tone}${k.no === selected ? ' doc-mark-selected' : ''}`}
          id={`mark-${k.no}-${doc}`}
          role="group"
          aria-label={issueText(k)}
          data-mark={k.no}
        >
          {inner}
          <sup className="doc-mark-no">{k.no}</sup>
        </span>
      ), children)}
    </>
  );
}

// ---------- The three sheets ----------
function InvoiceSheet({ d, m }: { d: InvoiceDetail; m: ThreeWayMatch }) {
  const inv = d.invoice;
  const net = inv.totalAmount - inv.vatAmount;
  const rate = net > 0 ? Math.round((inv.vatAmount / net) * 100) : null;
  const buyerNote = m.notes[0];
  return (
    <article className="doc-sheet" aria-label={P.docNames.INVOICE}>
      <h3 className="doc-title">{S.invoiceTitle}</h3>
      <div className="doc-sub">{S.symbol}: <b>{inv.series}</b><span className="doc-gap">{S.number}: <b>{inv.number}</b></span></div>
      <div className="doc-sub">{dateLine(inv.invoiceDate)}</div>

      <div className="doc-block">
        <div className="doc-label">{S.seller}</div>
        <div>{S.name}: <Mk doc="INVOICE" at={{ field: 'SUPPLIER' }}>{inv.sellerName}</Mk></div>
        <div>{S.taxCode}: {inv.sellerTaxCode ? <Mk doc="INVOICE" at={{ field: 'SUPPLIER_TAX' }}>{inv.sellerTaxCode}</Mk> : DASH}</div>
      </div>
      <div className="doc-block">
        <div className="doc-label">{S.buyer}</div>
        <div>
          {S.name}: {buyerNote
            ? <span className="doc-note" role="note" tabIndex={0} aria-label={P.note(buyerNote.code, buyerNote.params)} title={P.note(buyerNote.code, buyerNote.params)}>{inv.buyerName}</span>
            : inv.buyerName}
        </div>
        <div>{S.taxCode}: <Mk doc="INVOICE" at={{ field: 'BUYER_TAX' }}>{inv.buyerTaxCode}</Mk></div>
      </div>
      <div className="doc-block">
        <div>{S.orderNo}: {inv.poRef ? <Mk doc="INVOICE" at={{ field: 'ORDER_REF' }}>{inv.poRef}</Mk> : DASH}</div>
      </div>

      <table className="doc-table">
        <thead>
          <tr>
            <th scope="col" className="doc-c-no">{S.colNo}</th><th scope="col">{S.colInvoiceItem}</th><th scope="col" className="doc-c-unit">{S.colUnit}</th>
            <th scope="col" className="doc-c-qty">{S.colQty}</th><th scope="col" className="doc-c-price">{S.colPrice}</th><th scope="col" className="doc-c-amt">{S.colAmount}</th>
          </tr>
        </thead>
        <tbody>
          {inv.lines.map((l) => (
            <tr key={l.lineNo}>
              <td className="doc-c-no">{l.lineNo}</td>
              <td><Mk doc="INVOICE" at={{ lineNo: l.lineNo, cell: 'item' }}>{l.text}</Mk></td>
              <td className="doc-c-unit">{l.unit ?? ''}</td>
              <td className="num"><Mk doc="INVOICE" at={{ lineNo: l.lineNo, cell: 'quantity' }}>{num(l.quantity ?? null)}</Mk></td>
              <td className="num"><Mk doc="INVOICE" at={{ lineNo: l.lineNo, cell: 'unitPrice' }}>{num(l.unitPrice ?? null)}</Mk></td>
              <td className="num">{fmtNumber(l.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={5}>{S.subtotal}</td><td className="num">{fmtNumber(net)}</td></tr>
          <tr>
            <td colSpan={5}>{rate !== null && <span className="doc-gap-after">{interpolate(S.vatRate, { rate })}</span>}{S.vatAmount}</td>
            <td className="num">{fmtNumber(inv.vatAmount)}</td>
          </tr>
          <tr className="doc-total"><td colSpan={5}>{S.total}</td><td className="num">{fmtNumber(inv.totalAmount)}</td></tr>
        </tfoot>
      </table>
    </article>
  );
}

function OrderSheet({ m }: { m: ThreeWayMatch }) {
  const o = m.order;
  if (!o) return null;
  return (
    <article className="doc-sheet" aria-label={P.docNames.ORDER}>
      <h3 className="doc-title">{S.orderTitle}</h3>
      <div className="doc-sub">{S.number}: <Mk doc="ORDER" at={{ field: 'ORDER_REF' }}><b>{o.ref}</b></Mk></div>
      <div className="doc-sub">{dateLine(o.date)}</div>

      <div className="doc-block">
        <div className="doc-label">{S.buyerParty}</div>
        <div>{S.name}: {o.buyerName}</div>
        <div>{S.taxCode}: <Mk doc="ORDER" at={{ field: 'BUYER_TAX' }}>{o.buyerTaxCode}</Mk></div>
      </div>
      <div className="doc-block">
        <div className="doc-label">{S.supplierParty}</div>
        <div>{S.name}: <Mk doc="ORDER" at={{ field: 'SUPPLIER' }}>{o.supplierName}</Mk></div>
        <div>{S.taxCode}: {o.supplierTaxCode ? <Mk doc="ORDER" at={{ field: 'SUPPLIER_TAX' }}>{o.supplierTaxCode}</Mk> : DASH}</div>
      </div>

      <table className="doc-table">
        <thead>
          <tr>
            <th scope="col" className="doc-c-no">{S.colNo}</th><th scope="col">{S.colItem}</th><th scope="col" className="doc-c-unit">{S.colUnit}</th>
            <th scope="col" className="doc-c-qty">{S.colQty}</th><th scope="col" className="doc-c-price">{S.colPrice}</th><th scope="col" className="doc-c-amt">{S.colAmount}</th>
          </tr>
        </thead>
        <tbody>
          {o.lines.map((l) => (
            <tr key={l.lineNo}>
              <td className="doc-c-no">{l.lineNo}</td>
              <td><Mk doc="ORDER" at={{ lineNo: l.lineNo, cell: 'item' }}>{l.item}</Mk></td>
              <td className="doc-c-unit">{l.unit}</td>
              <td className="num"><Mk doc="ORDER" at={{ lineNo: l.lineNo, cell: 'quantity' }}>{num(l.quantity)}</Mk></td>
              <td className="num"><Mk doc="ORDER" at={{ lineNo: l.lineNo, cell: 'unitPrice' }}>{num(l.unitPrice)}</Mk></td>
              <td className="num">{num(l.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="doc-total"><td colSpan={5}>{S.orderTotal}</td><td className="num">{fmtNumber(o.total)}</td></tr>
        </tfoot>
      </table>
    </article>
  );
}

function ReceiptSheet({ m }: { m: ThreeWayMatch }) {
  const r = m.receipt;
  const o = m.order;
  const acceptance = m.docs[2]?.kind === 'ACCEPTANCE';
  const title = acceptance ? S.acceptanceTitle : S.receiptTitle;
  const name = acceptance ? P.docNames.ACCEPTANCE : P.docNames.RECEIPT;
  if (!r || !o) {
    return (
      <article className="doc-sheet" aria-label={name}>
        <h3 className="doc-title">{title}</h3>
        <p className="doc-none">{acceptance ? S.noAcceptance : S.noReceipt}</p>
      </article>
    );
  }
  return (
    <article className="doc-sheet" aria-label={name}>
      <h3 className="doc-title">{title}</h3>
      <div className="doc-sub">{S.number}: <b>{r.ref}</b></div>
      <div className="doc-sub">{dateLine(r.date)}</div>

      <div className="doc-block">
        <div>{S.byOrder}: <Mk doc="RECEIPT" at={{ field: 'ORDER_REF' }}>{r.orderRef}</Mk></div>
      </div>
      <div className="doc-block">
        <div className="doc-label">{S.supplierParty}</div>
        <div>{S.name}: <Mk doc="RECEIPT" at={{ field: 'SUPPLIER' }}>{r.supplierName}</Mk></div>
        <div>{S.taxCode}: {o.supplierTaxCode ? <Mk doc="RECEIPT" at={{ field: 'SUPPLIER_TAX' }}>{o.supplierTaxCode}</Mk> : DASH}</div>
      </div>
      <div className="doc-block">
        <div className="doc-label">{S.receiver}</div>
        <div>{S.name}: {o.buyerName}</div>
        <div>{S.taxCode}: <Mk doc="RECEIPT" at={{ field: 'BUYER_TAX' }}>{o.buyerTaxCode}</Mk></div>
      </div>

      <table className="doc-table">
        <thead>
          <tr>
            <th scope="col" className="doc-c-no">{S.colNo}</th><th scope="col">{S.colItem}</th><th scope="col" className="doc-c-unit">{S.colUnit}</th>
            <th scope="col" className="doc-c-rq">{S.colOrdered}</th><th scope="col" className="doc-c-rr">{acceptance ? S.colAccepted : S.colReceived}</th>
          </tr>
        </thead>
        <tbody>
          {r.lines.map((l) => (
            <tr key={l.lineNo}>
              <td className="doc-c-no">{l.lineNo}</td>
              <td>{l.item}</td>
              <td className="doc-c-unit">{l.unit}</td>
              <td className="num">{fmtNumber(l.ordered)}</td>
              <td className="num"><Mk doc="RECEIPT" at={{ lineNo: l.lineNo, cell: 'received' }}>{fmtNumber(l.received)}</Mk></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="doc-sign">
        <div className="doc-sign-label">{acceptance ? S.acceptorSign : S.receiverSign}</div>
        <div className="doc-sign-name">{r.confirmedBy ?? '\u00A0'}</div>
      </div>
    </article>
  );
}

// ---------- The popup ----------
const docsOf = (k: MatchMark | undefined): MatchDocKind[] => (k ? DOC_ORDER.filter((doc) => k.targets.some((tg) => tg.doc === doc)) : []);

/**
 * The three-way match popup (D-222 pilot): the invoice, the order, and the receipt (or acceptance) laid out like the paper documents, with the values that
 * break a rule boxed in red and numbered. The selected mark and the open state live in the URL of the detail page; the page passes them in.
 */
export function MatchDocsModal({ d, m, open, selected, onSelect, onClose }: {
  d: InvoiceDetail;
  m: ThreeWayMatch;
  open: boolean;
  selected: number | null;
  onSelect: (no: number) => void;
  onClose: () => void;
}) {
  const wide = useWide();
  const acceptance = m.docs[2]?.kind === 'ACCEPTANCE';
  const thirdKind = acceptance ? 'ACCEPTANCE' : 'RECEIPT';
  const [active, setActive] = useState<MatchDocKind>(() => docsOf(m.marks.find((k) => k.no === selected))[0] ?? 'INVOICE');
  const [shown, setShown] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Under 992 px one document is visible: selecting a mark shows the first document that carries it.
  useEffect(() => {
    const first = docsOf(m.marks.find((k) => k.no === selected))[0];
    if (first) setActive(first);
  }, [m, selected]);

  // Once the open animation has finished, and whenever the mark or the layout changes, bring the marked value to the middle of each column that holds it.
  // The columns are scrolled directly (not scrollIntoView) so the modal body and the page never move.
  useEffect(() => {
    if (!open || !shown || selected === null) return undefined;
    const frame = window.requestAnimationFrame(() => {
      for (const doc of DOC_ORDER) {
        const el = document.getElementById(`mark-${selected}-${doc}`);
        const box = el?.closest<HTMLElement>('.match-col-scroll');
        if (!el || !box) continue;
        const a = el.getBoundingClientRect();
        const b = box.getBoundingClientRect();
        // Scroll only when the value is not fully in view (with room for its number badge), and then put it in the middle.
        const room = 16;
        if (a.top < b.top + room || a.bottom > b.bottom - room) box.scrollTop += a.top - b.top - box.clientHeight / 2 + a.height / 2;
        if (a.left < b.left + room || a.right > b.right - room) box.scrollLeft += a.left - b.left - box.clientWidth / 2 + a.width / 2;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, shown, selected, wide, active]);

  const allCompared = !!m.receipt && m.lines.every((l) => l.result === 'MATCHES');
  // Clicking a mark row also shows the first document that carries it, even when that mark was already selected.
  const pick = (no: number): void => {
    const first = docsOf(m.marks.find((k) => k.no === no))[0];
    if (first) setActive(first);
    onSelect(no);
  };
  // Under 992 px the strip shows only the selected row; the other rows, the note, and the legend are behind "show all".
  const compact = !wide;
  const full = !compact || expanded;
  const rows = full ? m.marks : m.marks.filter((k) => k.no === selected);
  const countOn = (doc: MatchDocKind): number => m.marks.filter((k) => k.targets.some((tg) => tg.doc === doc)).length;

  const label = (doc: MatchDocKind): string => {
    if (doc === 'ORDER') return interpolate(P.source.ORDER, { time: fmtDateTime(m.order?.syncedAt ?? null) });
    return P.source[doc === 'RECEIPT' ? thirdKind : 'INVOICE'] ?? '';
  };
  const sheet = (doc: MatchDocKind): ReactNode => (doc === 'INVOICE' ? <InvoiceSheet d={d} m={m} /> : doc === 'ORDER' ? <OrderSheet m={m} /> : <ReceiptSheet m={m} />);
  const column = (doc: MatchDocKind): ReactNode => (
    <section className="match-col" key={doc} aria-label={label(doc)}>
      <div className="match-col-label">{label(doc)}</div>
      <div className="match-col-scroll" tabIndex={0} role="region" aria-label={label(doc)}>{sheet(doc)}</div>
    </section>
  );

  return (
    <Modal
      open={open}
      title={<>{P.title} {'\u00B7'} <InvNo value={d.invoice.invoiceNumber} /></>}
      width="min(1440px, 96vw)"
      style={{ top: 16 }}
      styles={{ body: { height: 'calc(100vh - 160px)' } }}
      className="match-modal"
      onCancel={onClose}
      afterOpenChange={setShown}
      closable={{ 'aria-label': P.close }}
      footer={<Button onClick={onClose}>{P.close}</Button>}
      destroyOnHidden
    >
      <MarkCtx.Provider value={{ marks: m.marks, selected }}>
        <div className="match-popup">
          <section className={`match-issues${compact ? ' match-issues-compact' : ''}${compact && expanded ? ' match-issues-open' : ''}`} aria-label={P.issuesLabel}>
            {m.marks.length === 0 ? (
              <div className="match-ok"><StatusDot tone={allCompared ? 'success' : 'neutral'}>{allCompared ? P.allMatch : P.partial}</StatusDot></div>
            ) : (
              <ol className="match-issue-list">
                {rows.map((k) => (
                  <li key={k.no}>
                    <button type="button" className="match-issue" aria-current={k.no === selected ? 'true' : undefined} onClick={() => pick(k.no)}>
                      <span className={`match-no match-no-${k.tone}`}>{k.no}<span className="sr"> {P.tone[k.tone]}</span></span>
                      <span className="match-issue-text">{issueText(k)}</span>
                      <span className="match-issue-cond">{interpolate(P.condition, { n: k.conditionNo })}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
            {full && m.notes.map((n) => (
              <div className="match-note" key={n.code}><InfoCircleOutlined aria-hidden="true" /><span>{P.note(n.code, n.params)}</span></div>
            ))}
            {full && <div className="match-legend">{P.legend}</div>}
            {compact && (
              <Button type="link" size="small" className="match-toggle" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
                {expanded ? P.collapse : m.marks.length > 0 ? interpolate(P.showAll, { n: m.marks.length }) : P.showLegend}
              </Button>
            )}
          </section>

          {wide ? (
            <div className="match-cols">{DOC_ORDER.map(column)}</div>
          ) : (
            <>
              <Segmented
                block
                className="match-seg"
                aria-label={P.pickDocument}
                value={active}
                onChange={(v) => setActive(v as MatchDocKind)}
                options={DOC_ORDER.map((doc) => ({
                  value: doc,
                  label: <span>{P.docShort[doc === 'RECEIPT' ? thirdKind : doc]}{countOn(doc) > 0 && <span className="count count-err">{countOn(doc)}</span>}</span>,
                }))}
              />
              <div className="match-cols match-cols-one">{column(active)}</div>
            </>
          )}
        </div>
      </MarkCtx.Provider>
    </Modal>
  );
}
