import { useState } from 'react';
import type { ProfileInput, ProfileRow } from '../api/recurring';
import { createRecurringProfile, deactivateRecurringProfile, updateRecurringProfile } from '../api/recurring';
import { useProfiles, useSuppliers } from '../api/hooks';
import { Async } from '../components/Async';
import { EmptyState, Field, Menu, PageHeader, Tabs } from '../components/Bits';
import { Chip } from '../components/Chips';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable, type Col } from '../components/DataTable';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { ActionError } from '../components/ReasonModal';
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

  const cols: Col<ProfileRow>[] = [
    { key: 'sup', label: t.recurring.colSupplier, header: t.recurring.colSupplier, sort: (r) => r.supplierName, render: (r) => <><b>{r.supplierName}</b><span className="sub">{r.location}</span></> },
    { key: 'contract', label: t.recurring.colContract, header: t.recurring.colContract, render: (r) => <span className="mono">{r.contract}</span> },
    { key: 'period', label: t.recurring.colPeriod, header: t.recurring.colPeriod, render: (r) => t.recurring.periods[r.period] },
    { key: 'price', label: t.recurring.colPrice, header: t.recurring.colPrice, render: (r) => (r.priceType === 'FIXED' ? `${t.recurring.fixed}: ${fmtMoney(r.contractPrice ?? 0)}` : t.recurring.usage) },
    { key: 'thr', label: t.recurring.colThreshold, header: t.recurring.colThreshold, render: (r) => (r.deviationThreshold ? `${r.deviationThreshold}%` : '-') },
    {
      key: 'earlier', label: t.recurring.colEarlier, header: t.recurring.colEarlier,
      render: (r) => r.earlier.length === 0 ? <span className="muted">{t.recurring.noPeriods}</span> : <><b>{t.recurring.average} {fmtMoney(r.average ?? 0)}</b><span className="sub">{r.earlier.map((e) => `${e.label} ${fmtMoney(e.amount)}`).join(' · ')}</span></>,
    },
    { key: 'status', label: t.recurring.colStatus, header: t.recurring.colStatus, render: (r) => <Chip kind={r.status === 'ACTIVE' ? 'ok' : 'end'}>{t.recurring.status[r.status]}</Chip> },
    {
      key: 'act', label: '', header: <span className="sr">{t.common.actions}</span>, className: 'row-act',
      render: (r) => (
        <span className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
          <button type="button" className="btn btn-sm" onClick={() => setForm(r)}>{t.common.edit}</button>
          {r.status === 'ACTIVE' && <Menu label="" items={[{ label: t.recurring.deactivate, danger: true, onClick: () => setDeact(r) }]} />}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.recurring.title}
        meta={t.recurring.intro}
        actions={<button type="button" className="btn btn-primary" onClick={() => setForm('new')}><Icon name="plus" />{t.recurring.add}</button>}
      />
      <section className="card">
        <Tabs<Tab> label={t.recurring.savedViews} value={tab} onChange={setTab} tabs={(['active', 'inactive', 'all'] as Tab[]).map((s) => ({ id: s, label: t.recurring.views[s], count: q.data ? count(s) : undefined }))} />
        <Async
          q={q}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState icon="repeat" title={t.recurring.emptyTitle} text={t.recurring.emptyText} action={<button type="button" className="btn btn-primary" onClick={() => setForm('new')}>{t.recurring.add}</button>} />}
        >
          {() => (rows.length === 0 ? <EmptyState icon="repeat" title={t.recurring.emptyView} /> : <DataTable columns={cols} rows={rows} rowKey={(r) => r.id} caption={t.recurring.title} />)}
        </Async>
      </section>
      {form && <ProfileForm profile={form === 'new' ? null : form} onClose={() => setForm(null)} />}
      {deact && (
        <ConfirmDialog title={t.recurring.deactivateTitle.replace('{s}', `${deact.supplierName}, ${deact.location}`)} confirmLabel={t.recurring.deactivate} danger pending={off.pending} error={off.error} onCancel={() => setDeact(null)} onConfirm={() => void off.run(deact)}>
          <p>{t.recurring.deactivateText}</p>
        </ConfirmDialog>
      )}
    </>
  );
}

