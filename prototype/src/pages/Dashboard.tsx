import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DashboardData } from '../api/types';
import { useDashboard, useGroupDashboard } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { EmptyState, Field, PageHeader } from '../components/Bits';
import { Chip } from '../components/Chips';
import { t } from '../i18n/vi';
import { fmtNumber, fmtPercent, interpolate } from '../lib/format';

const periodLabel = (p: string): string => t.periodLabel(p);
const prevPeriod = (p: string): string => {
  const [y, m] = p.split('-').map(Number) as [number, number];
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
};

/** A figure that opens the invoice list when the role may read invoices (drill-down); Entity and Group Admin see counts only. */
function Fig({ to, children }: { to: string | null; children: React.ReactNode }) {
  return to ? <Link to={to}>{children}</Link> : <>{children}</>;
}

/** Horizontal bars in CSS; the oldest group is hatched. A table view is available for assistive technology and for exact numbers. */
function Bars({ title, rows, hatchLast, drill }: { title: string; rows: { label: string; count: number; figure: string }[]; hatchLast?: boolean; drill: (figure: string) => string | null }) {
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <section className="card">
      <div className="card-h"><h2>{title}</h2><button type="button" className="btn btn-quiet btn-sm" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>{asTable ? t.dashboard.viewChart : t.dashboard.viewTable}</button></div>
      <div className="card-b">
        {asTable ? (
          <table className="tbl compact"><caption className="sr">{title}</caption><thead><tr><th>{t.dashboard.colName}</th><th className="money">{t.dashboard.colCount}</th></tr></thead><tbody>{rows.map((r) => <tr key={r.figure}><td>{r.label}</td><td className="money">{r.count}</td></tr>)}</tbody></table>
        ) : (
          <div role="img" aria-label={`${title}. ${rows.map((r) => `${r.label}: ${r.count}`).join(', ')}`}>
            {rows.map((r, i) => (
              <div className="hbar" key={r.figure}>
                <span><Fig to={r.count ? drill(r.figure) : null}>{r.label}</Fig></span>
                <span className="track"><span className={`fill${hatchLast && i === rows.length - 1 && r.count ? ' hatch' : ''}`} style={{ width: `${(r.count / max) * 100}%` }} /></span>
                <span className="num">{r.count}</span>
              </div>
            ))}
          </div>
        )}
        <p className="xs muted" style={{ marginTop: 8 }}>{interpolate(t.dashboard.total, { n: total })}{hatchLast ? ` ${t.dashboard.oldestHatched}` : ''}</p>
      </div>
    </section>
  );
}

function Ring({ value, valid }: { value: number; valid: boolean }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={interpolate(t.dashboard.ring, { n: fmtPercent(value) })}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="#e6e8ee" strokeWidth="9" />
      <circle cx="44" cy="44" r={r} fill="none" stroke={valid ? 'var(--ok)' : 'var(--warn)'} strokeWidth="9" strokeDasharray={`${(Math.min(100, value) / 100) * c} ${c}`} transform="rotate(-90 44 44)" />
      <text x="44" y="49" textAnchor="middle" fontSize="15" fontWeight="600" fill="currentColor">{Math.round(value)}%</text>
    </svg>
  );
}

/** SCR-60 Dashboard: entity variant for finance roles and Entity Admin, per-entity table for Group Admin. */
export function Dashboard() {
  const { session } = useAuth();
  return session?.role === 'GROUP_ADMIN' ? <GroupDashboard /> : <EntityDashboard canDrill={session?.role !== 'ENTITY_ADMIN'} />;
}

function PeriodSelect({ base, value, onChange }: { base: string; value: string | undefined; onChange: (p: string | undefined) => void }) {
  const opts = [base, prevPeriod(base), prevPeriod(prevPeriod(base))];
  return (
    <Field label={t.dashboard.period} htmlFor="dash-period">
      <select id="dash-period" className="select" value={value ?? base} onChange={(e) => onChange(e.target.value === base ? undefined : e.target.value)}>
        {opts.map((p, i) => <option key={p} value={p}>{i === 0 ? interpolate(t.dashboard.periodCurrent, { p: periodLabel(p) }) : periodLabel(p)}</option>)}
      </select>
    </Field>
  );
}

