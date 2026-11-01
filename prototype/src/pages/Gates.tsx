import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Descriptions, Form, Input, Modal, Row, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckCircleOutlined, LockOutlined, UnlockOutlined, WarningOutlined } from '@ant-design/icons';
import { closeGate, openGate, type GateRow } from '../api/admin';
import { useEntities, useGates } from '../api/hooks';
import { Async } from '../components/Async';
import { EmptyState, Notice, PageHeader } from '../components/Bits';
import { ActionError, ActionModal } from '../components/Dialogs';
import { Kpi } from '../components/Kpi';
import { fmtDate, fmtPercent, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

type View = 'all' | 'alerts' | 'open' | 'closed';

/** SCR-75/78 Automation Gates list with SCR-79 (open a gate, close a gate) as dialogs. Group Admin only. */
export function Gates() {
  const [sp, setSp] = useSearchParams();
  const view = (['all', 'alerts', 'open', 'closed'].includes(sp.get('view') ?? '') ? sp.get('view') : 'all') as View;
  const entityId = sp.get('entity') ?? '';
  const q = useGates();
  const entities = useEntities();
  const [opening, setOpening] = useState<GateRow | null>(null);
  const [closing, setClosing] = useState<GateRow | null>(null);
  const set = (k: string, v: string | null) => setSp((p) => { const n = new URLSearchParams(p); if (v) n.set(k, v); else n.delete(k); return n; }, { replace: true });

  const all = (q.data ?? []).filter((g) => !entityId || g.entityId === entityId);
  const counts: Record<View, number> = { all: all.length, alerts: all.filter((g) => g.alert).length, open: all.filter((g) => g.state === 'OPEN').length, closed: all.filter((g) => g.state === 'CLOSED').length };
  const rows = all.filter((g) => view === 'all' || (view === 'alerts' ? !!g.alert : view === 'open' ? g.state === 'OPEN' : g.state === 'CLOSED'));

  const cols: TableColumnsType<GateRow> = [
    { title: t.gates.colSupplier, key: 's', width: 220, sorter: (a, b) => a.supplierName.localeCompare(b.supplierName, 'vi'), render: (_, g) => <b>{g.supplierName}</b> },
    { title: t.gates.colEntity, key: 'e', width: 220, sorter: (a, b) => a.entityName.localeCompare(b.entityName, 'vi'), render: (_, g) => g.entityName },
    {
      title: t.gates.colState, key: 'st', width: 160,
      render: (_, g) => <><Tag color={g.state === 'OPEN' ? 'success' : 'default'} icon={g.state === 'OPEN' ? <UnlockOutlined /> : <LockOutlined />}>{t.gates.states[g.state]}</Tag>{g.openSince && <><br /><Typography.Text type="secondary" className="xs">{interpolate(t.gates.since, { d: fmtDate(g.openSince) })}</Typography.Text></>}</>,
    },
    { title: t.gates.colAccuracy, key: 'acc', width: 220, responsive: ['md'], sorter: (a, b) => a.accuracy - b.accuracy, render: (_, g) => (g.compared ? interpolate(t.gates.accuracyValue, { a: fmtPercent(g.accuracy), u: g.unchanged, n: g.compared }) : '-') },
    { title: t.gates.colCompared, key: 'cmp', align: 'right', width: 110, responsive: ['lg'], sorter: (a, b) => a.compared - b.compared, render: (_, g) => g.compared },
    { title: t.gates.colSample, key: 'smp', width: 240, render: (_, g) => <>{interpolate(t.gates.sampleValue, { e: g.sampleErrors, n: g.sampled })}{g.alert && <><br /><Tag color="warning" icon={<WarningOutlined />} style={{ marginTop: 4 }}>{interpolate(t.gates.alert, { rate: fmtPercent(g.alert.rate) })}</Tag></>}</> },
    {
      title: <span className="sr">{t.gates.colAction}</span>, key: 'act', fixed: 'right', width: 110,
      render: (_, g) => (g.state === 'CLOSED' ? <Button size="small" type="primary" onClick={() => setOpening(g)}>{t.gates.open}</Button> : <Button size="small" onClick={() => setClosing(g)}>{t.gates.close}</Button>),
    },
  ];

  return (
    <>
      <PageHeader title={t.gates.title} meta={t.gates.intro} />
      {q.data && q.data.length > 0 && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}><Kpi title={t.gates.kOpen} value={counts.open} icon={<UnlockOutlined />} color="#2E6A55" /></Col>
          <Col xs={24} sm={8}><Kpi title={t.gates.kClosed} value={counts.closed} icon={<LockOutlined />} /></Col>
          <Col xs={24} sm={8}><Kpi title={t.gates.kAlerts} value={counts.alerts} icon={<WarningOutlined />} color="#8A5E0F" onClick={() => set('view', 'alerts')} /></Col>
        </Row>
      )}
      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          className="view-tabs"
          aria-label={t.gates.savedViews}
          activeKey={view}
          onChange={(v) => set('view', v === 'all' ? null : v)}
          items={(['all', 'alerts', 'open', 'closed'] as View[]).map((k) => ({ key: k, label: <span>{t.gates.views[k]} {q.data && <Badge count={counts[k]} showZero color={k === 'alerts' && counts.alerts ? '#8A5E0F' : '#9a9fb0'} style={{ marginInlineStart: 4 }} />}</span> }))}
        />
        <div className="toolbar">
          <Select
            aria-label={t.gates.entityFilter}
            style={{ minWidth: 260 }}
            value={entityId}
            onChange={(v) => set('entity', v || null)}
            options={[{ value: '', label: t.gates.allEntities }, ...(entities.data?.map((e) => ({ value: e.id, label: e.name })) ?? [])]}
          />
        </div>
        <Async q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState title={t.gates.emptyTitle} text={t.gates.emptyText} />}>
          {() => (rows.length === 0 ? <EmptyState title={t.gates.noMatch} action={<Button onClick={() => setSp({}, { replace: true })}>{t.common.clearFilters}</Button>} /> : <Table<GateRow> size="middle" rowKey="id" columns={cols} dataSource={rows} pagination={false} scroll={{ x: 900 }} />)}
        </Async>
      </Card>
      {opening && <OpenModal g={opening} onClose={() => setOpening(null)} />}
      {closing && <CloseDialog g={closing} onClose={() => setClosing(null)} />}
    </>
  );
}