function ProfileForm({ profile, onClose }: { profile: ProfileRow | null; onClose: () => void }) {
  const suppliers = useSuppliers();
  const [v, setV] = useState({
    supplierId: profile?.supplierId ?? '',
    location: profile?.location ?? '',
    contract: profile?.contract ?? '',
    period: profile?.period ?? ('MONTHLY' as ProfileInput['period']),
    priceType: profile?.priceType ?? ('FIXED' as ProfileInput['priceType']),
    price: profile?.contractPrice ? String(profile.contractPrice) : '',
    threshold: profile?.deviationThreshold ? String(profile.deviationThreshold) : '30',
  });
  const [touched, setTouched] = useState(false);
  const save = useAction(
    (b: ProfileInput) => (profile ? updateRecurringProfile(profile.id, { ...b, version: profile.version }) : createRecurringProfile(b)),
    { success: profile ? t.recurring.toastUpdated : t.recurring.toastCreated, onSuccess: onClose },
  );
  const price = Number(v.price.replace(/[^\d]/g, ''));
  const thr = Number(v.threshold.replace(',', '.'));
  const bad = {
    supplier: !v.supplierId,
    location: !v.location.trim(),
    contract: !v.contract.trim(),
    price: v.priceType === 'FIXED' && !(price > 0),
    thr: v.priceType === 'USAGE_BASED' && !(thr > 0),
  };
  const dup = save.rawError && (save.rawError as { code?: string }).code === 'DUPLICATE_PROFILE';
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((x) => ({ ...x, [k]: val }));
  return (
    <Modal
      title={profile ? t.recurring.editTitle : t.recurring.addTitle}
      onClose={onClose}
      dismissable={!save.pending}
      onSubmit={() => {
        setTouched(true);
        if (Object.values(bad).some(Boolean)) return;
        void save.run({ supplierId: v.supplierId, location: v.location, contract: v.contract, period: v.period, priceType: v.priceType, contractPrice: v.priceType === 'FIXED' ? price : null, deviationThreshold: v.priceType === 'USAGE_BASED' ? thr : null });
      }}
      footer={<><button type="button" className="btn" onClick={onClose} disabled={save.pending}>{t.common.cancel}</button><button type="submit" className="btn btn-primary" disabled={save.pending}>{save.pending && <span className="spin" />}{t.recurring.save}</button></>}
    >
      {dup && <ActionError error={t.errors.DUPLICATE_PROFILE} />}
      <Field label={`${t.recurring.colSupplier} ${t.common.required}`} htmlFor="rp-sup" error={touched && bad.supplier ? t.common.chooseOne : null}>
        <select id="rp-sup" className={`select${touched && bad.supplier ? ' invalid' : ''}`} value={v.supplierId} onChange={(e) => set('supplierId', e.target.value)} data-autofocus>
          <option value="">{t.common.choose}</option>
          {suppliers.data?.filter((s) => s.country === 'VN').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <div className="grid-2">
        <Field label={`${t.recurring.location} ${t.common.required}`} htmlFor="rp-loc" error={touched && bad.location ? t.common.fieldRequired : null}>
          <input id="rp-loc" className={`input${touched && bad.location ? ' invalid' : ''}`} value={v.location} onChange={(e) => set('location', e.target.value)} />
        </Field>
        <Field label={`${t.recurring.colContract} ${t.common.required}`} htmlFor="rp-con" error={touched && bad.contract ? t.common.fieldRequired : null}>
          <input id="rp-con" className={`input${touched && bad.contract ? ' invalid' : ''}`} value={v.contract} onChange={(e) => set('contract', e.target.value)} />
        </Field>
      </div>
      <div className="grid-2">
        <Field label={t.recurring.colPeriod} htmlFor="rp-per">
          <select id="rp-per" className="select" value={v.period} onChange={(e) => set('period', e.target.value as ProfileInput['period'])}>
            <option value="MONTHLY">{t.recurring.periods.MONTHLY}</option>
            <option value="QUARTERLY">{t.recurring.periods.QUARTERLY}</option>
          </select>
        </Field>
        <Field label={t.recurring.priceType} htmlFor="rp-type">
          <select id="rp-type" className="select" value={v.priceType} onChange={(e) => set('priceType', e.target.value as ProfileInput['priceType'])}>
            <option value="FIXED">{t.recurring.fixedPrice}</option>
            <option value="USAGE_BASED">{t.recurring.usage}</option>
          </select>
        </Field>
      </div>
      {v.priceType === 'FIXED' ? (
        <Field label={`${t.recurring.contractPrice} ${t.common.required}`} htmlFor="rp-price" error={touched && bad.price ? t.recurring.priceRequired : null}>
          <input id="rp-price" className={`input${touched && bad.price ? ' invalid' : ''}`} inputMode="numeric" value={v.price} onChange={(e) => set('price', e.target.value)} />
        </Field>
      ) : (
        <Field label={`${t.recurring.threshold} ${t.common.required}`} htmlFor="rp-thr" hint={t.recurring.thresholdHint} error={touched && bad.thr ? t.recurring.thresholdRequired : null}>
          <input id="rp-thr" className={`input${touched && bad.thr ? ' invalid' : ''}`} inputMode="decimal" value={v.threshold} onChange={(e) => set('threshold', e.target.value)} />
        </Field>
      )}
      {!dup && <ActionError error={save.error} raw={save.rawError} />}
    </Modal>
  );
}
