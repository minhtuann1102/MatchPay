import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Avatar, Button, Card, Form, Input, List, Skeleton, Tag, Typography } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext';
import { homeOf } from '../auth/nav';
import { listPersonas, listPublicEntities, loginWithPassword } from '../api/reporting';
import { errorText } from '../lib/errors';
import { t } from '../i18n/vi';
import { ApiError } from '../api/client';
import { TOKENS } from '../theme/theme';

/** SCR-01. Pick one of the 7 roles (persona list) or type an email and password. */
export function Login() {
  const { session, ready, ended, signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const personas = useQuery({ queryKey: ['personas'], queryFn: listPersonas });
  const entities = useQuery({ queryKey: ['publicEntities'], queryFn: listPublicEntities });
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const endedState = ended || (loc.state as { ended?: boolean } | null)?.ended;

  useEffect(() => {
    if (!picked && personas.data?.length) setPicked(personas.data[0]!.id);
  }, [personas.data, picked]);

  if (ready && session) return <Navigate to={homeOf(session.role)} replace />;

  const fail = (e: unknown) => setError(e instanceof ApiError && e.code === 'DEACTIVATED' ? t.login.deactivated : e instanceof ApiError && e.code === 'BAD_CREDENTIALS' ? t.login.wrong : errorText(e));

  const submitPersona = async (id: string) => {
    setPicked(id);
    setBusy(true);
    setError(null);
    try {
      const s = await signIn(id);
      nav(homeOf(s.role), { replace: true });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = async (v: { email: string; password: string }) => {
    setBusy(true);
    setError(null);
    try {
      const s = await loginWithPassword(v.email, v.password);
      await signIn(s.userId);
      nav(homeOf(s.role), { replace: true });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-intro" aria-label={t.login.title}>
        <div style={{ maxWidth: 440 }}>
          <h1>{t.login.title}</h1>
          <Typography.Paragraph type="secondary" style={{ fontSize: 16, marginTop: 12 }}>{t.login.subtitle}</Typography.Paragraph>
        </div>
        <div style={{ maxWidth: 440 }}>
          <Typography.Text type="secondary">{t.login.entities}</Typography.Text>
          <List
            size="small"
            style={{ marginTop: 8 }}
            dataSource={entities.data ?? []}
            renderItem={(e) => (
              <List.Item extra={<Typography.Text type="secondary">{t.shell.mst} {e.taxCode}</Typography.Text>}>{e.name}</List.Item>
            )}
          />
        </div>
      </section>
      <main className="login-side">
        <Card className="login-card" title={showForm ? t.login.useEmail : t.login.pickPersona}>
          <div className="stack">
            {endedState && <Alert type="info" showIcon message={t.login.ended} description={t.login.endedHint} />}
            {error && <Alert type="error" showIcon icon={<LockOutlined />} message={error} role="alert" />}
            {!showForm ? (
              personas.isPending ? <Skeleton active /> : (
                <List
                  aria-label={t.login.pickPersona}
                  dataSource={personas.data ?? []}
                  renderItem={(p) => (
                    <List.Item
                      actions={[
                        <Button key="in" type="primary" loading={busy && picked === p.id} disabled={busy} aria-label={`${t.login.signIn}: ${p.fullName}`} onClick={() => void submitPersona(p.id)}>
                          {t.login.signIn}
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar shape="square" style={{ background: TOKENS.primary, color: TOKENS.white }}>{p.fullName.slice(0, 1)}</Avatar>}
                        title={<>{p.fullName} <Tag style={{ marginInlineStart: 4 }}>{t.roles[p.role]}{p.approvalLevel ? ` (${t.approvalLevel[p.approvalLevel]})` : ''}</Tag></>}
                        description={p.entityName}
                      />
                    </List.Item>
                  )}
                />
              )
            ) : (
              <Form layout="vertical" onFinish={(v) => void submitEmail(v as { email: string; password: string })} requiredMark={false}>
                <Form.Item name="email" label={t.login.email} rules={[{ required: true, message: t.common.fieldRequired }, { type: 'email', message: t.login.emailInvalid }]}>
                  <Input prefix={<MailOutlined />} autoComplete="username" placeholder="alice@calderwood-foods.example" />
                </Form.Item>
                <Form.Item name="password" label={t.login.password} extra={t.login.passwordHint} rules={[{ required: true, message: t.common.fieldRequired }]}>
                  <Input.Password prefix={<UserOutlined />} autoComplete="current-password" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={busy} block>{busy ? t.login.signingIn : t.login.signIn}</Button>
              </Form>
            )}
            <Button type="link" style={{ paddingInline: 0, justifySelf: 'start' }} onClick={() => { setShowForm((v) => !v); setError(null); }}>
              {showForm ? t.login.usePersona : t.login.useEmail}
            </Button>
            <Typography.Text type="secondary" className="xs">{t.login.footer}</Typography.Text>
          </div>
        </Card>
      </main>
    </div>
  );
}
