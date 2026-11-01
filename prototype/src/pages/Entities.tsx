import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Col, Form, Input, InputNumber, Row, Slider, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { addSector, createEntity, listSectors, removeSector, updateGroupLimits } from '../api/admin';
import { getSessionUserId } from '../api/client';
import { useEntities, useGroup } from '../api/hooks';
import type { Entity } from '../api/types';
import { Async } from '../components/Async';
import { EmptyState, Notice, PageHeader } from '../components/Bits';
import { ActionError, ActionModal } from '../components/Dialogs';
import { MoneyInput } from '../components/Inputs';
import { fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

/** SCR-76 Entities and Group Limits, with SCR-77 (add entity) as a modal. */
export function Entities() {
  const q = useEntities();
  const [adding, setAdding] = useState(false);
  const cols: TableColumnsType<Entity> = [
    { title: t.entities.colName, key: 'n', width: 260, sorter: (a, b) => a.name.localeCompare(b.name, 'vi'), render: (_, e) => <b>{e.name}</b> },
    { title: t.entities.colTax, key: 'tax', width: 130, render: (_, e) => <span className="mono">{e.taxCode}</span> },
    { title: t.entities.colTol, key: 'tol', width: 110, render: (_, e) => `${e.priceTolerance}%` },
    { title: t.entities.colThr, key: 'thr', align: 'right', width: 160, render: (_, e) => fmtMoney(e.batchThreshold) },
    { title: t.entities.colSample, key: 'rate', width: 110, render: (_, e) => `${e.sampleRate}%` },
    { title: t.entities.colMailbox, key: 'mb', width: 240, responsive: ['md'], render: (_, e) => e.mailbox },
  ];
  return (
    <>
      <PageHeader title={t.entities.title} meta={t.entities.intro} actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAdding(true)}>{t.entities.add}</Button>} />
      <Card styles={{ body: { padding: 0 } }}>
        <Async q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState title={t.entities.emptyTitle} action={<Button type="primary" onClick={() => setAdding(true)}>{t.entities.add}</Button>} />}>
          {(d) => <Table<Entity> size="middle" rowKey="id" columns={cols} dataSource={d} pagination={false} scroll={{ x: 760 }} />}
        </Async>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}><Limits /></Col>
        <Col xs={24} lg={12}><Sectors /></Col>
      </Row>
      {adding && <AddEntity onClose={() => setAdding(false)} />}
    </>
  );
}

function Limits() {
  const q = useGroup();
  return (
    <Card title={t.entities.limitsTitle} aria-labelledby="lim-h" style={{ height: '100%' }}>
      <Async q={q} skeletonRows={3}>{(g) => <LimitsForm key={g.version} g={g} />}</Async>
    </Card>
  );
}

function LimitsForm({ g }: { g: { maxPriceTolerance: number; maxBatchThreshold: number; version: number } }) {
  const [tol, setTol] = useState<number | null>(g.maxPriceTolerance);
  const [thr, setThr] = useState<number | null>(g.maxBatchThreshold);
  const [touched, setTouched] = useState(false);
  const [lowered, setLowered] = useState<string | null>(null);
  const bad = { tol: !(tol !== null && tol > 0), thr: !(thr !== null && thr > 0) };
  const dirty = tol !== g.maxPriceTolerance || thr !== g.maxBatchThreshold;
  const save = useAction(() => updateGroupLimits({ maxPriceTolerance: tol!, maxBatchThreshold: thr!, version: g.version }), {
    success: t.entities.limitsSaved,
    onSuccess: (r) => setLowered(r.lowered.length ? interpolate(t.entities.lowered, { names: r.lowered.map((x) => x.name).join(', '), to: r.lowered[0]!.to }) : null),
  });
  return (
    <Form layout="vertical" onFinish={() => { setTouched(true); if (bad.tol || bad.thr) return; void save.run(undefined); }}>
      <Form.Item label={t.entities.maxTol} validateStatus={touched && bad.tol ? 'error' : undefined} help={touched && bad.tol ? t.errors.LIMIT_INVALID : undefined}>
        <InputNumber<number> aria-label={t.entities.maxTol} min={0} max={100} step={0.5} addonAfter="%" style={{ width: '100%' }} value={tol} onChange={setTol} />
        <Slider min={0} max={30} step={0.5} value={Math.min(tol ?? 0, 30)} onChange={setTol} />
      </Form.Item>
      <Form.Item label={t.entities.maxThr} extra={t.entities.limitsHint} validateStatus={touched && bad.thr ? 'error' : undefined} help={touched && bad.thr ? t.errors.LIMIT_INVALID : undefined}>
        <MoneyInput aria-label={t.entities.maxThr} value={thr} onChange={setThr} />
      </Form.Item>
      {lowered && <Notice kind="warn">{lowered}</Notice>}
      <ActionError error={save.error} raw={save.rawError} />
      <Button type="primary" htmlType="submit" disabled={!dirty} loading={save.pending} style={{ marginTop: 8 }}>{t.entities.saveLimits}</Button>
    </Form>
  );
}

