import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createDelegation, listDelegateCandidates, revokeDelegation, type DelegationRow } from '../api/signing';
import { getSessionUserId } from '../api/client';
import { useDelegations } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState, Field, Notice, PageHeader, Tabs } from '../components/Bits';
import { Chip } from '../components/Chips';
import { DataTable, type Col } from '../components/DataTable';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { ActionError } from '../components/ReasonModal';
import { fmtDate, interpolate, parseDate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

type Tab = 'current' | 'past' | 'all';
const STATE_KIND = { SCHEDULED: 'wait', ACTIVE: 'ok', ENDED: 'end', REVOKED: 'bad' } as const;

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

  const cols: Col<DelegationRow>[] = [
    { key: 'a', label: t.delegations.colDelegator, header: t.delegations.colDelegator, render: (d) => <>{d.delegatorName}{d.mine === 'GAVE' && <span className="muted"> {t.delegations.you}</span>}</> },
    { key: 'b', label: t.delegations.colDelegate, header: t.delegations.colDelegate, render: (d) => <>{d.delegateName}{d.mine === 'RECEIVED' && <span className="muted"> {t.delegations.you}</span>}</> },
    { key: 'f', label: t.delegations.colFrom, header: t.delegations.colFrom, sort: (d) => d.from, render: (d) => fmtDate(d.from) },
    { key: 'to', label: t.delegations.colTo, header: t.delegations.colTo, sort: (d) => d.to, render: (d) => fmtDate(d.to) },
    { key: 'r', label: t.delegations.colReason, header: t.delegations.colReason, render: (d) => d.reason },
    { key: 's', label: t.delegations.colState, header: t.delegations.colState, render: (d) => <Chip kind={STATE_KIND[d.state]}>{t.delegations.states[d.state]}</Chip> },
    {
      key: 'act', label: '', header: <span className="sr">{t.common.actions}</span>, className: 'row-act',
      render: (d) => ((d.state === 'ACTIVE' || d.state === 'SCHEDULED') && (admin || d.mine === 'GAVE') ? <button type="button" className="btn btn-sm" onClick={() => setRev(d)}>{t.delegations.revoke}</button> : null),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.delegations.title}
        readOnly={admin}
        meta={admin ? interpolate(t.delegations.introAdmin, { entity: session?.entityName ?? '' }) : t.delegations.introSigner}
        actions={!admin && <button type="button" className="btn btn-primary" onClick={() => setForm(true)}><Icon name="plus" />{t.delegations.new}</button>}
      />
      {gave && <Notice kind="info" icon="handover">{interpolate(t.delegations.activeGave, { who: gave.delegateName, date: fmtDate(gave.to) })}</Notice>}
      {got.map((d) => <Notice key={d.id} kind="info" icon="handover">{interpolate(t.delegations.activeReceived, { who: d.delegatorName, date: fmtDate(d.to) })}</Notice>)}
      <section className="card">
        <Tabs<Tab> label={t.delegations.savedViews} value={tab} onChange={setTab} tabs={(['current', 'past', 'all'] as Tab[]).map((k) => ({ id: k, label: t.delegations.views[k], count: q.data ? { current: cur.length, past: past.length, all: all.length }[k] : undefined }))} />
        <Async
          q={q}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState icon="handover" title={t.delegations.emptyTitle} text={admin ? t.delegations.emptyAdmin : t.delegations.emptyText} action={!admin ? <button type="button" className="btn btn-primary" onClick={() => setForm(true)}>{t.delegations.new}</button> : undefined} />}
        >
          {() => (rows.length === 0 ? <EmptyState icon="handover" title={t.delegations.emptyTitle} /> : <DataTable columns={cols} rows={rows} rowKey={(d) => d.id} caption={t.delegations.title} />)}
        </Async>
        <p className="xs muted" style={{ padding: '8px 16px 12px' }}>{t.delegations.immutable}</p>
      </section>
      {form && <DelegationForm onClose={() => setForm(false)} />}
      {rev && <RevokeDialog d={rev} onClose={() => setRev(null)} />}
    </>
  );
}

