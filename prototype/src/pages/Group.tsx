import { Link } from 'react-router-dom';
import type { GroupOverviewRow } from '../api/types';
import { useGroupOverview } from '../api/hooks';
import { Async } from '../components/Async';
import { EmptyState, PageHeader } from '../components/Bits';
import { Chip } from '../components/Chips';
import { DataTable, type Col } from '../components/DataTable';
import { fmtDateTime, fmtPercent, interpolate } from '../lib/format';
import { t } from '../i18n/vi';

/** SCR-75 Group Overview: one row per entity with gate counts, alerts and the last ERP sync. */
export function Group() {
  const q = useGroupOverview();
  const cols: Col<GroupOverviewRow>[] = [
    { key: 'n', label: t.group.colEntity, header: t.group.colEntity, sort: (r) => r.name, render: (r) => <><b>{r.name}</b><span className="sub">{t.entities.colTax}: {r.taxCode}</span></> },
    { key: 'g', label: t.group.colGates, header: t.group.colGates, render: (r) => interpolate(t.group.gatesValue, { o: r.openGates, c: r.closedGates }) },
    {
      key: 'a', label: t.group.colAlerts, header: t.group.colAlerts,
      render: (r) => (r.alerts.length === 0 ? <span className="muted">{t.group.noAlerts}</span> : <span className="stack" style={{ gap: 2 }}>{r.alerts.map((a) => <Chip key={a.supplierName} kind="exc">{interpolate(t.group.alertLine, { s: a.supplierName, rate: fmtPercent(a.rate), e: a.errors, n: a.sampled })}</Chip>)}</span>),
    },
    { key: 's', label: t.group.colSync, header: t.group.colSync, render: (r) => <>{fmtDateTime(r.lastSyncAt)} <Chip kind={r.lastSyncFailed ? 'bad' : 'ok'}>{r.lastSyncFailed ? t.group.syncFailed : t.group.syncOk}</Chip></> },
  ];
  const d = q.data ?? [];
  return (
    <>
      <PageHeader title={t.group.title} meta={t.group.intro} actions={<><Link className="btn" to="/group/entities">{t.group.manage}</Link><Link className="btn btn-primary" to="/group/gates">{t.group.openGates}</Link></>} />
      {d.length > 0 && (
        <div className="kpis">
          <div className="tile"><span className="t-lbl">{t.group.kEntities}</span><span className="t-val">{d.length}</span></div>
          <div className="tile"><span className="t-lbl">{t.group.kOpen}</span><span className="t-val">{d.reduce((s, r) => s + r.openGates, 0)}</span><span className="t-sub">{interpolate(t.group.gatesValue, { o: d.reduce((s, r) => s + r.openGates, 0), c: d.reduce((s, r) => s + r.closedGates, 0) })}</span></div>
          <Link className="tile t-warn" to="/group/gates?view=alerts"><span className="t-lbl">{t.group.kAlerts}</span><span className="t-val">{d.reduce((s, r) => s + r.alerts.length, 0)}</span><span className="t-sub">{t.group.kAlertsSub}</span></Link>
        </div>
      )}
      <section className="card">
        <Async q={q} isEmpty={(x) => x.length === 0} empty={<EmptyState icon="network" title={t.group.emptyTitle} text={t.group.emptyText} action={<Link className="btn btn-primary" to="/group/entities">{t.entities.add}</Link>} />}>
          {(rows) => <DataTable columns={cols} rows={rows} rowKey={(r) => r.entityId} caption={t.group.title} />}
        </Async>
      </section>
    </>
  );
}
