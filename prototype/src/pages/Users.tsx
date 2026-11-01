import { useState } from 'react';
import { createUser, deactivateUser, listErpUsers, updateUser, type UserInput } from '../api/admin';
import { getSessionUserId } from '../api/client';
import { useQuery } from '@tanstack/react-query';
import { useEntities, useUsers } from '../api/hooks';
import type { ApprovalLevel, Role, User } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { EmptyState, Field, Menu, PageHeader } from '../components/Bits';
import { Chip } from '../components/Chips';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable, type Col } from '../components/DataTable';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { ActionError } from '../components/ReasonModal';
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

  const cols: Col<Row>[] = [
    { key: 'n', label: t.users.colName, header: t.users.colName, sort: (u) => u.fullName, render: (u) => <b>{u.fullName}{u.id === session?.userId && <span className="muted"> {t.users.you}</span>}</b> },
    { key: 'e', label: t.users.colEmail, header: t.users.colEmail, render: (u) => u.email },
    { key: 'r', label: t.users.colRole, header: t.users.colRole, sort: (u) => u.role, render: (u) => <>{t.roles[u.role]}{u.approvalLevel && <span className="sub">{t.approvalLevel[u.approvalLevel]}</span>}</> },
    ...(group ? [{ key: 'en', label: t.users.colEntity, header: t.users.colEntity, render: (u: Row) => (u.entityId ? u.entityName : t.users.group) } as Col<Row>] : []),
    { key: 'erp', label: t.users.colErp, header: t.users.colErp, render: (u) => (u.erpUser ? <span className="mono">{u.erpUser}</span> : '-') },
    { key: 's', label: t.users.colStatus, header: t.users.colStatus, render: (u) => <Chip kind={u.status === 'ACTIVE' ? 'ok' : 'end'}>{t.users.status[u.status]}</Chip> },
    {
      key: 'act', label: '', header: <span className="sr">{t.common.actions}</span>, className: 'row-act',
      render: (u) => (
        <span className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
          <button type="button" className="btn btn-sm" onClick={() => setForm(u)}>{t.common.edit}</button>
          {u.status === 'ACTIVE' && u.id !== session?.userId && <Menu label="" items={[{ label: t.users.deactivate, danger: true, onClick: () => setOff(u) }]} />}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.users.title}
        meta={group ? t.users.introGroup : interpolate(t.users.introEntity, { entity: session?.entityName ?? '' })}
        actions={<button type="button" className="btn btn-primary" onClick={() => setForm('new')}><Icon name="plus" />{t.users.add}</button>}
      />
      <section className="card">
        <div className="filters" role="group" aria-label={t.users.savedViews}>
          <div className="field">
            <label htmlFor="us-role" className="sr">{t.users.roleFilter}</label>
            <select id="us-role" className="select" value={role} onChange={(e) => setRole(e.target.value as '' | Role)}>
              <option value="">{t.users.allRoles}</option>
              {[...ENTITY_ROLES, ...(group ? GROUP_ROLES : [])].map((r) => <option key={r} value={r}>{t.roles[r]}</option>)}
            </select>
          </div>
          {group && (
            <div className="field">
              <label htmlFor="us-ent" className="sr">{t.users.entityFilter}</label>
              <select id="us-ent" className="select" value={entityId} onChange={(e) => setEntityId(e.target.value)}>
                <option value="">{t.users.allEntities}</option>
                {entities.data?.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          )}
          {filtered && <button type="button" className="btn btn-quiet btn-sm" onClick={() => { setRole(''); setEntityId(''); }}>{t.common.clearFilters}</button>}
        </div>
        <Async q={q} isEmpty={(d) => d.length === 0} empty={filtered && all.data?.length ? <EmptyState icon="search" title={t.users.noMatch} /> : <EmptyState icon="users" title={t.users.emptyTitle} text={t.users.emptyText} />}>
          {(d) => <DataTable columns={cols} rows={d} rowKey={(u) => u.id} caption={t.users.title} />}
        </Async>
      </section>
      {form && <UserForm user={form === 'new' ? null : form} group={group} onClose={() => setForm(null)} />}
      {off && (
        <ConfirmDialog title={interpolate(t.users.deactivateTitle, { name: off.fullName })} confirmLabel={t.users.deactivate} danger pending={deact.pending} error={deact.error} onCancel={() => setOff(null)} onConfirm={() => void deact.run(off)}>
          <p>{t.users.deactivateText}</p>
        </ConfirmDialog>
      )}
    </>
  );
}

function UserForm({ user, group, onClose }: { user: Row | null; group: boolean; onClose: () => void }) {
  const { session } = useAuth();
  const entities = useEntities();
  const erp = useQuery({ queryKey: ['erpUsers', getSessionUserId()], queryFn: listErpUsers });
  const [v, setV] = useState({
    fullName: user?.fullName ?? '', email: user?.email ?? '', role: (user?.role ?? 'AP_ACCOUNTANT') as Role, level: (user?.approvalLevel ?? 'DEPARTMENT_HEAD') as ApprovalLevel,
    entityId: user ? user.entityId ?? '' : session?.entityId ?? '', erpUser: user?.erpUser ?? '', password: '',
  });
  const [touched, setTouched] = useState(false);
  const own = user?.id === session?.userId;
  const save = useAction(
    (b: UserInput) => (user ? updateUser(user.id, { ...b, version: user.version }) : createUser(b)),
    { success: user ? t.users.updated : t.users.created, onSuccess: onClose },
  );
  const groupLevel = GROUP_ROLES.includes(v.role);
  const bad = {
    name: !v.fullName.trim(),
    email: !/^\S+@\S+\.\S+$/.test(v.email),
    entity: !groupLevel && !v.entityId,
    pw: !user && v.password.length < 8,
  };
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((x) => ({ ...x, [k]: val }));
  const roles = group ? [...ENTITY_ROLES, ...GROUP_ROLES] : ENTITY_ROLES.filter((r) => r !== 'ENTITY_ADMIN');
  return (
    <Modal
      title={user ? t.users.editTitle : t.users.addTitle}
      onClose={onClose}
      dismissable={!save.pending}
      onSubmit={() => {
        setTouched(true);
        if (Object.values(bad).some(Boolean)) return;
        void save.run({ fullName: v.fullName, email: v.email, role: v.role, entityId: groupLevel ? null : v.entityId, erpUser: v.erpUser.trim() || null, approvalLevel: v.role === 'PAYMENT_APPROVER' ? v.level : null, password: user ? undefined : v.password });
      }}
      footer={<><button type="button" className="btn" onClick={onClose} disabled={save.pending}>{t.common.cancel}</button><button type="submit" className="btn btn-primary" disabled={save.pending}>{save.pending && <span className="spin" />}{t.users.save}</button></>}
    >
      <div className="grid-2">
        <Field label={`${t.users.fullName} ${t.common.required}`} htmlFor="u-name" error={touched && bad.name ? t.common.fieldRequired : null}>
          <input id="u-name" className={`input${touched && bad.name ? ' invalid' : ''}`} value={v.fullName} onChange={(e) => set('fullName', e.target.value)} data-autofocus />
        </Field>
        <Field label={`${t.users.email} ${t.common.required}`} htmlFor="u-email" error={touched && bad.email ? t.users.emailInvalid : null}>
          <input id="u-email" className={`input${touched && bad.email ? ' invalid' : ''}`} type="email" value={v.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
      </div>
      <div className="grid-2">
        <Field label={t.users.role} htmlFor="u-role">
          <select id="u-role" className="select" value={v.role} disabled={own} onChange={(e) => set('role', e.target.value as Role)}>
            {roles.map((r) => <option key={r} value={r}>{t.roles[r]}</option>)}
          </select>
        </Field>
        {v.role === 'PAYMENT_APPROVER' && (
          <Field label={t.users.level} htmlFor="u-level">
            <select id="u-level" className="select" value={v.level} onChange={(e) => set('level', e.target.value as ApprovalLevel)}>
              <option value="DEPARTMENT_HEAD">{t.approvalLevel.DEPARTMENT_HEAD}</option>
              <option value="CFO">{t.approvalLevel.CFO}</option>
            </select>
          </Field>
        )}
      </div>
      {group && !groupLevel && (
        <Field label={`${t.users.entity} ${t.common.required}`} htmlFor="u-ent" error={touched && bad.entity ? t.common.chooseOne : null}>
          <select id="u-ent" className={`select${touched && bad.entity ? ' invalid' : ''}`} value={v.entityId} onChange={(e) => set('entityId', e.target.value)}>
            <option value="">{t.common.choose}</option>
            {entities.data?.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </Field>
      )}
      <Field label={t.users.erpUser} htmlFor="u-erp" hint={t.users.erpHint}>
        <input id="u-erp" className="input" list="u-erp-list" value={v.erpUser} onChange={(e) => set('erpUser', e.target.value)} />
        <datalist id="u-erp-list">{erp.data?.map((x) => <option key={x} value={x} />)}</datalist>
      </Field>
      {!user && (
        <Field label={`${t.users.password} ${t.common.required}`} htmlFor="u-pw" hint={t.users.passwordHint} error={touched && bad.pw ? t.errors.PASSWORD_SHORT : null}>
          <input id="u-pw" className={`input${touched && bad.pw ? ' invalid' : ''}`} type="password" autoComplete="new-password" value={v.password} onChange={(e) => set('password', e.target.value)} />
        </Field>
      )}
      <ActionError error={save.error} raw={save.rawError} />
    </Modal>
  );
}
