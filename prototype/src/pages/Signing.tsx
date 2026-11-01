import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Affix, Alert, Badge, Button, Card, Form, Input, List, Space, Table, Tabs, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, EditOutlined, ExclamationCircleOutlined, SwapOutlined, WarningOutlined } from '@ant-design/icons';
import { signPaymentRequests, type RequestRow, type SignOutcome } from '../api/signing';
import { useDelegations, useRequests } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { EmptyState, Notice, PageHeader, ReqNo, SealStamp } from '../components/Bits';
import { RequestBadge } from '../components/Tags';
import { ActionModal } from '../components/Dialogs';
import { Kpi, KpiRow } from '../components/Kpi';
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

  const active = (del.data ?? []).filter((d) => d.state === 'ACTIVE' && d.mine);
  const gave = active.find((d) => d.mine === 'GAVE');
  const got = active.filter((d) => d.mine === 'RECEIVED');

  const cols: TableColumnsType<RequestRow> = [
    {
      title: t.signing.colRequest, key: 'id', sorter: (a, b) => a.id.localeCompare(b.id), width: 220,
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <span><ReqNo value={r.id} /></span>
          <Typography.Text type="secondary" className="xs">{r.supplierName}</Typography.Text>
          {r.sign.onBehalfOf && <Tag color="error" icon={<SwapOutlined />}>{interpolate(t.signing.onBehalf, { who: r.sign.onBehalfOf })}</Tag>}
        </Space>
      ),
    },
    { title: t.signing.colTotal, key: 'total', align: 'right', sorter: (a, b) => a.total - b.total, width: 150, render: (_, r) => <span className="nowrap">{fmtMoney(r.total)}</span> },
    { title: t.signing.colLevel, key: 'level', width: 140, responsive: ['md'], render: (_, r) => t.approvalLevel[r.level] },
    {
      title: t.signing.colState, key: 'state', width: 240,
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <RequestBadge state={r.state} />
          {!r.sign.canSign && r.state.startsWith('AWAITING') && r.sign.reason && <Typography.Text type="secondary" className="xs">{signReasonText(r.sign.reason)}</Typography.Text>}
          {r.sign.canSign && <Typography.Text type="secondary" className="xs">{t.signing.views.ready}</Typography.Text>}
        </Space>
      ),
    },
    {
      title: t.signing.colFlags, key: 'flags', width: 190, responsive: ['lg'],
      render: (_, r) => (r.flags.bankChanged || r.flags.newSupplier ? <Space direction="vertical" size={2}>{r.flags.bankChanged && <Tag color="warning" icon={<WarningOutlined />}>{t.signing.bankChanged}</Tag>}{r.flags.newSupplier && <Tag color="warning" icon={<WarningOutlined />}>{t.signing.newSupplier}</Tag>}</Space> : <Typography.Text type="secondary">{t.signing.noFlags}</Typography.Text>),
    },
    {
      title: t.signing.colSigs, key: 'sigs', width: 220, responsive: ['xl'],
      render: (_, r) => <>{interpolate(t.signing.sigsOf, { n: r.signatures.length })}{r.signatures.length > 0 && <><br /><Typography.Text type="secondary" className="xs">{r.signatures.map((s) => `${s.name}, ${fmtDateTime(s.at)}`).join('; ')}</Typography.Text></>}</>,
    },
    { title: t.signing.colErp, key: 'erp', width: 200, responsive: ['xl'], render: (_, r) => (r.state === 'CANCELLED' ? '' : t.sendStatus(r)) },
  ];

  return (
    <>
      <PageHeader title={t.signing.title} meta={interpolate(t.signing.intro, { entity: session?.entityName ?? '' })} />
      {gave && <Notice kind="info" icon={<SwapOutlined />} action={<Link to="/delegations"><Button size="small">{t.signing.manage}</Button></Link>}>{interpolate(t.signing.gave, { who: gave.delegateName, date: fmtDate(gave.to) })}</Notice>}
      {got.map((d) => <Notice key={d.id} kind="info" icon={<SwapOutlined />} action={<Link to="/delegations"><Button size="small">{t.signing.manage}</Button></Link>}>{interpolate(t.signing.received, { who: d.delegatorName, date: fmtDate(d.to) })}</Notice>)}
      {q.data && all.length > 0 && (
        <KpiRow span={8}>
          {[
            <Kpi key="r" title={t.signing.kReady} value={ready.length} icon={<EditOutlined />} color="#B3261E" sub={`${t.signing.kReadySub} ${fmtMoney(ready.reduce((s, r) => s + r.total, 0))}`} onClick={() => setTab('ready')} />,
            <Kpi key="w" title={t.signing.kWaiting} value={waiting.length} icon={<ClockCircleOutlined />} sub={waiting.map((r) => r.id).join(', ') || '-'} onClick={() => setTab('waiting')} />,
            <Kpi key="f" title={t.signing.kFlag} value={all.filter((r) => r.state.startsWith('AWAITING') && (r.flags.bankChanged || r.flags.newSupplier)).length} icon={<ExclamationCircleOutlined />} color="#8A5E0F" sub={all.filter((r) => r.flags.bankChanged).map((r) => `${r.id}: ${t.signing.bankChanged}`).join(', ') || '-'} />,
          ]}
        </KpiRow>
      )}
      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          className="view-tabs"
          aria-label={t.signing.savedViews}
          activeKey={effective}
          onChange={(k) => setTab(k as Tab)}
          items={(['ready', 'waiting', 'done', 'all'] as Tab[]).map((k) => ({
            key: k,
            label: <span>{t.signing.views[k]} {q.data && <Badge count={{ ready: ready.length, waiting: waiting.length, done: done.length, all: all.length }[k]} showZero color={k === 'ready' && ready.length ? '#8A5E0F' : '#9a9fb0'} style={{ marginInlineStart: 4 }} />}</span>,
          }))}
        />
        <Async q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState title={t.signing.emptyTitle} text={t.signing.emptyText} />}>
          {() => (rows.length === 0 ? <EmptyState title={t.signing.emptyView} /> : (
            <Table<RequestRow>
              size="middle"
              rowKey="id"
              columns={cols}
              dataSource={rows}
              scroll={{ x: 640 }}
              pagination={rows.length > 20 ? { pageSize: 20 } : false}
              rowSelection={{
                selectedRowKeys: picked,
                onChange: (keys) => setPicked(keys as string[]),
                getCheckboxProps: (r) => ({ disabled: !r.sign.canSign, 'aria-label': interpolate(t.signing.selectRow, { r: r.id }) }),
              }}
              onRow={(r) => ({ onClick: () => nav(`/signing/requests/${r.id}`), style: { cursor: 'pointer' } })}
            />
          ))}
        </Async>
      </Card>
      {sel.length > 0 && (
        <Affix offsetBottom={16}>
          <div className="sticky-sign" role="region" aria-label={t.signing.signSelected.replace('{n}', String(sel.length))}>
            <span>{interpolate(t.signing.selected, { n: sel.length, total: fmtMoney(sel.reduce((s, r) => s + r.total, 0)) })}</span>
            <Button type="primary" icon={<EditOutlined />} onClick={() => setSigning(true)}>{interpolate(t.signing.signSelected, { n: sel.length })}</Button>
          </div>
        </Affix>
      )}
      {signing && <SignModal items={sel} onClose={() => { setSigning(false); setPicked([]); }} />}
    </>
  );
}

