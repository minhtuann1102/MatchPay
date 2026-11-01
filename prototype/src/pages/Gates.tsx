import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { closeGate, openGate, type GateRow } from '../api/admin';
import { useEntities, useGates } from '../api/hooks';
import { Async } from '../components/Async';
import { EmptyState, Field, Notice, PageHeader, Tabs } from '../components/Bits';
import { Chip } from '../components/Chips';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable, type Col } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ActionError } from '../components/ReasonModal';
import { fmtDate, fmtPercent, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

type View = 'all' | 'alerts' | 'open' | 'closed';

/** SCR-75/78 Automation Gates list with SCR-79 (open a gate, close a gate) as dialogs. Group Admin only. */
export function Gates() {
  const [sp, setSp] = useSearchParams();
  const view = (['all', 'alerts', 'open', 'closed'].includes(sp.get('view') ?? '') ? sp.get('view') : 'all') as View;
  const entityId = sp.get('entity') ?? '';
  const q = useGates();
  const entities = useEntities();
  const [opening, setOpening] = useState<GateRow | null>(null);
  const [closing, setClosing] = useState<GateRow | null>(null);
  const set = (k: string, v: string | null) => setSp((p) => { const n = new URLSearchParams(p); if (v) n.set(k, v); else n.delete(k); return n; }, { replace: true });

  const all = (q.data ?? []).filter((g) => !entityId || g.entityId === entityId);
  const counts: Record<View, number> = { all: all.length, alerts: all.filter((g) => g.alert).length, open: all.filter((g) => g.state === 'OPEN').length, closed: all.filter((g) => g.state === 'CLOSED').length };
  const rows = all.filter((g) => view === 'all' || (view === 'alerts' ? !!g.alert : view === 'open' ? g.state === 'OPEN' : g.state === 'CLOSED'));

  const cols: Col<GateRow>[] = [
    { key: 's', label: t.gates.colSupplier, header: t.gates.colSupplier, sort: (g) => g.supplierName, render: (g) => <b>{g.supplierName}</b> },
    { key: 'e', label: t.gates.colEntity, header: t.gates.colEntity, sort: (g) => g.entityName, render: (g) => g.entityName },
    { key: 'st', label: t.gates.colState, header: t.gates.colState, render: (g) => <><Chip kind={g.state === 'OPEN' ? 'ok' : 'end'}>{t.gates.states[g.state]}</Chip>{g.openSince && <span className="sub">{interpolate(t.gates.since, { d: fmtDate(g.openSince) })}</span>}</> },
    { key: 'acc', label: t.gates.colAccuracy, header: t.gates.colAccuracy, sort: (g) => g.accuracy, render: (g) => (g.compared ? interpolate(t.gates.accuracyValue, { a: fmtPercent(g.accuracy), u: g.unchanged, n: g.compared }) : '-') },
    { key: 'cmp', label: t.gates.colCompared, header: t.gates.colCompared, className: 'money', sort: (g) => g.compared, render: (g) => g.compared },
    { key: 'smp', label: t.gates.colSample, header: t.gates.colSample, render: (g) => <>{interpolate(t.gates.sampleValue, { e: g.sampleErrors, n: g.sampled })}{g.alert && <span className="sub"><Chip kind="exc">{interpolate(t.gates.alert, { rate: fmtPercent(g.alert.rate) })}</Chip></span>}</> },
    {
      key: 'act', label: '', header: <span className="sr">{t.gates.colAction}</span>, className: 'row-act',
      render: (g) => (g.state === 'CLOSED' ? <button type="button" className="btn btn-sm" onClick={() => setOpening(g)}>{t.gates.open}</button> : <button type="button" className="btn btn-sm" onClick={() => setClosing(g)}>{t.gates.close}</button>),
    },
  ];

  return (
    <>
      <PageHeader title={t.gates.title} meta={t.gates.intro} />
      {q.data && q.data.length > 0 && (
        <div className="kpis">
          <div className="tile"><span className="t-lbl">{t.gates.kOpen}</span><span className="t-val">{counts.open}</span></div>
          <div className="tile"><span className="t-lbl">{t.gates.kClosed}</span><span className="t-val">{counts.closed}</span></div>
          <button type="button" className="tile t-warn" onClick={() => set('view', 'alerts')}><span className="t-lbl">{t.gates.kAlerts}</span><span className="t-val">{counts.alerts}</span></button>
        </div>
      )}
      <section className="card">
        <Tabs<View> label={t.gates.savedViews} value={view} onChange={(v) => set('view', v === 'all' ? null : v)} tabs={(['all', 'alerts', 'open', 'closed'] as View[]).map((k) => ({ id: k, label: t.gates.views[k], count: q.data ? counts[k] : undefined, tone: k === 'alerts' && counts.alerts ? 'warn' : undefined }))} />
        <div className="filters">
          <div className="field">
            <label htmlFor="g-ent" className="sr">{t.gates.entityFilter}</label>
            <select id="g-ent" className="select" value={entityId} onChange={(e) => set('entity', e.target.value || null)}>
              <option value="">{t.gates.allEntities}</option>
              {entities.data?.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>
        <Async q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState icon="unlock" title={t.gates.emptyTitle} text={t.gates.emptyText} />}>
          {() => (rows.length === 0 ? <EmptyState icon="search" title={t.gates.noMatch} action={<button type="button" className="btn" onClick={() => setSp({}, { replace: true })}>{t.common.clearFilters}</button>} /> : <DataTable columns={cols} rows={rows} rowKey={(g) => g.id} caption={t.gates.title} />)}
        </Async>
      </section>
      {opening && <OpenModal g={opening} onClose={() => setOpening(null)} />}
      {closing && <CloseDialog g={closing} onClose={() => setClosing(null)} />}
    </>
  );
}

function OpenModal({ g, onClose }: { g: GateRow; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const tooFew = g.compared < 50;
  const low = g.accuracy < 98;
  const bad = low && !reason.trim();
  const act = useAction(() => openGate(g.id, { reason: reason.trim() || undefined, version: g.version }), { success: t.gates.opened, onSuccess: onClose });
  return (
    <Modal
      title={interpolate(t.gates.openTitle, { s: g.supplierName, e: g.entityName })}
      onClose={onClose}
      dismissable={!act.pending}
      onSubmit={() => { setTouched(true); if (tooFew || bad) return; void act.run(undefined); }}
      footer={<><button type="button" className="btn" onClick={onClose} disabled={act.pending}>{t.common.cancel}</button><button type="submit" className="btn btn-primary" disabled={act.pending || tooFew}>{act.pending && <span className="spin" />}{t.gates.open}</button></>}
    >
      <section aria-label={t.gates.evidence}>
        <dl className="dl">
          <dt>{t.gates.colCompared}</dt><dd>{g.compared}</dd>
          <dt>{t.gates.simulated}</dt><dd>{g.simulatedCompared}</dd>
          <dt>{t.gates.colAccuracy}</dt><dd>{g.compared ? interpolate(t.gates.accuracyValue, { a: fmtPercent(g.accuracy), u: g.unchanged, n: g.compared }) : '-'}</dd>
          <dt>{t.gates.sampleErrors}</dt><dd>{interpolate(t.gates.sampleValue, { e: g.sampleErrors, n: g.sampled })}</dd>
        </dl>
      </section>
      {tooFew && <Notice kind="warn">{interpolate(t.gates.tooFew, { n: g.compared })}</Notice>}
      {!tooFew && low && <Notice kind="warn">{t.gates.lowAccuracy}</Notice>}
      {!tooFew && (
        <Field label={low ? `${t.gates.reason} ${t.common.required}` : t.gates.reason} htmlFor="gate-reason" error={touched && bad ? t.gates.reasonRequired : null}>
          <textarea id="gate-reason" className={`textarea${touched && bad ? ' invalid' : ''}`} value={reason} onChange={(e) => setReason(e.target.value)} data-autofocus />
        </Field>
      )}
      <ActionError error={act.error} raw={act.rawError} />
    </Modal>
  );
}

function CloseDialog({ g, onClose }: { g: GateRow; onClose: () => void }) {
  const act = useAction(() => closeGate(g.id, { version: g.version }), { success: t.gates.closed, onSuccess: onClose });
  return (
    <ConfirmDialog title={interpolate(t.gates.closeTitle, { s: g.supplierName, e: g.entityName })} confirmLabel={t.gates.close} danger pending={act.pending} error={act.error} onCancel={onClose} onConfirm={() => void act.run(undefined)}>
      <p>{t.gates.closeText}</p>
    </ConfirmDialog>
  );
}