function EntityDashboard({ canDrill }: { canDrill: boolean }) {
  const { session } = useAuth();
  const [period, setPeriod] = useState<string | undefined>(undefined);
  const [base, setBase] = useState<string | null>(null);
  const q = useDashboard(period);
  if (!base && q.data && !period) setBase(q.data.period);
  const drill = (figure: string) => (canDrill ? `/invoices?figure=${encodeURIComponent(figure)}&view=all` : null);
  return (
    <>
      <PageHeader title={t.dashboard.title} meta={interpolate(t.dashboard.introEntity, { entity: session?.entityName ?? '' })} actions={base ? <PeriodSelect base={base} value={period} onChange={setPeriod} /> : undefined} />
      <Async q={q} isEmpty={(d) => d.received === 0 && d.openExceptions === 0 && d.waitingForGoods === 0} empty={<section className="card"><EmptyState icon="bars" title={t.dashboard.emptyTitle} text={t.dashboard.emptyText} /></section>} skeletonRows={8}>
        {(d: DashboardData) => (
          <>
            <div className="grid-2">
              <section className="card">
                <div className="kpi">
                  <span className="lbl-top">{t.dashboard.touchless}</span>
                  <div className="row" style={{ gap: 16, flexWrap: 'nowrap' }}>
                    <Ring value={d.touchlessRate} valid={d.touchlessValid} />
                    <div className="stack" style={{ gap: 4 }}>
                      <span className="big">{fmtPercent(d.touchlessRate)}</span>
                      <Chip kind={d.touchlessValid ? 'ok' : 'exc'}>{d.touchlessValid ? t.dashboard.valid.split(':')[0]! : t.dashboard.notValid}</Chip>
                    </div>
                  </div>
                  <span className="xs muted">{interpolate(t.dashboard.touchlessSub, { n: d.touchless, base: d.touchlessBase })}</span>
                  {canDrill && <Link className="small" to={drill('touchless')!}>{interpolate(t.dashboard.openList, { n: d.touchless })}</Link>}
                </div>
              </section>
              <section className="card">
                <div className="kpi">
                  <span className="lbl-top">{t.dashboard.misplacement}</span>
                  <span className="big">{fmtPercent(d.misplacementRate)}</span>
                  <span className="xs muted">{interpolate(t.dashboard.misplacementSub, { e: d.sampleErrors, s: d.sampled })}</span>
                  <span className="xs muted">{t.dashboard.misplacementNote}</span>
                </div>
              </section>
            </div>
            <div className="kpis">
              <Link className="tile t-warn" to={drill('open-exceptions') ?? '#'} onClick={(e) => !canDrill && e.preventDefault()} aria-disabled={!canDrill}><span className="t-lbl">{t.dashboard.openExceptions}</span><span className="t-val">{d.openExceptions}</span><span className="t-sub">{t.dashboard.openExceptionsSub}</span></Link>
              <Link className="tile" to={drill('waiting-for-goods') ?? '#'} onClick={(e) => !canDrill && e.preventDefault()} aria-disabled={!canDrill}><span className="t-lbl">{t.dashboard.waiting}</span><span className="t-val">{d.waitingForGoods}</span><span className="t-sub">{t.dashboard.waitingSub}</span></Link>
              <div className="tile"><span className="t-lbl">{t.dashboard.received}</span><span className="t-val">{fmtNumber(d.received)}</span><span className="t-sub">{periodLabel(d.period)}</span></div>
            </div>
            <div className="grid-2">
              <Bars title={t.dashboard.byState} drill={drill} rows={d.byState.map((x) => ({ label: t.exceptionState[x.state], count: x.count, figure: `exc-${x.state.toLowerCase().replace(/_/g, '-')}` }))} />
              <Bars title={t.dashboard.byAge} drill={drill} hatchLast rows={d.byAge.map((x) => ({ label: t.dashboard.ages[x.bucket], count: x.count, figure: `age-${x.bucket}` }))} />
            </div>
          </>
        )}
      </Async>
    </>
  );
}