/** SCR-52: re-authentication with the one-time code (Input.OTP), then the result per request with the red seal. */
export function SignModal({ items, onClose }: { items: RequestRow[]; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [touched, setTouched] = useState(false);
  const [results, setResults] = useState<SignOutcome[] | null>(null);
  const run = useAction((c: string) => signPaymentRequests({ items: items.map((r) => ({ id: r.id, version: r.version })), code: c }), { onSuccess: setResults });
  const bad = touched && code.length < 6;
  // A rejected code is cleared so the next attempt starts from an empty field.
  useEffect(() => { if (run.rawError) setCode(''); }, [run.rawError]);
  const signed = results?.filter((r) => r.result === 'SIGNED').length ?? 0;
  return (
    <ActionModal
      title={t.signing.modalTitle}
      okText={results ? t.signing.done : t.signing.signNow}
      pending={run.pending}
      error={results ? null : run.error}
      rawError={run.rawError}
      onClose={onClose}
      onOk={results ? onClose : () => { setTouched(true); if (code.length >= 6) void run.run(code); }}
      hideCancel={!!results}
      width={560}
    >
      {!results ? (
        <>
          <Typography.Paragraph>{t.signing.modalIntro}</Typography.Paragraph>
          <List
            size="small"
            bordered
            dataSource={items}
            renderItem={(r) => <List.Item><span><ReqNo value={r.id} /> {r.supplierName}, {fmtMoney(r.total)}{r.sign.onBehalfOf ? ` (${interpolate(t.signing.onBehalf, { who: r.sign.onBehalfOf })})` : ''}</span></List.Item>}
          />
          <Form layout="vertical">
            <Form.Item label={t.signing.code} required help={bad ? t.signing.codeRequired : t.signing.codeHint} validateStatus={bad ? 'error' : undefined}>
              <Input.OTP length={6} mask value={code} onChange={setCode} autoFocus status={bad ? 'error' : undefined} aria-label={t.signing.code} />
            </Form.Item>
          </Form>
        </>
      ) : (
        <div role="status" className="stack">
          <Alert type={signed === results.length ? 'success' : 'warning'} showIcon message={t.signing.results} description={interpolate(t.signing.summary, { a: signed, b: results.length - signed })} />
          <div className="seals">
            {results.filter((r) => r.result === 'SIGNED' && r.signedAt && r.signerRole).map((r) => <SealStamp key={r.requestId} role={r.signerRole!} at={r.signedAt!} fresh large />)}
          </div>
          <List
            size="small"
            dataSource={results}
            renderItem={(r) => (
              <List.Item>
                <span><ReqNo value={r.requestId} />: {r.result === 'SIGNED' ? <><CheckCircleOutlined style={{ color: '#2E6A55' }} /> {interpolate(t.signing.resultSigned, { s: r.newState ? t.requestState[r.newState] : '' })}</> : interpolate(t.signing.resultRefused, { r: signReasonText(r.reason) })}</span>
              </List.Item>
            )}
          />
        </div>
      )}
    </ActionModal>
  );
}
