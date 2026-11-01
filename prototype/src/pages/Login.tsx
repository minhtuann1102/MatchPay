import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { homeOf } from '../auth/nav';
import { listPersonas, listPublicEntities, loginWithPassword } from '../api/reporting';
import { Field, Notice } from '../components/Bits';
import { errorText } from '../lib/errors';
import { t } from '../i18n/vi';
import { ApiError } from '../api/client';

/** SCR-01. Pick one of the 7 roles (persona card) or type an email and password. */
export function Login() {
  const { session, ready, ended, signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const personas = useQuery({ queryKey: ['personas'], queryFn: listPersonas });
  const entities = useQuery({ queryKey: ['publicEntities'], queryFn: listPublicEntities });
  const [picked, setPicked] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const endedState = ended || (loc.state as { ended?: boolean } | null)?.ended;

  useEffect(() => {
    if (!picked && personas.data?.length) setPicked(personas.data[0]!.id);
  }, [personas.data, picked]);

  if (ready && session) return <Navigate to={homeOf(session.role)} replace />;

  const submit = async (personaId?: string) => {
    if (personaId) setPicked(personaId);
    setBusy(true);
    setError(null);
    try {
      if (showForm) {
        const s = await loginWithPassword(email, password);
        await signIn(s.userId);
        nav(homeOf(s.role), { replace: true });
      } else {
        const s = await signIn(personaId ?? picked!);
        nav(homeOf(s.role), { replace: true });
      }
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'DEACTIVATED' ? t.login.deactivated : e instanceof ApiError && e.code === 'BAD_CREDENTIALS' ? t.login.wrong : errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-intro" aria-label={t.login.title}>
        <div>
          <h1>{t.login.title}</h1>
          <p className="lead">{t.login.subtitle}</p>
        </div>
        <div className="stack">
          <p className="small muted">{t.login.entities}</p>
          <ul className="entity-list">
            {entities.data?.map((e) => (
              <li key={e.id}><span>{e.name}</span><span>{t.shell.mst} {e.taxCode}</span></li>
            ))}
          </ul>
        </div>
      </section>
      <main className="login-register">
        {endedState && <Notice kind="info" title={t.login.ended}>{t.login.endedHint}</Notice>}
        {error && <Notice kind="err" icon="lock">{error}</Notice>}
        {!showForm ? (
          <>
            <h2 id="register-h">{t.login.pickPersona}</h2>
            <ul className="register" aria-labelledby="register-h">
              {personas.data?.map((p) => (
                <li key={p.id} className="register-row" data-picked={picked === p.id}>
                  <div>
                    <b>{p.fullName}</b>
                    <span>{t.roles[p.role]}{p.approvalLevel ? ` (${t.approvalLevel[p.approvalLevel]})` : ''}, {p.entityName}</span>
                  </div>
                  <button type="button" className="btn btn-primary btn-sm" disabled={busy} aria-label={`${t.login.signIn}: ${p.fullName}`} onClick={() => void submit(p.id)}>
                    {busy && picked === p.id && <span className="spin" />}
                    {t.login.signIn}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            noValidate
          >
            <h2>{t.login.useEmail}</h2>
            <Field label={t.login.email} htmlFor="email"><input className="input" id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alice@calderwood-foods.example" /></Field>
            <Field label={t.login.password} htmlFor="pw" hint={t.login.passwordHint}><input className="input" id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy && <span className="spin" />}
              {busy ? t.login.signingIn : t.login.signIn}
            </button>
          </form>
        )}
        <div>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => { setShowForm((v) => !v); setError(null); }}>
            {showForm ? t.login.usePersona : t.login.useEmail}
          </button>
        </div>
        <p className="foot">{t.login.footer}</p>
      </main>
    </div>
  );
}