const useQuerySectors = () => useQuery({ queryKey: ['sectors', getSessionUserId()], queryFn: listSectors });

function Sectors() {
  const q = useQuerySectors();
  const [name, setName] = useState('');
  const add = useAction((n: string) => addSector(n), { success: t.entities.sectorAdded, onSuccess: () => setName('') });
  const del = useAction((n: string) => removeSector(n), { success: t.entities.sectorRemoved });
  return (
    <Card title={t.entities.sectorsTitle} style={{ height: '100%' }}>
      <div className="stack">
        <Typography.Text type="secondary">{t.entities.sectorsHint}</Typography.Text>
        <Async q={q} skeletonRows={3}>
          {(list) => (list.length === 0 ? <Typography.Text type="secondary">{t.entities.noSectors}</Typography.Text> : (
            <Space size={[8, 8]} wrap>
              {list.map((s) => (
                <Tag key={s} bordered closable onClose={(e) => { e.preventDefault(); if (!del.pending) void del.run(s); }} closeIcon={<CloseOutlined aria-label={interpolate(t.entities.removeSector, { s })} role="button" />}>{s}</Tag>
              ))}
            </Space>
          ))}
        </Async>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) void add.run(name.trim()); }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input aria-label={t.entities.sectorName} placeholder={t.entities.sectorName} value={name} onChange={(e) => setName(e.target.value)} />
            <Button htmlType="submit" disabled={!name.trim()} loading={add.pending}>{t.entities.addSector}</Button>
          </Space.Compact>
        </form>
        <ActionError error={add.error ?? del.error} raw={add.rawError ?? del.rawError} />
      </div>
    </Card>
  );
}

function AddEntity({ onClose }: { onClose: () => void }) {
  const [form] = Form.useForm<{ name: string; taxCode: string }>();
  const save = useAction((v: { name: string; taxCode: string }) => createEntity(v), { success: t.entities.added, onSuccess: onClose });
  return (
    <ActionModal
      title={t.entities.addTitle}
      okText={t.entities.save}
      pending={save.pending}
      error={save.error}
      rawError={save.rawError}
      onClose={onClose}
      onOk={() => { void form.validateFields().then((v) => save.run({ name: v.name, taxCode: v.taxCode.trim() })).catch(() => undefined); }}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label={t.entities.name} rules={[{ required: true, whitespace: true, message: t.common.fieldRequired }]}><Input autoFocus /></Form.Item>
        <Form.Item name="taxCode" label={t.entities.taxCode} extra={t.entities.taxHint} rules={[{ required: true, pattern: /^\d{10}$/, message: t.errors.TAX_CODE_INVALID }]}><Input inputMode="numeric" maxLength={10} /></Form.Item>
      </Form>
    </ActionModal>
  );
}
