import { Link } from 'react-router-dom';
import { Button, Card, Col, Row, Space, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type { GroupOverviewRow } from '../api/types';
import { useGroupOverview } from '../api/hooks';
import { Async } from '../components/Async';
import { EmptyState, PageHeader } from '../components/Bits';
import { Kpi } from '../components/Kpi';
import { StatusDot } from '../components/Tags';
import { fmtDateTime, fmtPercent, interpolate } from '../lib/format';
import { useNavigate } from 'react-router-dom';
import { t } from '../i18n/vi';
import { TOKENS } from '../theme/theme';

/** SCR-75 Group Overview: one row per entity with gate counts, alerts and the last ERP sync. */
export function Group() {
  const q = useGroupOverview();
  const nav = useNavigate();
  const cols: TableColumnsType<GroupOverviewRow> = [
    { title: t.group.colEntity, key: 'n', width: 260, sorter: (a, b) => a.name.localeCompare(b.name, 'vi'), render: (_, r) => <><b>{r.name}</b><br /><Typography.Text type="secondary" className="xs">{t.entities.colTax}: {r.taxCode}</Typography.Text></> },
    { title: t.group.colGates, key: 'g', width: 200, render: (_, r) => interpolate(t.group.gatesValue, { o: r.openGates, c: r.closedGates }) },
    {
      title: t.group.colAlerts, key: 'a', width: 320,
      render: (_, r) => (r.alerts.length === 0 ? <Typography.Text type="secondary">{t.group.noAlerts}</Typography.Text> : <Space direction="vertical" size={4}>{r.alerts.map((a) => <StatusDot key={a.supplierName} tone="warning">{interpolate(t.group.alertLine, { s: a.supplierName, rate: fmtPercent(a.rate), e: a.errors, n: a.sampled })}</StatusDot>)}</Space>),
    },
    { title: t.group.colSync, key: 's', width: 220, render: (_, r) => <Space wrap>{fmtDateTime(r.lastSyncAt)}<StatusDot tone={r.lastSyncFailed ? 'error' : 'success'}>{r.lastSyncFailed ? t.group.syncFailed : t.group.syncOk}</StatusDot></Space> },
  ];
  const d = q.data ?? [];
  return (
    <>
      <PageHeader
        title={t.group.title}
        meta={t.group.intro}
        actions={<><Link to="/group/entities"><Button>{t.group.manage}</Button></Link><Link to="/group/gates"><Button type="primary">{t.group.openGates}</Button></Link></>}
      />
      {d.length > 0 && (
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8}><Kpi title={t.group.kEntities} value={d.length} /></Col>
          <Col xs={12} sm={8}><Kpi title={t.group.kOpen} value={d.reduce((s, r) => s + r.openGates, 0)} sub={interpolate(t.group.gatesValue, { o: d.reduce((s, r) => s + r.openGates, 0), c: d.reduce((s, r) => s + r.closedGates, 0) })} /></Col>
          <Col xs={12} sm={8}><Kpi title={t.group.kAlerts} value={d.reduce((s, r) => s + r.alerts.length, 0)} color={d.some((r) => r.alerts.length > 0) ? TOKENS.warning : undefined} sub={t.group.kAlertsSub} onClick={() => nav('/group/gates?view=alerts')} /></Col>
        </Row>
      )}
      <Card styles={{ body: { padding: 0 } }}>
        <Async q={q} isEmpty={(x) => x.length === 0} empty={<EmptyState title={t.group.emptyTitle} text={t.group.emptyText} action={<Link to="/group/entities"><Button type="primary">{t.entities.add}</Button></Link>} />}>
          {(rows) => <Table<GroupOverviewRow> size="middle" rowKey="entityId" columns={cols} dataSource={rows} pagination={false} scroll={{ x: 900 }} sticky={{ offsetHeader: 56 }} />}
        </Async>
      </Card>
    </>
  );
}
