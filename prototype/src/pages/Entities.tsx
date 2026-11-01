import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addSector, createEntity, listSectors, removeSector, updateGroupLimits } from '../api/admin';
import { getSessionUserId } from '../api/client';
import { useEntities, useGroup } from '../api/hooks';
import type { Entity } from '../api/types';
import { Async } from '../components/Async';
import { EmptyState, Field, Notice, PageHeader } from '../components/Bits';
import { DataTable, type Col } from '../components/DataTable';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { ActionError } from '../components/ReasonModal';
import { fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

/** SCR-76 Entities and Group Limits, with SCR-77 (add entity) as a modal. */
export function Entities() {
  const q = useEntities();
  const [adding, setAdding] = useState(false);
  const cols: Col<Entity>[] = [
    { key: 'n', label: t.entities.colName, header: t.entities.colName, sort: (e) => e.name, render: (e) => <b>{e.name}</b> },
    { key: 'tax', label: t.entities.colTax, header: t.entities.colTax, render: (e) => <span className="mono">{e.taxCode}</span> },
    { key: 'tol', label: t.entities.colTol, header: t.entities.colTol, render: (e) => `${e.priceTolerance}%` },
    { key: 'thr', label: t.entities.colThr, header: t.entities.colThr, className: 'money', render: (e) => fmtMoney(e.batchThreshold) },
    { key: 'rate', label: t.entities.colSample, header: t.entities.colSample, render: (e) => `${e.sampleRate}%` },
    { key: 'mb', label: t.entities.colMailbox, header: t.entities.colMailbox, render: (e) => e.mailbox },
  ];
  return (
    <>
      <PageHeader title={t.entities.title} meta={t.entities.intro} actions={<button type="button" className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" />{t.entities.add}</button>} />
      <section className="card">
        <Async q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState icon="building" title={t.entities.emptyTitle} action={<button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>{t.entities.add}</button>} />}>
          {(d) => <DataTable columns={cols} rows={d} rowKey={(e) => e.id} caption={t.entities.title} />}
        </Async>
      </section>
      <div className="grid-2">
        <Limits />
        <Sectors />
      </div>
      {adding && <AddEntity onClose={() => setAdding(false)} />}
    </>
  );
}

function Limits() {
  const q = useGroup();
  return (
    <section className="card" aria-labelledby="lim-h">
      <div className="card-h"><h2 id="lim-h">{t.entities.limitsTitle}</h2></div>
      <Async q={q} skeletonRows={3}>{(g) => <LimitsForm key={g.version} g={g} />}</Async>
    </section>
  );
}

function LimitsForm({ g }: { g: { maxPriceTolerance: number; maxBatchThreshold: number; version: number } }) {
  const [tol, setTol] = useState(String(g.maxPriceTolerance));
  const [thr, setThr] = useState(String(g.maxBatchThreshold));
  const [touched, setTouched] = useState(false);
  const [lowered, setLowered] = useState<string | null>(null);
  const tolN = Number(tol.replace(',', '.'));
  const thrN = Number(thr.replace(/[^\d]/g, ''));
  const bad = { tol: !(tolN > 0), thr: !(thrN > 0) };
  const dirty = tolN !== g.maxPriceTolerance || thrN !== g.maxBatchThreshold;
  const save = useAction(() => updateGroupLimits({ maxPriceTolerance: tolN, maxBatchThreshold: thrN, version: g.version }), {
    success: t.entities.limitsSaved,
    onSuccess: (r) => setLowered(r.lowered.length ? interpolate(t.entities.lowered, { names: r.lowered.map((x) => x.name).join(', '), to: r.lowered[0]!.to }) : null),
  });
  return (
    <form className="card-b stack" noValidate onSubmit={(e) => { e.preventDefault(); setTouched(true); if (bad.tol || bad.thr) return; void save.run(undefined); }}>
      <Field label={t.entities.maxTol} htmlFor="lim-tol" error={touched && bad.tol ? t.errors.LIMIT_INVALID : null}><input id="lim-tol" className={`input${touched && bad.tol ? ' invalid' : ''}`} inputMode="decimal" value={tol} onChange={(e) => setTol(e.target.value)} /></Field>
      <Field label={t.entities.maxThr} htmlFor="lim-thr" hint={t.entities.limitsHint} error={touched && bad.thr ? t.errors.LIMIT_INVALID : null}><input id="lim-thr" className={`input${touched && bad.thr ? ' invalid' : ''}`} inputMode="numeric" value={thr} onChange={(e) => setThr(e.target.value)} /></Field>
      {lowered && <Notice kind="warn">{lowered}</Notice>}
      <ActionError error={save.error} raw={save.rawError} />
      <div><button type="submit" className="btn btn-primary" disabled={!dirty || save.pending}>{save.pending && <span className="spin" />}{t.entities.saveLimits}</button></div>
    </form>
  );
}

function Sectors() {
  const q = useQuerySectors();
  const [name, setName] = useState('');
  const add = useAction((n: string) => addSector(n), { success: t.entities.sectorAdded, onSuccess: () => setName('') });
  const del = useAction((n: string) => removeSector(n), { success: t.entities.sectorRemoved });
  return (
    <section className="card" aria-labelledby="sec-h">
      <div className="card-h"><h2 id="sec-h">{t.entities.sectorsTitle}</h2></div>
      <div className="card-b stack">
        <p className="small muted">{t.entities.sectorsHint}</p>
        <Async q={q} skeletonRows={3}>
          {(list) => (list.length === 0 ? <p className="small muted">{t.entities.noSectors}</p> : (
            <ul className="stack" style={{ gap: 4, listStyle: 'none', padding: 0, margin: 0 }}>
              {list.map((s) => (
                <li key={s} className="row spread"><span>{s}</span><button type="button" className="btn btn-quiet btn-sm" aria-label={interpolate(t.entities.removeSector, { s })} onClick={() => void del.run(s)} disabled={del.pending}><Icon name="x" small /></button></li>
              ))}
            </ul>
          ))}
        </Async>
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (name.trim()) void add.run(name.trim()); }}>
          <label className="sr" htmlFor="sec-name">{t.entities.sectorName}</label>
          <input id="sec-name" className="input grow" placeholder={t.entities.sectorName} value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="btn" disabled={!name.trim() || add.pending}>{t.entities.addSector}</button>
        </form>
        <ActionError error={add.error ?? del.error} raw={add.rawError ?? del.rawError} />
      </div>
    </section>
  );
}

