import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AutoComplete, Avatar, Button, Card, Form, Input, Select, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckCircleOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { createUser, deactivateUser, listErpUsers, updateUser, type UserInput } from '../api/admin';
import { getSessionUserId } from '../api/client';
import { useEntities, useUsers } from '../api/hooks';
import type { ApprovalLevel, Role, User } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { EmptyState, PageHeader } from '../components/Bits';
import { ActionModal } from '../components/Dialogs';
import { interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

type Row = User & { entityName: string };
const ENTITY_ROLES: Role[] = ['AP_ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'PAYMENT_APPROVER', 'REQUESTING_DEPARTMENT', 'ENTITY_ADMIN'];
const GROUP_ROLES: Role[] = ['GROUP_ADMIN', 'DEMO_OPERATOR'];

/** SCR-70 Users, with SCR-71 (add) and SCR-72 (edit, deactivate). Entity Admin manages their own entity; Group Admin manages all. */
export function Users() {
  const { session } = useAuth();
  const group = session?.role === 'GROUP_ADMIN';
  const [role, setRole] = useState<'' | Role>('');
  const [entityId, setEntityId] = useState('');
  const [form, setForm] = useState<Row | 'new' | null>(null);
  const [off, setOff] = useState<Row | null>(null);
  const q = useUsers({ role, entityId: entityId || undefined });
  const entities = useEntities();
  const all = useUsers({});
  const filtered = !!role || !!entityId;
  const deact = useAction((u: Row) => deactivateUser(u.id), { success: t.users.deactivated, onSuccess: () => setOff(null) });

  const cols: TableColumnsType<Row> = [
    {
      title: t.users.colName, key: 'n', width: 240, sorter: (a, b) => a.fullName.localeCompare(b.fullName, 'vi'),
      render: (_, u) => <Space><Avatar size="small" style={{ background: '#ECE9F6', color: '#4A3A8C' }}>{u.fullName.slice(0, 1)}</Avatar><b>{u.fullName}{u.id === session?.userId && <Typography.Text type="secondary"> {t.users.you}</Typography.Text>}</b></Space>,
    },
    { title: t.users.colEmail, key: 'e', width: 250, ellipsis: true, responsive: ['md'], render: (_, u) => u.email },
    { title: t.users.colRole, key: 'r', width: 200, sorter: (a, b) => a.role.localeCompare(b.role), render: (_, u) => <>{t.roles[u.role]}{u.approvalLevel && <><br /><Typography.Text type="secondary" className="xs">{t.approvalLevel[u.approvalLevel]}</Typography.Text></>}</> },
    ...(group ? [{ title: t.users.colEntity, key: 'en', width: 200, responsive: ['lg'], render: (_: unknown, u: Row) => (u.entityId ? u.entityName : t.users.group) } as TableColumnsType<Row>[number]] : []),
    { title: t.users.colErp, key: 'erp', width: 120, responsive: ['xl'], render: (_, u) => (u.erpUser ? <span className="mono">{u.erpUser}</span> : '-') },
    { title: t.users.colStatus, key: 's', width: 130, render: (_, u) => <Tag color={u.status === 'ACTIVE' ? 'success' : 'default'} icon={u.status === 'ACTIVE' ? <CheckCircleOutlined /> : <MinusCircleOutlined />}>{t.users.status[u.status]}</Tag> },
    {
      title: <span className="sr">{t.common.actions}</span>, key: 'act', fixed: 'right', width: 190,
      render: (_, u) => (
        <Space>
          <Button size="small" onClick={() => setForm(u)}>{t.common.edit}</Button>
          {u.status === 'ACTIVE' && u.id !== session?.userId && <Button size="small" danger onClick={() => setOff(u)}>{t.users.deactivate}</Button>}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.users.title}
        meta={group ? t.users.introGroup : interpolate(t.users.introEntity, { entity: session?.entityName ?? '' })}
        actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => setForm('new')}>{t.users.add}</Button>}
      />
      <Card styles={{ body: { padding: 0 } }}>
        <div className="toolbar" role="group" aria-label={t.users.savedViews}>
          <Select
            aria-label={t.users.roleFilter}
            style={{ minWidth: 220 }}
            value={role}
            onChange={setRole}
            options={[{ value: '', label: t.users.allRoles }, ...[...ENTITY_ROLES, ...(group ? GROUP_ROLES : [])].map((r) => ({ value: r, label: t.roles[r] }))]}
          />
          {group && (
            <Select
              aria-label={t.users.entityFilter}
              style={{ minWidth: 240 }}
              value={entityId}
              onChange={setEntityId}
              options={[{ value: '', label: t.users.allEntities }, ...(entities.data?.map((e) => ({ value: e.id, label: e.name })) ?? [])]}
            />
          )}
          {filtered && <Button type="link" size="small" onClick={() => { setRole(''); setEntityId(''); }}>{t.common.clearFilters}</Button>}
        </div>
        <Async q={q} isEmpty={(d) => d.length === 0} empty={filtered && all.data?.length ? <EmptyState title={t.users.noMatch} /> : <EmptyState title={t.users.emptyTitle} text={t.users.emptyText} />}>
          {(d) => <Table<Row> size="middle" rowKey="id" columns={cols} dataSource={d} pagination={{ pageSize: 20, hideOnSinglePage: true }} scroll={{ x: 760 }} />}
        </Async>
      </Card>
      {form && <UserForm user={form === 'new' ? null : form} group={group} onClose={() => setForm(null)} />}
      {off && (
        <ActionModal title={interpolate(t.users.deactivateTitle, { name: off.fullName })} okText={t.users.deactivate} danger pending={deact.pending} error={deact.error} rawError={deact.rawError} onClose={() => setOff(null)} onOk={() => void deact.run(off)}>
          <Typography.Paragraph>{t.users.deactivateText}</Typography.Paragraph>
        </ActionModal>
      )}
    </>
  );
}

interface UserValues { fullName: string; email: string; role: Role; level: ApprovalLevel; entityId?: string; erpUser?: string; password?: string }

function UserForm({ user, group, onClose }: { user: Row | null; group: boolean; onClose: () => void }) {
  const { session } = useAuth();
  const entities = useEntities();
  const erp = useQuery({ queryKey: ['erpUsers', getSessionUserId()], queryFn: listErpUsers });
  const [form] = Form.useForm<UserValues>();
  const roleVal = Form.useWatch('role', form) ?? user?.role ?? 'AP_ACCOUNTANT';
  const own = user?.id === session?.userId;
  const save = useAction(
    (b: UserInput) => (user ? updateUser(user.id, { ...b, version: user.version }) : createUser(b)),
    { success: user ? t.users.updated : t.users.created, onSuccess: onClose },
  );
  const groupLevel = GROUP_ROLES.includes(roleVal);
  const roles = group ? [...ENTITY_ROLES, ...GROUP_ROLES] : ENTITY_ROLES.filter((r) => r !== 'ENTITY_ADMIN');
  return (
    <ActionModal
      title={user ? t.users.editTitle : t.users.addTitle}
      okText={t.users.save}
      width={600}
      pending={save.pending}
      error={save.error}
      rawError={save.rawError}
      onClose={onClose}
      onOk={() => {
        void form.validateFields().then(() => form.getFieldsValue(true) as UserValues).then((v) => save.run({ fullName: v.fullName, email: v.email, role: v.role, entityId: GROUP_ROLES.includes(v.role) ? null : v.entityId ?? null, erpUser: v.erpUser?.trim() || null, approvalLevel: v.role === 'PAYMENT_APPROVER' ? v.level : null, password: user ? undefined : v.password })).catch(() => undefined);
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          fullName: user?.fullName ?? '', email: user?.email ?? '', role: user?.role ?? 'AP_ACCOUNTANT', level: user?.approvalLevel ?? 'DEPARTMENT_HEAD',
          entityId: user ? user.entityId ?? undefined : session?.entityId ?? undefined, erpUser: user?.erpUser ?? '', password: '',
        }}
      >
        <div className="form-grid">
          <Form.Item name="fullName" label={t.users.fullName} rules={[{ required: true, whitespace: true, message: t.common.fieldRequired }]}><Input autoFocus /></Form.Item>
          <Form.Item name="email" label={t.users.email} rules={[{ required: true, message: t.users.emailInvalid }, { type: 'email', message: t.users.emailInvalid }]}><Input /></Form.Item>
          <Form.Item name="role" label={t.users.role}><Select disabled={own} options={roles.map((r) => ({ value: r, label: t.roles[r] }))} /></Form.Item>
          {roleVal === 'PAYMENT_APPROVER' && (
            <Form.Item name="level" label={t.users.level}>
              <Select options={[{ value: 'DEPARTMENT_HEAD', label: t.approvalLevel.DEPARTMENT_HEAD }, { value: 'CFO', label: t.approvalLevel.CFO }]} />
            </Form.Item>
          )}
        </div>
        {group && !groupLevel && (
          <Form.Item name="entityId" label={t.users.entity} rules={[{ required: true, message: t.common.chooseOne }]}>
            <Select placeholder={t.common.choose} options={entities.data?.map((e) => ({ value: e.id, label: e.name }))} />
          </Form.Item>
        )}
        <Form.Item name="erpUser" label={t.users.erpUser} extra={t.users.erpHint}>
          <AutoComplete options={erp.data?.map((x) => ({ value: x }))} filterOption />
        </Form.Item>
        {!user && (
          <Form.Item name="password" label={t.users.password} extra={t.users.passwordHint} rules={[{ required: true, min: 8, message: t.errors.PASSWORD_SHORT }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        )}
      </Form>
    </ActionModal>
  );
}
