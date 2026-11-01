import { useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Select, Space, Table, Tabs, Tag, Badge, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckCircleOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { ProfileInput, ProfileRow } from '../api/recurring';
import { createRecurringProfile, deactivateRecurringProfile, updateRecurringProfile } from '../api/recurring';
import { useProfiles, useSuppliers } from '../api/hooks';
import { Async } from '../components/Async';
import { EmptyState, PageHeader } from '../components/Bits';
import { ActionModal } from '../components/Dialogs';
import { MoneyInput } from '../components/Inputs';
import { fmtMoney } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

type Tab = 'active' | 'inactive' | 'all';

/** SCR-20 Recurring Profiles, with SCR-21 (form) as a modal. */
export function Recurring() {
  const q = useProfiles();
  const [tab, setTab] = useState<Tab>('active');
  const [form, setForm] = useState<ProfileRow | 'new' | null>(null);
  const [deact, setDeact] = useState<ProfileRow | null>(null);
  const off = useAction((p: ProfileRow) => deactivateRecurringProfile(p.id, { version: p.version }), { success: t.recurring.toastDeactivated, onSuccess: () => setDeact(null) });

  const all = q.data ?? [];
  const count = (s: Tab) => (s === 'all' ? all.length : all.filter((p) => (s === 'active') === (p.status === 'ACTIVE')).length);
  const rows = tab === 'all' ? all : all.filter((p) => (tab === 'active') === (p.status === 'ACTIVE'));

  const cols: TableColumnsType<ProfileRow> = [
    { title: t.recurring.colSupplier, key: 'sup', width: 220, sorter: (a, b) => a.supplierName.localeCompare(b.supplierName, 'vi'), render: (_, r) => <><b>{r.supplierName}</b><br /><Typography.Text type="secondary" className="xs">{r.location}</Typography.Text></> },
    { title: t.recurring.colContract, key: 'contract', width: 130, render: (_, r) => <span className="mono">{r.contract}</span> },
    { title: t.recurring.colPeriod, key: 'period', width: 110, responsive: ['md'], render: (_, r) => t.recurring.periods[r.period] },
    { title: t.recurring.colPrice, key: 'price', width: 190, render: (_, r) => (r.priceType === 'FIXED' ? `${t.recurring.fixed}: ${fmtMoney(r.contractPrice ?? 0)}` : t.recurring.usage) },
    { title: t.recurring.colThreshold, key: 'thr', width: 110, responsive: ['lg'], render: (_, r) => (r.deviationThreshold ? `${r.deviationThreshold}%` : '-') },
    {
      title: t.recurring.colEarlier, key: 'earlier', width: 280, responsive: ['xl'],
      render: (_, r) => r.earlier.length === 0 ? <Typography.Text type="secondary">{t.recurring.noPeriods}</Typography.Text> : <><b>{t.recurring.average} {fmtMoney(r.average ?? 0)}</b><br /><Typography.Text type="secondary" className="xs">{r.earlier.map((e) => `${e.label} ${fmtMoney(e.amount)}`).join(' · ')}</Typography.Text></>,
    },
    { title: t.recurring.colStatus, key: 'status', width: 130, render: (_, r) => <Tag color={r.status === 'ACTIVE' ? 'success' : 'default'} icon={r.status === 'ACTIVE' ? <CheckCircleOutlined /> : <MinusCircleOutlined />}>{t.recurring.status[r.status]}</Tag> },
    {
      title: <span className="sr">{t.common.actions}</span>, key: 'act', fixed: 'right', width: 190,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => setForm(r)}>{t.common.edit}</Button>
          {r.status === 'ACTIVE' && <Button size="small" danger onClick={() => setDeact(r)}>{t.recurring.deactivate}</Button>}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.recurring.title}
        meta={t.recurring.intro}
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => setForm('new')}>{t.recurring.add}</Button>}
      />
      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          className="view-tabs"
          aria-label={t.recurring.savedViews}
          activeKey={tab}
          onChange={(k) => setTab(k as Tab)}
          items={(['active', 'inactive', 'all'] as Tab[]).map((s) => ({ key: s, label: <span>{t.recurring.views[s]} {q.data && <Badge count={count(s)} showZero color="#9a9fb0" style={{ marginInlineStart: 4 }} />}</span> }))}
        />
        <Async
          q={q}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState title={t.recurring.emptyTitle} text={t.recurring.emptyText} action={<Button type="primary" onClick={() => setForm('new')}>{t.recurring.add}</Button>} />}
        >
          {() => (rows.length === 0 ? <EmptyState title={t.recurring.emptyView} /> : <Table<ProfileRow> size="middle" rowKey="id" columns={cols} dataSource={rows} pagination={false} scroll={{ x: 900 }} />)}
        </Async>
      </Card>
      {form && <ProfileForm profile={form === 'new' ? null : form} onClose={() => setForm(null)} />}
      {deact && (
        <ActionModal title={t.recurring.deactivateTitle.replace('{s}', `${deact.supplierName}, ${deact.location}`)} okText={t.recurring.deactivate} danger pending={off.pending} error={off.error} rawError={off.rawError} onClose={() => setDeact(null)} onOk={() => void off.run(deact)}>
          <Typography.Paragraph>{t.recurring.deactivateText}</Typography.Paragraph>
        </ActionModal>
      )}
    </>
  );
}

