import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Col, Progress, Row, Select, Space, Table, Typography } from 'antd';
import { TableOutlined, BarChartOutlined } from '@ant-design/icons';
import type { DashboardData } from '../api/types';
import { useDashboard, useGroupDashboard } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { EmptyState, PageHeader } from '../components/Bits';
import { Kpi } from '../components/Kpi';
import { StatusDot } from '../components/Tags';
import { t } from '../i18n/vi';
import { TOKENS } from '../theme/theme';
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

/** Progress bars for a distribution; the oldest group (over 7 days) is drawn striped in the warning color. A table view gives exact numbers and works for assistive technology. */
function Bars({ title, rows, hatchLast, drill }: { title: string; rows: { label: string; count: number; figure: string }[]; hatchLast?: boolean; drill: (figure: string) => string | null }) {
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <Card
      title={title}
      style={{ height: '100%' }}
      extra={<Button type="text" size="small" icon={asTable ? <BarChartOutlined /> : <TableOutlined />} aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>{asTable ? t.dashboard.viewChart : t.dashboard.viewTable}</Button>}
    >
      {asTable ? (
        <Table size="small" pagination={false} rowKey="figure" dataSource={rows} columns={[{ title: t.dashboard.colName, dataIndex: 'label' }, { title: t.dashboard.colCount, dataIndex: 'count', align: 'right' }]} />
      ) : (
        <div role="img" aria-label={`${title}. ${rows.map((r) => `${r.label}: ${r.count}`).join(', ')}`} className="stack" style={{ gap: 10 }}>
          {rows.map((r, i) => {
            const oldest = hatchLast && i === rows.length - 1 && r.count > 0;
            return (
              <div className="bar-row" key={r.figure}>
                <span className="bar-label"><Fig to={r.count ? drill(r.figure) : null}>{r.label}</Fig></span>
                <Progress className={oldest ? 'bar-striped' : undefined} percent={(r.count / max) * 100} showInfo={false} strokeColor={oldest ? TOKENS.warning : TOKENS.primary} size={['100%', 10]} />
                <span className="bar-num">{r.count}</span>
              </div>
            );
          })}
        </div>
      )}
      <Typography.Text type="secondary" className="xs" style={{ display: 'block', marginTop: 12 }}>{interpolate(t.dashboard.total, { n: total })}{hatchLast ? ` ${t.dashboard.oldestHatched}` : ''}</Typography.Text>
    </Card>
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
    <Space>
      <span>{t.dashboard.period}</span>
      <Select
        aria-label={t.dashboard.period}
        style={{ minWidth: 220 }}
        value={value ?? base}
        onChange={(v) => onChange(v === base ? undefined : v)}
        options={opts.map((p, i) => ({ value: p, label: i === 0 ? interpolate(t.dashboard.periodCurrent, { p: periodLabel(p) }) : periodLabel(p) }))}
      />
    </Space>
  );
}

