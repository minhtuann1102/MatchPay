import { useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { homeOf } from '../auth/nav';
import { getForced, setForced, subscribeForced, type ForcedState } from '../api/client';
import { REAUTH_CODE } from '../api/signing';
import { listPersonas } from '../api/reporting';
import { resetDemoData } from '../mock/db';
import { useToast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { useQuery } from '@tanstack/react-query';
import { t } from '../i18n/vi';
import { fmtDateTime } from '../lib/format';
import { getDb } from '../mock/db';

const STATES: ForcedState[] = ['none', 'loading', 'empty', 'server-error', 'ai-error', 'conflict'];

/** Small collapsible demo panel: reset data, switch persona (Demo Operator idea, D-12), force a documented state. */
export function DemoToolbar() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const forced = useSyncExternalStore(subscribeForced, getForced);
  const { session, signIn } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const personas = useQuery({ queryKey: ['personas'], queryFn: listPersonas });
  const t2 = t.demo;

  const switchTo = async (id: string) => {
    const s = await signIn(id);
    await qc.invalidateQueries();
    setForced('none');
    nav(homeOf(s.role));
  };

  if (!open) {
    return (
      <button type="button" className="demo-fab" onClick={() => setOpen(true)} aria-expanded="false">
        {t2.title}
        {forced !== 'none' && <span className="tagx tagx-warn">{t2.states[forced]}</span>}
      </button>
    );
  }
  return (
    <section className="demo-panel" aria-label={t2.title}>
      <div className="spread">
        <b>{t2.title}</b>
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setOpen(false)} aria-label={t.common.close}>{t.common.close}</button>
      </div>
      <div className="field">
        <label htmlFor="demo-persona">{t2.persona}</label>
        <select id="demo-persona" className="select" value={session?.userId ?? ''} onChange={(e) => void switchTo(e.target.value)}>
          {!session && <option value="">-</option>}
          {personas.data?.map((p) => (
            <option key={p.id} value={p.id}>{p.fullName}, {t.roles[p.role]}{p.approvalLevel ? ` (${t.approvalLevel[p.approvalLevel]})` : ''}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="demo-state">{t2.forceState}</label>
        <select id="demo-state" className="select" value={forced} onChange={(e) => { setForced(e.target.value as ForcedState); void qc.invalidateQueries(); }}>
          {STATES.map((s) => <option key={s} value={s}>{t2.states[s]}</option>)}
        </select>
        <span className="hint">{t2.forceHint}</span>
      </div>
      <p className="small">{t2.otp}: <b className="mono" data-testid="otp">{REAUTH_CODE}</b></p>
      <p className="xs muted">{t2.clock}: {fmtDateTime(getDb().now)}</p>
      <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirm(true)}>{t2.reset}</button>
      {confirm && (
        <ConfirmDialog
          title={t2.resetTitle}
          confirmLabel={t2.reset}
          danger
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            resetDemoData();
            setConfirm(false);
            setForced('none');
            void qc.clear();
            toast(t2.resetDone);
            nav('/login');
          }}
        >
          <p>{t2.resetText}</p>
        </ConfirmDialog>
      )}
    </section>
  );
}