const useQuerySectors = () => useQuery({ queryKey: ['sectors', getSessionUserId()], queryFn: listSectors });

function AddEntity({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [tax, setTax] = useState('');
  const [touched, setTouched] = useState(false);
  const save = useAction(() => createEntity({ name, taxCode: tax }), { success: t.entities.added, onSuccess: onClose });
  const bad = { name: !name.trim(), tax: !/^\d{10}$/.test(tax.trim()) };
  return (
    <Modal
      title={t.entities.addTitle}
      onClose={onClose}
      dismissable={!save.pending}
      onSubmit={() => { setTouched(true); if (bad.name || bad.tax) return; void save.run(undefined); }}
      footer={<><button type="button" className="btn" onClick={onClose} disabled={save.pending}>{t.common.cancel}</button><button type="submit" className="btn btn-primary" disabled={save.pending}>{save.pending && <span className="spin" />}{t.entities.save}</button></>}
    >
      <Field label={`${t.entities.name} ${t.common.required}`} htmlFor="en-name" error={touched && bad.name ? t.common.fieldRequired : null}><input id="en-name" className={`input${touched && bad.name ? ' invalid' : ''}`} value={name} onChange={(e) => setName(e.target.value)} data-autofocus /></Field>
      <Field label={`${t.entities.taxCode} ${t.common.required}`} htmlFor="en-tax" hint={t.entities.taxHint} error={touched && bad.tax ? t.errors.TAX_CODE_INVALID : null}><input id="en-tax" className={`input${touched && bad.tax ? ' invalid' : ''}`} inputMode="numeric" maxLength={10} value={tax} onChange={(e) => setTax(e.target.value)} /></Field>
      <ActionError error={save.error} raw={save.rawError} />
    </Modal>
  );
}
