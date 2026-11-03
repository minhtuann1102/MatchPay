import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, DatePicker, Form, Input, Select, Table, Tabs, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { LockOutlined, PlusOutlined, SwapOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { createDelegation, listDelegateCandidates, revokeDelegation, type DelegationRow } from '../api/signing';
import { getSessionUserId } from '../api/client';
import { useDelegations } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { Count, EmptyState, Notice, PageHeader } from '../components/Bits';
import { StatusDot } from '../components/Tags';
import { ActionModal } from '../components/Dialogs';
import { fmtDate, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

type Tab = 'current' | 'past' | 'all';
const STATE_TONE = { SCHEDULED: 'warning', ACTIVE: 'success', ENDED: 'neutral', REVOKED: 'error' } as const;

/** SCR-55 Signing Delegations, with SCR-56 (new delegation) as a modal. Entity Admin reads and revokes only. */
export function Delegations() {
  const { session } = useAuth();
  const q = useDelegations();
  const admin = session?.role === 'ENTITY_ADMIN';
  const [tab, setTab] = useState<Tab>('current');
  const [form, setForm] = useState(false);
  const [rev, setRev] = useState<DelegationRow | null>(null);
  const all = q.data ?? [];
  const cur = all.filter((d) => d.state === 'ACTIVE' || d.state === 'SCHEDULED');
  const past = all.filter((d) => d.state === 'ENDED' || d.state === 'REVOKED');
  const rows = tab === 'current' ? cur : tab === 'past' ? past : all;
  const gave = all.find((d) => d.mine === 'GAVE' && d.state === 'ACTIVE');
  const got = all.filter((d) => d.mine === 'RECEIVED' && d.state === 'ACTIVE');

  const cols: TableColumnsType<DelegationRow> = [
    { title: t.delegations.colDelegator, key: 'a', width: 180, render: (_, d) => <>{d.delegatorName}{d.mine === 'GAVE' && <Typography.Text type="secondary"> {t.delegations.you}</Typography.Text>}</> },
    { title: t.delegations.colDelegate, key: 'b', width: 180, render: (_, d) => <>{d.delegateName}{d.mine === 'RECEIVED' && <Typography.Text type="secondary"> {t.delegations.you}</Typography.Text>}</> },
    { title: t.delegations.colFrom, key: 'f', width: 120, sorter: (a, b) => a.from.localeCompare(b.from), render: (_, d) => fmtDate(d.from) },
    { title: t.delegations.colTo, key: 'to', width: 120, sorter: (a, b) => a.to.localeCompare(b.to), render: (_, d) => fmtDate(d.to) },
    { title: t.delegations.colReason, key: 'r', ellipsis: true, width: 220, responsive: ['md'], render: (_, d) => d.reason },
    { title: t.delegations.colState, key: 's', width: 140, render: (_, d) => <StatusDot tone={STATE_TONE[d.state]}>{t.delegations.states[d.state]}</StatusDot> },
    {
      title: <span className="sr">{t.common.actions}</span>, key: 'act', fixed: 'right', width: 110,
      render: (_, d) => ((d.state === 'ACTIVE' || d.state === 'SCHEDULED') && (admin || d.mine === 'GAVE') ? <Button size="small" onClick={() => setRev(d)}>{t.delegations.revoke}</Button> : null),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.delegations.title}
        readOnly={admin}
        meta={admin ? interpolate(t.delegations.introAdmin, { entity: session?.entityName ?? '' }) : t.delegations.introSigner}
        actions={!admin && <Button type="primary" icon={<PlusOutlined />} onClick={() => setForm(true)}>{t.delegations.new}</Button>}
      />
      {gave && <Notice kind="info" icon={<SwapOutlined />}>{interpolate(t.delegations.activeGave, { who: gave.delegateName, date: fmtDate(gave.to) })}</Notice>}
      {got.map((d) => <Notice key={d.id} kind="info" icon={<SwapOutlined />}>{interpolate(t.delegations.activeReceived, { who: d.delegatorName, date: fmtDate(d.to) })}</Notice>)}
      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          className="view-tabs"
          aria-label={t.delegations.savedViews}
          activeKey={tab}
          onChange={(k) => setTab(k as Tab)}
          items={(['current', 'past', 'all'] as Tab[]).map((k) => ({ key: k, label: <span>{t.delegations.views[k]} {q.data && <Count n={{ current: cur.length, past: past.length, all: all.length }[k]} />}</span> }))}
        />
        <Async
          q={q}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState title={t.delegations.emptyTitle} text={admin ? t.delegations.emptyAdmin : t.delegations.emptyText} action={!admin ? <Button type="primary" onClick={() => setForm(true)}>{t.delegations.new}</Button> : undefined} />}
        >
          {() => (rows.length === 0 ? <EmptyState title={t.delegations.emptyTitle} /> : <Table<DelegationRow> size="middle" rowKey="id" columns={cols} dataSource={rows} pagination={false} scroll={{ x: 800 }} sticky={{ offsetHeader: 56 }} />)}
        </Async>
        <Typography.Text type="secondary" className="xs" style={{ display: 'block', padding: '8px 16px 12px' }}>{t.delegations.immutable}</Typography.Text>
      </Card>
      {form && <DelegationForm onClose={() => setForm(false)} />}
      {rev && <RevokeDialog d={rev} onClose={() => setRev(null)} />}
    </>
  );
}

function RevokeDialog({ d, onClose }: { d: DelegationRow; onClose: () => void }) {
  const act = useAction(() => revokeDelegation(d.id), { success: t.delegations.revoked, onSuccess: onClose });
  const v = { a: d.delegatorName, b: d.delegateName, from: fmtDate(d.from), to: fmtDate(d.to) };
  return (
    <ActionModal title={interpolate(t.delegations.revokeTitle, v)} okText={t.delegations.revoke} danger pending={act.pending} error={act.error} rawError={act.rawError} onClose={onClose} onOk={() => void act.run(undefined)}>
      <Typography.Paragraph>{interpolate(t.delegations.revokeText, v)}</Typography.Paragraph>
    </ActionModal>
  );
}

function DelegationForm({ onClose }: { onClose: () => void }) {
  const cand = useQuery({ queryKey: ['delegateCandidates', getSessionUserId()], queryFn: listDelegateCandidates });
  const [form] = Form.useForm<{ delegateId: string; range: [Dayjs, Dayjs]; reason: string }>();
  const save = useAction((v: { delegateId: string; from: string; to: string; reason: string }) => createDelegation(v), { success: t.delegations.created, onSuccess: onClose });
  return (
    <ActionModal
      title={t.delegations.formTitle}
      okText={t.delegations.create}
      pending={save.pending}
      error={save.error}
      rawError={save.rawError}
      onClose={onClose}
      onOk={() => {
        void form.validateFields().then((v) => save.run({ delegateId: v.delegateId, from: v.range[0].format('YYYY-MM-DD'), to: v.range[1].format('YYYY-MM-DD'), reason: v.reason.trim() })).catch(() => undefined);
      }}
    >
      <Notice kind="warn" icon={<LockOutlined />}>{t.delegations.warnSelf}</Notice>
      <Form form={form} layout="vertical">
        <Form.Item name="delegateId" label={t.delegations.delegate} rules={[{ required: true, message: t.common.chooseOne }]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder={t.common.choose}
            options={cand.data?.map((u) => ({ value: u.id, label: `${u.fullName}, ${t.roles[u.role]}${u.approvalLevel ? ` (${t.approvalLevel[u.approvalLevel]})` : ''}` }))}
          />
        </Form.Item>
        <Form.Item name="range" label={`${t.delegations.from} - ${t.delegations.to}`} extra={t.delegations.max30} rules={[{ required: true, message: t.errors.DATES_REQUIRED }]}>
          <DatePicker.RangePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder={['dd/MM/yyyy', 'dd/MM/yyyy']} defaultPickerValue={[dayjs(), dayjs()]} />
        </Form.Item>
        <Form.Item name="reason" label={t.delegations.reason} rules={[{ required: true, whitespace: true, message: t.common.reasonRequired }]}>
          <Input maxLength={200} />
        </Form.Item>
      </Form>
    </ActionModal>
  );
}