function GroupDashboard() {
  const [period, setPeriod] = useState<string | undefined>(undefined);
  const [base, setBase] = useState<string | null>(null);
  const q = useGroupDashboard(period);
  if (!base && q.data && !period) setBase(q.data.period);
  return (
    <>
      <PageHeader title={t.dashboard.title} meta={t.dashboard.introGroup} actions={base ? <PeriodSelect base={base} value={period} onChange={setPeriod} /> : undefined} />
      <Async q={q} isEmpty={(d) => d.rows.every((r) => r.received === 0 && r.openExceptions === 0 && r.waitingForGoods === 0)} empty={<section className="card"><EmptyState icon="bars" title={t.dashboard.emptyTitle} text={t.dashboard.emptyText} /></section>} skeletonRows={8}>
        {(d) => {
          const sum = (f: (r: (typeof d.rows)[number]) => number) => d.rows.reduce((s, r) => s + f(r), 0);
          return (
            <>
              <div className="kpis">
                <div className="tile"><span className="t-lbl">{t.dashboard.received}</span><span className="t-val">{fmtNumber(sum((r) => r.received))}</span><span className="t-sub">{interpolate(t.dashboard.receivedSub, { p: periodLabel(d.period) })}</span></div>
                <div className="tile t-warn"><span className="t-lbl">{t.dashboard.openExceptions}</span><span className="t-val">{sum((r) => r.openExceptions)}</span><span className="t-sub">{d.rows.map((r) => r.openExceptions).join(' + ')}</span></div>
                <div className="tile"><span className="t-lbl">{t.dashboard.waiting}</span><span className="t-val">{sum((r) => r.waitingForGoods)}</span><span className="t-sub">{d.rows.map((r) => r.waitingForGoods).join(' + ')}</span></div>
              </div>
              <section className="card">
                <div className="card-h"><h2>{interpolate(t.dashboard.eachEntity, { p: periodLabel(d.period) })}</h2><span className="xs muted">{t.dashboard.entitiesSub}</span></div>
                <div className="tbl-wrap">
                  <table className="tbl compact cards">
                    <caption className="sr">{t.dashboard.entities}</caption>
                    <thead><tr><th>{t.dashboard.colEntity}</th><th className="money">{t.dashboard.colReceived}</th><th>{t.dashboard.colTouchless}</th><th>{t.dashboard.colMis}</th><th className="money">{t.dashboard.colOpen}</th><th className="money">{t.dashboard.colWaiting}</th></tr></thead>
                    <tbody>
                      {d.rows.map((r) => (
                        <tr key={r.entityId}>
                          <td data-l={t.dashboard.colEntity}><b>{r.name}</b></td>
                          <td className="money" data-l={t.dashboard.colReceived}>{r.received}</td>
                          <td data-l={t.dashboard.colTouchless}><b>{fmtPercent(r.touchlessRate)}</b> <Chip kind={r.touchlessValid ? 'ok' : 'exc'}>{r.touchlessValid ? t.dashboard.valid.split(':')[0]! : t.dashboard.notValid}</Chip><span className="sub">{interpolate(t.dashboard.ofBase, { n: r.touchless, b: r.touchlessBase })}</span></td>
                          <td data-l={t.dashboard.colMis}><b>{fmtPercent(r.misplacementRate)}</b><span className="sub">{interpolate(t.dashboard.sampledOf, { e: r.sampleErrors, s: r.sampled })}</span></td>
                          <td className="money" data-l={t.dashboard.colOpen}>{r.openExceptions}</td>
                          <td className="money" data-l={t.dashboard.colWaiting}>{r.waitingForGoods}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          );
        }}
      </Async>
    </>
  );
}