interface FormValues { supplierId?: string; location: string; contract: string; period: ProfileInput['period']; priceType: ProfileInput['priceType']; price?: number; threshold?: number }

function ProfileForm({ profile, onClose }: { profile: ProfileRow | null; onClose: () => void }) {
  const suppliers = useSuppliers();
  const [form] = Form.useForm<FormValues>();
  const priceType = Form.useWatch('priceType', form) ?? profile?.priceType ?? 'FIXED';
  const save = useAction(
    (b: ProfileInput) => (profile ? updateRecurringProfile(profile.id, { ...b, version: profile.version }) : createRecurringProfile(b)),
    { success: profile ? t.recurring.toastUpdated : t.recurring.toastCreated, onSuccess: onClose },
  );
  const dup = save.rawError && (save.rawError as { code?: string }).code === 'DUPLICATE_PROFILE';
  return (
    <ActionModal
      title={profile ? t.recurring.editTitle : t.recurring.addTitle}
      okText={t.recurring.save}
      pending={save.pending}
      error={dup ? t.errors.DUPLICATE_PROFILE : save.error}
      rawError={save.rawError}
      onClose={onClose}
      onOk={() => {
        void form.validateFields().then((v) => save.run({ supplierId: v.supplierId!, location: v.location, contract: v.contract, period: v.period, priceType: v.priceType, contractPrice: v.priceType === 'FIXED' ? v.price ?? null : null, deviationThreshold: v.priceType === 'USAGE_BASED' ? v.threshold ?? null : null })).catch(() => undefined);
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          supplierId: profile?.supplierId,
          location: profile?.location ?? '',
          contract: profile?.contract ?? '',
          period: profile?.period ?? 'MONTHLY',
          priceType: profile?.priceType ?? 'FIXED',
          price: profile?.contractPrice ?? undefined,
          threshold: profile?.deviationThreshold ?? 30,
        }}
      >
        <Form.Item name="supplierId" label={t.recurring.colSupplier} rules={[{ required: true, message: t.common.chooseOne }]}>
          <Select showSearch optionFilterProp="label" placeholder={t.common.choose} options={suppliers.data?.filter((s) => s.country === 'VN').map((s) => ({ value: s.id, label: s.name }))} />
        </Form.Item>
        <div className="form-grid">
          <Form.Item name="location" label={t.recurring.location} rules={[{ required: true, whitespace: true, message: t.common.fieldRequired }]}><Input /></Form.Item>
          <Form.Item name="contract" label={t.recurring.colContract} rules={[{ required: true, whitespace: true, message: t.common.fieldRequired }]}><Input /></Form.Item>
          <Form.Item name="period" label={t.recurring.colPeriod}>
            <Select options={[{ value: 'MONTHLY', label: t.recurring.periods.MONTHLY }, { value: 'QUARTERLY', label: t.recurring.periods.QUARTERLY }]} />
          </Form.Item>
          <Form.Item name="priceType" label={t.recurring.priceType}>
            <Select options={[{ value: 'FIXED', label: t.recurring.fixedPrice }, { value: 'USAGE_BASED', label: t.recurring.usage }]} />
          </Form.Item>
        </div>
        {priceType === 'FIXED' ? (
          <Form.Item name="price" label={t.recurring.contractPrice} rules={[{ required: true, type: 'number', min: 1, message: t.recurring.priceRequired }]}>
            <MoneyInput />
          </Form.Item>
        ) : (
          <Form.Item name="threshold" label={t.recurring.threshold} extra={t.recurring.thresholdHint} rules={[{ required: true, type: 'number', min: 0.1, message: t.recurring.thresholdRequired }]}>
            <InputNumber<number> min={0} max={100} step={1} addonAfter="%" style={{ width: '100%' }} />
          </Form.Item>
        )}
      </Form>
    </ActionModal>
  );
}