function EntityDashboard({ canDrill }: { canDrill: boolean }) {
  const { session } = useAuth();
  const nav = useNavigate();
  const [period, setPeriod] = useState<string | undefined>(undefined);
  const [base, setBase] = useState<string | null>(null);
  const q = useDashboard(period);
  if (!base && q.data && !period) setBase(q.data.period);
  const drill = (figure: string) => (canDrill ? `/invoices?figure=${encodeURIComponent(figure)}&view=all` : null);
  const go = (figure: string) => (canDrill ? () => nav(drill(figure)!) : undefined);
  return (
    <>
      <PageHeader title={t.dashboard.title} meta={interpolate(t.dashboard.introEntity, { entity: session?.entityName ?? '' })} actions={base ? <PeriodSelect base={base} value={period} onChange={setPeriod} /> : undefined} />
      <Async q={q} isEmpty={(d) => d.received === 0 && d.openExceptions === 0 && d.waitingForGoods === 0} empty={<Card><EmptyState title={t.dashboard.emptyTitle} text={t.dashboard.emptyText} /></Card>} skeletonRows={8}>
        {(d: DashboardData) => (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title={t.dashboard.touchless} style={{ height: '100%' }}>
                  <div className="stack" style={{ gap: 6 }}>
                    <Typography.Text style={{ fontSize: 28, fontWeight: 600 }}>{fmtPercent(d.touchlessRate)}</Typography.Text>
                    <Progress percent={Math.round(d.touchlessRate)} size="small" showInfo={false} strokeColor={d.touchlessValid ? TOKENS.success : TOKENS.warning} aria-label={interpolate(t.dashboard.ring, { n: fmtPercent(d.touchlessRate) })} />
                    <span><StatusDot tone={d.touchlessValid ? 'success' : 'warning'}>{d.touchlessValid ? t.dashboard.valid.split(':')[0]! : t.dashboard.notValid}</StatusDot></span>
                    <Typography.Text type="secondary" className="xs">{interpolate(t.dashboard.touchlessSub, { n: d.touchless, base: d.touchlessBase })}</Typography.Text>
                    {canDrill && <Link to={drill('touchless')!}>{interpolate(t.dashboard.openList, { n: d.touchless })}</Link>}
                  </div>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title={t.dashboard.misplacement} style={{ height: '100%' }}>
                  <div className="stack" style={{ gap: 6 }}>
                    <Typography.Text style={{ fontSize: 28, fontWeight: 600 }}>{fmtPercent(d.misplacementRate)}</Typography.Text>
                    <Typography.Text type="secondary">{interpolate(t.dashboard.misplacementSub, { e: d.sampleErrors, s: d.sampled })}</Typography.Text>
                    <Typography.Text type="secondary" className="xs">{t.dashboard.misplacementNote}</Typography.Text>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={12} lg={8}><Kpi title={t.dashboard.openExceptions} value={d.openExceptions} color={d.openExceptions > 0 ? TOKENS.warning : undefined} sub={t.dashboard.openExceptionsSub} onClick={go('open-exceptions')} /></Col>
              <Col xs={12} sm={12} lg={8}><Kpi title={t.dashboard.waiting} value={d.waitingForGoods} sub={t.dashboard.waitingSub} onClick={go('waiting-for-goods')} /></Col>
              <Col xs={12} sm={12} lg={8}><Kpi title={t.dashboard.received} value={fmtNumber(d.received)} sub={periodLabel(d.period)} /></Col>
              <Col xs={24} lg={12}><Bars title={t.dashboard.byState} drill={drill} rows={d.byState.map((x) => ({ label: t.exceptionState[x.state], count: x.count, figure: `exc-${x.state.toLowerCase().replace(/_/g, '-')}` }))} /></Col>
              <Col xs={24} lg={12}><Bars title={t.dashboard.byAge} drill={drill} hatchLast rows={d.byAge.map((x) => ({ label: t.dashboard.ages[x.bucket], count: x.count, figure: `age-${x.bucket}` }))} /></Col>
            </Row>
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
      <Async q={q} isEmpty={(d) => d.rows.every((r) => r.received === 0 && r.openExceptions === 0 && r.waitingForGoods === 0)} empty={<Card><EmptyState title={t.dashboard.emptyTitle} text={t.dashboard.emptyText} /></Card>} skeletonRows={8}>
        {(d) => {
          const sum = (f: (r: (typeof d.rows)[number]) => number) => d.rows.reduce((s, r) => s + f(r), 0);
          return (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={12} lg={8}><Kpi title={t.dashboard.received} value={fmtNumber(sum((r) => r.received))} sub={interpolate(t.dashboard.receivedSub, { p: periodLabel(d.period) })} /></Col>
                <Col xs={12} sm={12} lg={8}><Kpi title={t.dashboard.openExceptions} value={sum((r) => r.openExceptions)} color={sum((r) => r.openExceptions) > 0 ? TOKENS.warning : undefined} sub={d.rows.map((r) => r.openExceptions).join(' + ')} /></Col>
                <Col xs={12} sm={12} lg={8}><Kpi title={t.dashboard.waiting} value={sum((r) => r.waitingForGoods)} sub={d.rows.map((r) => r.waitingForGoods).join(' + ')} /></Col>
              </Row>
              <Card title={interpolate(t.dashboard.eachEntity, { p: periodLabel(d.period) })} extra={<Typography.Text type="secondary" className="xs">{t.dashboard.entitiesSub}</Typography.Text>} styles={{ body: { padding: 0 } }}>
                <Table
                  size="middle"
                  rowKey="entityId"
                  pagination={false}
                  dataSource={d.rows}
                  scroll={{ x: 760 }}
                  sticky={{ offsetHeader: 56 }}
                  columns={[
                    { title: t.dashboard.colEntity, key: 'n', render: (_, r) => <b>{r.name}</b> },
                    { title: t.dashboard.colReceived, key: 'r', align: 'right', render: (_, r) => r.received },
                    { title: t.dashboard.colTouchless, key: 't', render: (_, r) => <Space direction="vertical" size={2}><Space><b>{fmtPercent(r.touchlessRate)}</b><StatusDot tone={r.touchlessValid ? 'success' : 'warning'}>{r.touchlessValid ? t.dashboard.valid.split(':')[0]! : t.dashboard.notValid}</StatusDot></Space><Typography.Text type="secondary" className="xs">{interpolate(t.dashboard.ofBase, { n: r.touchless, b: r.touchlessBase })}</Typography.Text></Space> },
                    { title: t.dashboard.colMis, key: 'm', render: (_, r) => <><b>{fmtPercent(r.misplacementRate)}</b><br /><Typography.Text type="secondary" className="xs">{interpolate(t.dashboard.sampledOf, { e: r.sampleErrors, s: r.sampled })}</Typography.Text></> },
                    { title: t.dashboard.colOpen, key: 'o', align: 'right', render: (_, r) => r.openExceptions },
                    { title: t.dashboard.colWaiting, key: 'w', align: 'right', render: (_, r) => r.waitingForGoods },
                  ]}
                />
              </Card>
            </>
          );
        }}
      </Async>
    </>
  );
}