function OpenModal({ g, onClose }: { g: GateRow; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const tooFew = g.compared < 50;
  const low = g.accuracy < 98;
  const bad = low && !reason.trim();
  const act = useAction(() => openGate(g.id, { reason: reason.trim() || undefined, version: g.version }), { success: t.gates.opened, onSuccess: onClose });
  return (
    <Modal
      open
      title={interpolate(t.gates.openTitle, { s: g.supplierName, e: g.entityName })}
      onCancel={onClose}
      maskClosable={!act.pending}
      keyboard={!act.pending}
      destroyOnHidden
      footer={<Space><Button onClick={onClose} disabled={act.pending}>{t.common.cancel}</Button><Button type="primary" icon={<CheckCircleOutlined />} disabled={tooFew} loading={act.pending} onClick={() => { setTouched(true); if (tooFew || bad) return; void act.run(undefined); }}>{t.gates.open}</Button></Space>}
    >
      <div className="modal-body">
        <section aria-label={t.gates.evidence}>
          <Descriptions size="small" column={1} items={[
            { key: 'c', label: t.gates.colCompared, children: g.compared },
            { key: 's', label: t.gates.simulated, children: g.simulatedCompared },
            { key: 'a', label: t.gates.colAccuracy, children: g.compared ? interpolate(t.gates.accuracyValue, { a: fmtPercent(g.accuracy), u: g.unchanged, n: g.compared }) : '-' },
            { key: 'e', label: t.gates.sampleErrors, children: interpolate(t.gates.sampleValue, { e: g.sampleErrors, n: g.sampled }) },
          ]} />
        </section>
        {tooFew && <Notice kind="warn">{interpolate(t.gates.tooFew, { n: g.compared })}</Notice>}
        {!tooFew && low && <Alert type="warning" showIcon message={t.gates.lowAccuracy} />}
        {!tooFew && (
          <Form layout="vertical">
            <Form.Item label={t.gates.reason} required={low} validateStatus={touched && bad ? 'error' : undefined} help={touched && bad ? t.gates.reasonRequired : undefined}>
              <Input.TextArea rows={3} maxLength={500} showCount autoFocus value={reason} onChange={(e) => setReason(e.target.value)} aria-label={t.gates.reason} />
            </Form.Item>
          </Form>
        )}
        <ActionError error={act.error} raw={act.rawError} />
      </div>
    </Modal>
  );
}

function CloseDialog({ g, onClose }: { g: GateRow; onClose: () => void }) {
  const act = useAction(() => closeGate(g.id, { version: g.version }), { success: t.gates.closed, onSuccess: onClose });
  return (
    <ActionModal title={interpolate(t.gates.closeTitle, { s: g.supplierName, e: g.entityName })} okText={t.gates.close} danger pending={act.pending} error={act.error} rawError={act.rawError} onClose={onClose} onOk={() => void act.run(undefined)}>
      <Typography.Paragraph>{t.gates.closeText}</Typography.Paragraph>
    </ActionModal>
  );
}
