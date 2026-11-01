import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signPaymentRequests, type RequestRow, type SignOutcome } from '../api/signing';
import { useDelegations, useRequests } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { EmptyState, Field, Notice, PageHeader, Tabs } from '../components/Bits';
import { Chip, RequestBadge } from '../components/Chips';
import { DataTable, type Col } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ActionError } from '../components/ReasonModal';
import { fmtDate, fmtDateTime, fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

type Tab = 'ready' | 'waiting' | 'done' | 'all';
const DONE = ['SIGNED', 'SENT', 'PAID'];

export const signReasonText = (code: string | null): string => (code ? t.signReason[code] ?? t.errors.GENERIC : '');

/** SCR-50 Signing Queue, with SCR-52 (sign with re-authentication) as a modal. */
export function Signing() {
  const { session } = useAuth();
  const nav = useNavigate();
  const q = useRequests();
  const del = useDelegations();
  const [tab, setTab] = useState<Tab | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [signing, setSigning] = useState(false);

  const all = q.data ?? [];
  const ready = all.filter((r) => r.sign.canSign);
  const waiting = all.filter((r) => r.state.startsWith('AWAITING') && !r.sign.canSign);
  const done = all.filter((r) => DONE.includes(r.state));
  const effective: Tab = tab ?? (ready.length ? 'ready' : 'all');
  const rows = effective === 'ready' ? ready : effective === 'waiting' ? waiting : effective === 'done' ? done : all;
  const sel = ready.filter((r) => picked.includes(r.id));

  // Drop selections that are no longer ready (for example after a refresh).
  useEffect(() => {
    setPicked((p) => (p.every((id) => ready.some((r) => r.id === id)) ? p : p.filter((id) => ready.some((r) => r.id === id))));
  }, [q.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const active = (del.data ?? []).filter((d) => d.state === 'ACTIVE' && d.mine);
  const gave = active.find((d) => d.mine === 'GAVE');
  const got = active.filter((d) => d.mine === 'RECEIVED');

  const cols: Col<RequestRow>[] = [
    {
      key: 'sel', label: '', header: <span className="sr">{t.signing.selectHint}</span>, className: 'checkbox-cell',
      render: (r) => <input type="checkbox" aria-label={interpolate(t.signing.selectRow, { r: r.id })} disabled={!r.sign.canSign} checked={picked.includes(r.id)} onChange={() => toggle(r.id)} onClick={(e) => e.stopPropagation()} />,
    },
    {
      key: 'id', label: t.signing.colRequest, header: t.signing.colRequest, sort: (r) => r.id,
      render: (r) => <><b className="mono">{r.id}</b><span className="sub">{r.supplierName}</span>{r.sign.onBehalfOf && <span className="obo">{interpolate(t.signing.onBehalf, { who: r.sign.onBehalfOf })}</span>}</>,
    },
    { key: 'total', label: t.signing.colTotal, header: t.signing.colTotal, className: 'money', sort: (r) => r.total, render: (r) => fmtMoney(r.total) },
    { key: 'level', label: t.signing.colLevel, header: t.signing.colLevel, render: (r) => t.approvalLevel[r.level] },
    {
      key: 'state', label: t.signing.colState, header: t.signing.colState,
      render: (r) => <><RequestBadge state={r.state} />{!r.sign.canSign && r.state.startsWith('AWAITING') && r.sign.reason && <span className="sub">{signReasonText(r.sign.reason)}</span>}{r.sign.canSign && <span className="sub">{t.signing.views.ready}</span>}</>,
    },
    {
      key: 'flags', label: t.signing.colFlags, header: t.signing.colFlags,
      render: (r) => (r.flags.bankChanged || r.flags.newSupplier ? <span className="stack" style={{ gap: 2 }}>{r.flags.bankChanged && <Chip kind="exc">{t.signing.bankChanged}</Chip>}{r.flags.newSupplier && <Chip kind="exc">{t.signing.newSupplier}</Chip>}</span> : <span className="muted">{t.signing.noFlags}</span>),
    },
    { key: 'sigs', label: t.signing.colSigs, header: t.signing.colSigs, render: (r) => <>{interpolate(t.signing.sigsOf, { n: r.signatures.length })}{r.signatures.length > 0 && <span className="sub">{r.signatures.map((s) => `${s.name}, ${fmtDateTime(s.at)}`).join('; ')}</span>}</> },
    { key: 'erp', label: t.signing.colErp, header: t.signing.colErp, render: (r) => (r.state === 'CANCELLED' ? '' : t.sendStatus(r)) },
  ];

  return (
    <>
      <PageHeader title={t.signing.title} meta={interpolate(t.signing.intro, { entity: session?.entityName ?? '' })} />
      {gave && <Notice kind="info" icon="handover" action={<Link className="btn btn-sm" to="/delegations">{t.signing.manage}</Link>}>{interpolate(t.signing.gave, { who: gave.delegateName, date: fmtDate(gave.to) })}</Notice>}
      {got.map((d) => <Notice key={d.id} kind="info" icon="handover" action={<Link className="btn btn-sm" to="/delegations">{t.signing.manage}</Link>}>{interpolate(t.signing.received, { who: d.delegatorName, date: fmtDate(d.to) })}</Notice>)}
      {q.data && all.length > 0 && (
        <div className="kpis">
          <button type="button" className="tile t-warn" onClick={() => setTab('ready')}><span className="t-lbl">{t.signing.kReady}</span><span className="t-val">{ready.length}</span><span className="t-sub">{t.signing.kReadySub} {fmtMoney(ready.reduce((s, r) => s + r.total, 0))}</span></button>
          <button type="button" className="tile" onClick={() => setTab('waiting')}><span className="t-lbl">{t.signing.kWaiting}</span><span className="t-val">{waiting.length}</span><span className="t-sub">{waiting.map((r) => r.id).join(', ') || '-'}</span></button>
          <div className="tile"><span className="t-lbl">{t.signing.kFlag}</span><span className="t-val">{all.filter((r) => r.state.startsWith('AWAITING') && (r.flags.bankChanged || r.flags.newSupplier)).length}</span><span className="t-sub">{all.filter((r) => r.flags.bankChanged).map((r) => `${r.id}: ${t.signing.bankChanged}`).join(', ') || '-'}</span></div>
        </div>
      )}
      <section className="card">
        <Tabs<Tab> label={t.signing.savedViews} value={effective} onChange={setTab} tabs={(['ready', 'waiting', 'done', 'all'] as Tab[]).map((k) => ({ id: k, label: t.signing.views[k], count: q.data ? { ready: ready.length, waiting: waiting.length, done: done.length, all: all.length }[k] : undefined }))} />
        <Async q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState icon="pen" title={t.signing.emptyTitle} text={t.signing.emptyText} />}>
          {() => (rows.length === 0 ? <EmptyState icon="pen" title={t.signing.emptyView} /> : <DataTable columns={cols} rows={rows} rowKey={(r) => r.id} caption={t.signing.title} onRowClick={(r) => nav(`/signing/requests/${r.id}`)} />)}
        </Async>
      </section>
      {sel.length > 0 && (
        <div className="sticky-sign" role="region" aria-label={t.signing.signSelected.replace('{n}', String(sel.length))}>
          <span>{interpolate(t.signing.selected, { n: sel.length, total: fmtMoney(sel.reduce((s, r) => s + r.total, 0)) })}</span>
          <button type="button" className="btn" onClick={() => setSigning(true)}>{interpolate(t.signing.signSelected, { n: sel.length })}</button>
        </div>
      )}
      {signing && <SignModal items={sel} onClose={() => { setSigning(false); setPicked([]); }} />}
    </>
  );
}

/** SCR-52: re-authentication with the one-time code, then the result per request. */
export function SignModal({ items, onClose }: { items: RequestRow[]; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [touched, setTouched] = useState(false);
  const [results, setResults] = useState<SignOutcome[] | null>(null);
  const run = useAction((c: string) => signPaymentRequests({ items: items.map((r) => ({ id: r.id, version: r.version })), code: c }), { onSuccess: setResults });
  const bad = touched && !code.trim();
  const signed = results?.filter((r) => r.result === 'SIGNED').length ?? 0;
  return (
    <Modal
      title={t.signing.modalTitle}
      onClose={onClose}
      dismissable={!run.pending}
      onSubmit={results ? onClose : () => { setTouched(true); if (code.trim()) void run.run(code); }}
      footer={
        results ? <button type="submit" className="btn btn-primary">{t.signing.done}</button> : (
          <>
            <button type="button" className="btn" onClick={onClose} disabled={run.pending}>{t.common.cancel}</button>
            <button type="submit" className="btn btn-primary" disabled={run.pending}>{run.pending && <span className="spin" />}{t.signing.signNow}</button>
          </>
        )
      }
    >
      {!results ? (
        <>
          <p className="small">{t.signing.modalIntro}</p>
          <ul className="reason-list">{items.map((r) => <li key={r.id}><b className="mono">{r.id}</b> {r.supplierName}, {fmtMoney(r.total)}{r.sign.onBehalfOf ? ` (${interpolate(t.signing.onBehalf, { who: r.sign.onBehalfOf })})` : ''}</li>)}</ul>
          <Field label={`${t.signing.code} ${t.common.required}`} htmlFor="sign-code" hint={t.signing.codeHint} error={bad ? t.signing.codeRequired : null}>
            <input id="sign-code" className={`input${bad ? ' invalid' : ''}`} type="password" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} data-autofocus />
          </Field>
          <ActionError error={run.error} raw={run.rawError} />
        </>
      ) : (
        <div role="status" className="stack">
          <Notice kind={signed === results.length ? 'ok' : 'warn'} title={t.signing.results}>{interpolate(t.signing.summary, { a: signed, b: results.length - signed })}</Notice>
          <ul className="reason-list">
            {results.map((r) => (
              <li key={r.requestId}><b className="mono">{r.requestId}</b>: {r.result === 'SIGNED' ? interpolate(t.signing.resultSigned, { s: r.newState ? t.requestState[r.newState] : '' }) : interpolate(t.signing.resultRefused, { r: signReasonText(r.reason) })}</li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
