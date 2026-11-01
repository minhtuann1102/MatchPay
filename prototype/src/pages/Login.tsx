import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { homeOf } from '../auth/nav';
import { listPersonas, loginWithPassword } from '../api/reporting';
import { Field, Notice } from '../components/Bits';
import { Icon } from '../components/Icon';
import { errorText } from '../lib/errors';
import { t } from '../i18n/vi';
import { ApiError } from '../api/client';

/** SCR-01. Pick one of the 7 roles (persona card) or type an email and password. */
export function Login() {
  const { session, ready, ended, signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const personas = useQuery({ queryKey: ['personas'], queryFn: listPersonas });
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

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (showForm) {
        const s = await loginWithPassword(email, password);
        await signIn(s.userId);
        nav(homeOf(s.role), { replace: true });
      } else {
        const s = await signIn(picked!);
        nav(homeOf(s.role), { replace: true });
      }
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'DEACTIVATED' ? t.login.deactivated : e instanceof ApiError && e.code === 'BAD_CREDENTIALS' ? t.login.wrong : errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-page">
      <div className="card login-card wide">
        <div className="brand" style={{ color: 'var(--ink)', padding: 0 }}>
          <span className="brand-mark" style={{ background: 'var(--nav)', color: '#fff' }}><Icon name="stack" /></span>
          <span className="brand-name">MatchPay</span>
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>{t.login.title}</h1>
          <p className="muted small">{t.login.subtitle}</p>
        </div>
        {endedState && <Notice kind="info" title={t.login.ended}>{t.login.endedHint}</Notice>}
        {error && <Notice kind="err" icon="lock">{error}</Notice>}
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          noValidate
        >
          {!showForm ? (
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="lbl" style={{ marginBottom: 6 }}>{t.login.pickPersona}</legend>
              <div className="persona-grid">
                {personas.data?.map((p) => (
                  <button key={p.id} type="button" className="persona" aria-pressed={picked === p.id} onClick={() => setPicked(p.id)}>
                    <b>{p.fullName}</b>
                    <span>{t.roles[p.role]}{p.approvalLevel ? ` (${t.approvalLevel[p.approvalLevel]})` : ''}</span>
                    <span>{p.entityName}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
            <>
              <Field label={t.login.email} htmlFor="email"><input className="input" id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alice@calderwood-foods.example" /></Field>
              <Field label={t.login.password} htmlFor="pw" hint={t.login.passwordHint}><input className="input" id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
            </>
          )}
          <button className="btn btn-primary" type="submit" disabled={busy || (!showForm && !picked)}>
            {busy && <span className="spin" />}
            {busy ? t.login.signingIn : t.login.signIn}
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => { setShowForm((v) => !v); setError(null); }}>
            {showForm ? t.login.usePersona : t.login.useEmail}
          </button>
        </form>
        <p className="xs muted">{t.login.footer}</p>
      </div>
    </div>
  );
}
