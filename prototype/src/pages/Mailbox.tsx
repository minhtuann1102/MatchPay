import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Space, Table, Tabs, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { MailOutlined, SyncOutlined } from '@ant-design/icons';
import type { MailboxAttachment, MailboxMessage } from '../api/types';
import { getMailboxFetchRun, startMailboxFetch } from '../api/mailbox';
import { useMailboxMessages, useMailboxStatus } from '../api/hooks';
import { Async } from '../components/Async';
import { Count, EmptyState, InvNo, Notice, PageHeader } from '../components/Bits';
import { Kpi, KpiRow } from '../components/Kpi';
import { StatusDot } from '../components/Tags';
import { fmtDateTime } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';
import { TOKENS } from '../theme/theme';

type Tab = 'all' | 'accepted' | 'rejected' | 'none';
interface Row { key: string; msg: MailboxMessage; att: MailboxAttachment }

/** SCR-24 Mailbox Log: one row for each attachment, newest first, with a "fetch now" job. */
export function Mailbox() {
  const status = useMailboxStatus();
  const msgs = useMailboxMessages();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const [tab, setTab] = useState<Tab>('all');
  const [runId, setRunId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const start = useAction(startMailboxFetch, { onSuccess: (r) => { setRunId(r.id); setFailed(false); } });

  // Poll the fetch job until it ends, then refresh the log.
  useEffect(() => {
    if (!runId) return;
    const timer = window.setInterval(() => {
      void getMailboxFetchRun(runId).then((r) => {
        if (r.state === 'RUNNING') return;
        window.clearInterval(timer);
        setRunId(null);
        setFailed(r.state === 'FAILED');
        if (r.state === 'SUCCEEDED') void message.success(t.mailbox.fetched.replace('{n}', String(r.newMessages)));
        void qc.invalidateQueries();
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [runId, qc, message]);

  const rows: Row[] = (msgs.data ?? []).flatMap((m) => m.attachments.map((a, i) => ({ key: `${m.id}-${i}`, msg: m, att: a })));
  const view = rows.filter((r) => tab === 'all' || (tab === 'accepted' && r.att.result === 'ACCEPTED') || (tab === 'rejected' && r.att.result === 'REJECTED') || (tab === 'none' && r.att.result === 'NO_ATTACHMENT'));
  const s = status.data;
  const running = !!runId || !!s?.running;

  const cols: TableColumnsType<Row> = [
    { title: t.mailbox.colMessage, key: 'msg', width: 300, sorter: (a, b) => a.msg.id.localeCompare(b.msg.id), render: (_, r) => <><b className="mono">{r.msg.id}</b> {r.msg.sender}<br /><Typography.Text type="secondary" className="xs">{r.msg.subject}</Typography.Text></> },
    { title: t.mailbox.colReceived, key: 'at', width: 150, defaultSortOrder: 'descend', sorter: (a, b) => a.msg.receivedAt.localeCompare(b.msg.receivedAt), render: (_, r) => fmtDateTime(r.msg.receivedAt) },
    { title: t.mailbox.colAttachment, key: 'att', width: 200, responsive: ['md'], render: (_, r) => (r.att.fileName ? <span className="mono">{r.att.fileName}</span> : <Typography.Text type="secondary">{t.mailbox.none}</Typography.Text>) },
    {
      title: t.mailbox.colResult, key: 'res', width: 150,
      render: (_, r) => r.att.result === 'ACCEPTED' ? <StatusDot tone="success">{t.mailbox.result.ACCEPTED}</StatusDot>
        : r.att.result === 'REJECTED' ? <StatusDot tone="error">{t.mailbox.result.REJECTED}</StatusDot>
        : <StatusDot tone="neutral">{t.mailbox.result[r.att.result]}</StatusDot>,
    },
    {
      title: t.mailbox.colDetail, key: 'why', width: 260,
      render: (_, r) =>
        r.att.result === 'ACCEPTED' && r.att.invoiceId ? <><Link to={`/invoices/${r.att.invoiceId}`}><InvNo value={r.att.invoiceNumber ?? ''} /></Link><br /><Typography.Text type="secondary" className="xs">{t.mailbox.sourceEmail}</Typography.Text></>
        : r.att.result === 'REJECTED' && r.att.rejection ? <span>{t.mailbox.rejection[r.att.rejection]}</span>
        : <Typography.Text type="secondary">{t.mailbox.noAttachmentText}</Typography.Text>,
    },
  ];

  const tabCount = (n: number) => <Count n={n} />;
  return (
    <>
      <PageHeader
        title={t.mailbox.title}
        meta={s && (
          <Space size={16} wrap>
            <span className="mono"><MailOutlined /> {s.address}</span>
            <span>{s.lastSuccessAt ? t.mailbox.lastFetch.replace('{time}', fmtDateTime(s.lastSuccessAt)) : t.mailbox.neverFetched}</span>
            <span>{t.mailbox.schedule}</span>
          </Space>
        )}
        actions={<Button type="primary" icon={<SyncOutlined spin={running || start.pending} />} loading={false} disabled={running || start.pending} onClick={() => void start.run(undefined)}>{running ? t.mailbox.fetching : t.mailbox.fetchNow}</Button>}
      />
      {running && <Notice kind="info" title={t.mailbox.fetchingTitle}>{t.mailbox.fetchingText}</Notice>}
      {(failed || s?.lastFailure) && !running && <Notice kind="warn" title={t.mailbox.failed.replace('{time}', fmtDateTime(s?.lastFailure?.at ?? ''))}>{t.mailbox.failedHint}</Notice>}
      {start.error && <Notice kind="err">{start.error}</Notice>}
      {s && (
        <KpiRow>
          {[
            <Kpi key="m" title={t.mailbox.kMessages} value={s.messages} sub={t.mailbox.kMessagesSub} />,
            <Kpi key="c" title={t.mailbox.kCreated} value={s.invoicesCreated} sub={t.mailbox.kCreatedSub} />,
            <Kpi key="r" title={t.mailbox.kRejected} value={s.rejectedAttachments} color={s.rejectedAttachments > 0 ? TOKENS.error : undefined} sub={t.mailbox.kRejectedSub} />,
            <Kpi key="n" title={t.mailbox.kNone} value={s.noAttachment} />,
          ]}
        </KpiRow>
      )}
      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          className="view-tabs"
          aria-label={t.mailbox.savedViews}
          activeKey={tab}
          onChange={(k) => setTab(k as Tab)}
          items={[
            { key: 'all', label: <span>{t.mailbox.views.all}{tabCount(rows.length)}</span> },
            { key: 'accepted', label: <span>{t.mailbox.views.accepted}{tabCount(rows.filter((r) => r.att.result === 'ACCEPTED').length)}</span> },
            { key: 'rejected', label: <span>{t.mailbox.views.rejected}{tabCount(rows.filter((r) => r.att.result === 'REJECTED').length)}</span> },
            { key: 'none', label: <span>{t.mailbox.views.none}{tabCount(rows.filter((r) => r.att.result === 'NO_ATTACHMENT').length)}</span> },
          ]}
        />
        <Async
          q={msgs}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState title={t.mailbox.emptyTitle} text={t.mailbox.emptyText.replace('{a}', s?.address ?? '')} />}
        >
          {() => (
            <>
              <Table<Row> size="middle" rowKey="key" columns={cols} dataSource={view} pagination={{ pageSize: 20, hideOnSinglePage: true }} scroll={{ x: 800 }} sticky={{ offsetHeader: 56 }} />
              <Typography.Text type="secondary" className="xs" style={{ display: 'block', padding: '0 16px 12px' }}>{t.mailbox.footer.replace('{n}', String(view.length)).replace('{total}', String(rows.length)).replace('{m}', String(msgs.data?.length ?? 0))}</Typography.Text>
            </>
          )}
        </Async>
      </Card>
    </>
  );
}