function RevokeDialog({ d, onClose }: { d: DelegationRow; onClose: () => void }) {
  const act = useAction(() => revokeDelegation(d.id), { success: t.delegations.revoked, onSuccess: onClose });
  const v = { a: d.delegatorName, b: d.delegateName, from: fmtDate(d.from), to: fmtDate(d.to) };
  return (
    <ConfirmDialog title={interpolate(t.delegations.revokeTitle, v)} confirmLabel={t.delegations.revoke} danger pending={act.pending} error={act.error} onCancel={onClose} onConfirm={() => void act.run(undefined)}>
      <p>{interpolate(t.delegations.revokeText, v)}</p>
    </ConfirmDialog>
  );
}

function DelegationForm({ onClose }: { onClose: () => void }) {
  const cand = useQuery({ queryKey: ['delegateCandidates', getSessionUserId()], queryFn: listDelegateCandidates });
  const [v, setV] = useState({ delegateId: '', from: '', to: '', reason: '' });
  const [touched, setTouched] = useState(false);
  const from = parseDate(v.from);
  const to = parseDate(v.to);
  const bad = { delegate: !v.delegateId, from: !from, to: !to, reason: !v.reason.trim() };
  const save = useAction(() => createDelegation({ delegateId: v.delegateId, from, to, reason: v.reason.trim() }), { success: t.delegations.created, onSuccess: onClose });
  const set = (k: keyof typeof v, val: string) => setV((x) => ({ ...x, [k]: val }));
  return (
    <Modal
      title={t.delegations.formTitle}
      onClose={onClose}
      dismissable={!save.pending}
      onSubmit={() => { setTouched(true); if (Object.values(bad).some(Boolean)) return; void save.run(undefined); }}
      footer={<><button type="button" className="btn" onClick={onClose} disabled={save.pending}>{t.common.cancel}</button><button type="submit" className="btn btn-primary" disabled={save.pending}>{save.pending && <span className="spin" />}{t.delegations.create}</button></>}
    >
      <Notice kind="warn" icon="lock">{t.delegations.warnSelf}</Notice>
      <Field label={`${t.delegations.delegate} ${t.common.required}`} htmlFor="dg-who" error={touched && bad.delegate ? t.common.chooseOne : null}>
        <select id="dg-who" className={`select${touched && bad.delegate ? ' invalid' : ''}`} value={v.delegateId} onChange={(e) => set('delegateId', e.target.value)} data-autofocus>
          <option value="">{t.common.choose}</option>
          {cand.data?.map((u) => <option key={u.id} value={u.id}>{u.fullName}, {t.roles[u.role]}{u.approvalLevel ? ` (${t.approvalLevel[u.approvalLevel]})` : ''}</option>)}
        </select>
      </Field>
      <div className="grid-2">
        <Field label={`${t.delegations.from} ${t.common.required}`} htmlFor="dg-from" hint="dd/MM/yyyy" error={touched && bad.from ? t.errors.DATES_REQUIRED : null}>
          <input id="dg-from" className={`input${touched && bad.from ? ' invalid' : ''}`} placeholder="dd/MM/yyyy" value={v.from} onChange={(e) => set('from', e.target.value)} />
        </Field>
        <Field label={`${t.delegations.to} ${t.common.required}`} htmlFor="dg-to" hint={t.delegations.max30} error={touched && bad.to ? t.errors.DATES_REQUIRED : null}>
          <input id="dg-to" className={`input${touched && bad.to ? ' invalid' : ''}`} placeholder="dd/MM/yyyy" value={v.to} onChange={(e) => set('to', e.target.value)} />
        </Field>
      </div>
      <Field label={`${t.delegations.reason} ${t.common.required}`} htmlFor="dg-reason" error={touched && bad.reason ? t.common.reasonRequired : null}>
        <input id="dg-reason" className={`input${touched && bad.reason ? ' invalid' : ''}`} value={v.reason} onChange={(e) => set('reason', e.target.value)} />
      </Field>
      <ActionError error={save.error} raw={save.rawError} />
    </Modal>
  );
}
