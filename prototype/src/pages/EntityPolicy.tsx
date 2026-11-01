import { useEffect, useState } from 'react';
import { updateEntityPolicy } from '../api/admin';
import { ApiError } from '../api/client';
import { usePolicy } from '../api/hooks';
import type { Entity } from '../api/types';
import { Async } from '../components/Async';
import { Field, Notice, PageHeader } from '../components/Bits';
import { ActionError } from '../components/ReasonModal';
import { fmtDecimal, fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { errorText } from '../lib/errors';
import { t } from '../i18n/vi';

const digits = (s: string): number => Number(s.replace(/[^\d]/g, ''));
const dec = (s: string): number => Number(s.replace(',', '.'));

/** SCR-73 Entity Policy: tolerance, batch threshold, sample rate and grouping, never above the group limits. */
export function EntityPolicy() {
  const q = usePolicy();
  return (
    <>
      <Async q={q} skeletonRows={7}>{(d) => <Form entity={d.entity} max={{ tolerance: d.group.maxPriceTolerance, threshold: d.group.maxBatchThreshold }} />}</Async>
    </>
  );
}

function Form({ entity, max }: { entity: Entity; max: { tolerance: number; threshold: number } }) {
  const init = { tol: fmtDecimal(entity.priceTolerance, 1).replace(',0', ''), thr: String(entity.batchThreshold), rate: String(entity.sampleRate), grouping: entity.grouping };
  const [v, setV] = useState(init);
  const [touched, setTouched] = useState(false);
  // A fresh version from the server (after a save or a reload) resets the form.
  useEffect(() => { setV(init); setTouched(false); }, [entity.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = v.tol !== init.tol || v.thr !== init.thr || v.rate !== init.rate || v.grouping !== init.grouping;
  const tol = dec(v.tol);
  const thr = digits(v.thr);
  const rate = dec(v.rate);
  const bad = { tol: !(tol > 0) || tol > max.tolerance, thr: !(thr > 0) || thr > max.threshold, rate: !(rate >= 1 && rate <= 100) };
  const save = useAction(() => updateEntityPolicy({ priceTolerance: tol, batchThreshold: thr, sampleRate: rate, grouping: v.grouping, version: entity.version }), { success: t.policy.saved });
  const serverFields = save.rawError instanceof ApiError && save.rawError.code === 'POLICY_INVALID' ? save.rawError.params : null;
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((x) => ({ ...x, [k]: val }));
  return (
    <>
      <PageHeader title={t.policy.title} meta={interpolate(t.policy.intro, { entity: entity.name })} />
      <Notice kind="info" icon="network" title={t.policy.groupLimits}>{interpolate(t.policy.maxTolerance, { n: max.tolerance })}. {interpolate(t.policy.maxThreshold, { n: fmtMoney(max.threshold) })}.</Notice>
      <form
        className="card"
        onSubmit={(e) => { e.preventDefault(); setTouched(true); if (Object.values(bad).some(Boolean)) return; void save.run(undefined); }}
        noValidate
      >
        <div className="card-b stack-lg">
          <div className="fld-row">
            <Field label={t.policy.tolerance} htmlFor="pol-tol" hint={interpolate(t.policy.toleranceHint, { max: max.tolerance })} error={(touched && bad.tol) || serverFields?.priceTolerance !== undefined ? interpolate(t.policy.overMax, { max: `${max.tolerance}%` }) : null}>
              <input id="pol-tol" className={`input${touched && bad.tol ? ' invalid' : ''}`} inputMode="decimal" value={v.tol} onChange={(e) => set('tol', e.target.value)} />
            </Field>
            <Field label={t.policy.threshold} htmlFor="pol-thr" hint={interpolate(t.policy.thresholdHint, { max: fmtMoney(max.threshold) })} error={(touched && bad.thr) || serverFields?.batchThreshold !== undefined ? interpolate(t.policy.overMax, { max: fmtMoney(max.threshold) }) : null}>
              <input id="pol-thr" className={`input${touched && bad.thr ? ' invalid' : ''}`} inputMode="numeric" value={v.thr} onChange={(e) => set('thr', e.target.value)} />
            </Field>
          </div>
          <div className="fld-row">
            <Field label={t.policy.sampleRate} htmlFor="pol-rate" hint={t.policy.sampleHint} error={touched && bad.rate ? t.policy.invalid : null}>
              <input id="pol-rate" className={`input${touched && bad.rate ? ' invalid' : ''}`} inputMode="decimal" value={v.rate} onChange={(e) => set('rate', e.target.value)} />
            </Field>
            <Field label={t.policy.grouping} htmlFor="pol-grp">
              <select id="pol-grp" className="select" value={v.grouping} onChange={(e) => set('grouping', e.target.value as Entity['grouping'])}>
                {(['BY_SUPPLIER', 'PER_INVOICE'] as const).map((g) => <option key={g} value={g}>{t.policy.groupingOptions[g]}</option>)}
              </select>
            </Field>
          </div>
          <p className="xs muted">{t.policy.effect}</p>
          {serverFields ? <Notice kind="err">{errorText(save.rawError)}</Notice> : <ActionError error={save.error} raw={save.rawError} />}
        </div>
        <div className="save-bar">
          <span className={dirty ? 'dirty' : 'xs muted'}>{dirty ? t.policy.dirty : ''}</span>
          <span className="row">
            <button type="button" className="btn" disabled={!dirty || save.pending} onClick={() => { setV(init); setTouched(false); save.reset(); }}>{t.policy.discard}</button>
            <button type="submit" className="btn btn-primary" disabled={!dirty || save.pending}>{save.pending && <span className="spin" />}{t.policy.save}</button>
          </span>
        </div>
      </form>
    </>
  );
}
