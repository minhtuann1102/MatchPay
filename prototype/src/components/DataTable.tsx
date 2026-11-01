import { useMemo, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { t } from '../i18n/vi';

export interface Col<R> {
  key: string;
  header: ReactNode;
  /** Plain-text header for the stacked (mobile) layout. */
  label?: string;
  render: (row: R) => ReactNode;
  sort?: (row: R) => string | number;
  className?: string;
}

interface Props<R> {
  columns: Col<R>[];
  rows: R[];
  rowKey: (r: R) => string;
  caption: string;
  onRowClick?: (r: R) => void;
  rowClass?: (r: R) => string | undefined;
  footer?: ReactNode;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
}

/** Compact table with sortable headers and optional row click. */
export function DataTable<R>({ columns, rows, rowKey, caption, onRowClick, rowClass, footer, initialSort }: Props<R>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null);
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!sort || !col?.sort) return rows;
    const f = col.sort;
    return [...rows].sort((a, b) => {
      const x = f(a);
      const y = f(b);
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'vi');
      return sort.dir === 'asc' ? r : -r;
    });
  }, [rows, sort, columns]);
  const toggle = (c: Col<R>) => {
    if (!c.sort) return;
    setSort((s) => (s?.key === c.key ? (s.dir === 'asc' ? { key: c.key, dir: 'desc' } : null) : { key: c.key, dir: 'asc' }));
  };
  return (
    <div className="tbl-wrap">
      <table className="tbl compact cards">
        <caption className="sr">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th key={c.key} className={c.className} aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sort ? (
                    <button type="button" className="th-sort" onClick={() => toggle(c)} title={t.common.sort}>
                      {c.header}
                      {active && <Icon name="chevron" small className={sort!.dir === 'asc' ? 'flip' : ''} />}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={rowKey(r)} className={`${onRowClick ? 'clickable' : ''} ${rowClass?.(r) ?? ''}`} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              {columns.map((c) => (
                <td key={c.key} className={c.className} data-l={c.label}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footer}
    </div>
  );
}

export function Pager({ total, page, pageSize, onPage }: { total: number; page: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="tbl-foot">
      <span>{t.common.showing.replace('{from}', String(from)).replace('{to}', String(to)).replace('{total}', String(total))}</span>
      {pages > 1 && (
        <span className="pagin">
          <button type="button" className="btn btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>{t.common.prev}</button>
          <span className="btn btn-sm cur" aria-current="page">{page}</span>
          <button type="button" className="btn btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>{t.common.next}</button>
        </span>
      )}
    </div>
  );
}
