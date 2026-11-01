import { useEffect, useState } from 'react';
import { replaceApprovalMatrix } from '../api/admin';
import { useMatrix } from '../api/hooks';
import type { ApprovalMatrix as Matrix, ApprovalTier, User } from '../api/types';
import { Async } from '../components/Async';
import { Field, Notice, PageHeader } from '../components/Bits';
import { ActionError } from '../components/ReasonModal';
import { fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

/** SCR-74 Approval Matrix: two levels by total amount (BR-03), the boundary and the approvers of each level are editable. */
export function ApprovalMatrix() {
  const q = useMatrix();
  return <Async q={q} skeletonRows={7}>{(d) => <Form matrix={d.matrix} approvers={d.approvers} />}</Async>;
}

function Form({ matrix, approvers }: { matrix: Matrix; approvers: User[] }) {
  const low = matrix.tiers[0]!;
  const high = matrix.tiers[1] ?? { level: 'CFO' as const, from: low.upTo ?? 0, upTo: null, approverIds: [] };
  const init = { boundary: String(low.upTo ?? high.from), low: low.approverIds, high: high.approverIds };
  const [v, setV] = useState(init);
  const [touched, setTouched] = useState(false);
  useEffect(() => { setV(init); setTouched(false); }, [matrix.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const boundary = Number(v.boundary.replace(/[^\d]/g, ''));
  const dirty = String(boundary) !== init.boundary || v.low.join() !== init.low.join() || v.high.join() !== init.high.join();
  const badBoundary = !(boundary > 0);
  const tiers: ApprovalTier[] = [
    { level: low.level, from: 0, upTo: boundary, approverIds: v.low },
    { level: high.level, from: boundary, upTo: null, approverIds: v.high },
  ];
  const save = useAction(() => replaceApprovalMatrix({ tiers, version: matrix.version }), { success: t.matrix.saved });
  const toggle = (key: 'low' | 'high', id: string) => setV((x) => ({ ...x, [key]: x[key].includes(id) ? x[key].filter((y) => y !== id) : [...x[key], id] }));
  const active = approvers.filter((a) => a.status === 'ACTIVE');
  const names = (ids: string[]) => ids.map((id) => approvers.find((a) => a.id === id)?.fullName).filter(Boolean).join(', ') || t.matrix.none;
  const tierCard = (key: 'low' | 'high', n: number, tier: ApprovalTier) => (
    <section className="card" key={key} aria-labelledby={`mx-${key}`}>
      <div className="card-h"><h2 id={`mx-${key}`}>{interpolate(t.matrix.tier, { n })}: {t.approvalLevel[tier.level]}</h2><span className="xs muted">{key === 'low' ? `${t.matrix.from} ${fmtMoney(0)}, ${t.matrix.upTo.toLowerCase()} ${fmtMoney(boundary || 0)}` : `${t.matrix.from} ${fmtMoney(boundary || 0)}, ${t.matrix.noUpper.toLowerCase()}`}</span></div>
      <fieldset className="card-b" style={{ border: 0, margin: 0 }}>
        <legend className="lbl">{t.matrix.approvers}</legend>
        {active.length === 0 ? <p className="small muted">{t.matrix.noApprover}</p> : (
          <div className="stack" style={{ gap: 6 }}>
            {active.map((a) => (
              <label key={a.id} className="row" style={{ gap: 8 }}>
                <input type="checkbox" checked={v[key].includes(a.id)} onChange={() => toggle(key, a.id)} />
                {a.fullName} <span className="muted">({a.approvalLevel ? t.approvalLevel[a.approvalLevel] : ''})</span>
              </label>
            ))}
          </div>
        )}
        <p className="xs muted" style={{ marginTop: 8 }}>{t.matrix.approversHint}</p>
      </fieldset>
    </section>
  );
  return (
    <>
      <PageHeader title={t.matrix.title} meta={t.matrix.intro} />
      <form className="stack-lg" onSubmit={(e) => { e.preventDefault(); setTouched(true); if (badBoundary) return; void save.run(undefined); }} noValidate>
        <section className="card">
          <div className="card-b">
            <Field label={t.matrix.boundary} htmlFor="mx-boundary" hint={t.matrix.boundaryHint} error={touched && badBoundary ? t.errors.LIMIT_INVALID : null}>
              <input id="mx-boundary" className={`input${touched && badBoundary ? ' invalid' : ''}`} inputMode="numeric" value={v.boundary} onChange={(e) => setV({ ...v, boundary: e.target.value })} />
            </Field>
          </div>
        </section>
        <div className="grid-2">{tierCard('low', 1, tiers[0]!)}{tierCard('high', 2, tiers[1]!)}</div>
        <Notice kind="rule" title={t.matrix.preview}>
          {tiers.map((x) => interpolate(t.matrix.previewLine, { level: t.approvalLevel[x.level], range: x.upTo === null ? `${fmtMoney(x.from)} ${t.matrix.noUpper.toLowerCase()}` : `0 - ${fmtMoney(x.upTo)}`, names: names(x.approverIds) })).join(' | ')}
        </Notice>
        <ActionError error={save.error} raw={save.rawError} />
        <div className="save-bar">
          <span className={dirty ? 'dirty' : 'xs muted'}>{dirty ? t.matrix.dirty : ''}</span>
          <span className="row">
            <button type="button" className="btn" disabled={!dirty || save.pending} onClick={() => { setV(init); setTouched(false); save.reset(); }}>{t.matrix.discard}</button>
            <button type="submit" className="btn btn-primary" disabled={!dirty || save.pending}>{save.pending && <span className="spin" />}{t.matrix.save}</button>
          </span>
        </div>
      </form>
    </>
  );
}
