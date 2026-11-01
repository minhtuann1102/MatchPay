import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { MailboxAttachment, MailboxMessage } from '../api/types';
import { getMailboxFetchRun, startMailboxFetch } from '../api/mailbox';
import { useMailboxMessages, useMailboxStatus } from '../api/hooks';
import { Async } from '../components/Async';
import { EmptyState, Notice, PageHeader, Tabs } from '../components/Bits';
import { Chip } from '../components/Chips';
import { DataTable, type Col } from '../components/DataTable';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { fmtDateTime } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

type Tab = 'all' | 'accepted' | 'rejected' | 'none';
interface Row { key: string; msg: MailboxMessage; att: MailboxAttachment }

/** SCR-24 Mailbox Log: one row for each attachment, newest first, with a "fetch now" job. */
export function Mailbox() {
  const status = useMailboxStatus();
  const msgs = useMailboxMessages();
  const qc = useQueryClient();
  const toast = useToast();
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
        if (r.state === 'SUCCEEDED') toast(t.mailbox.fetched.replace('{n}', String(r.newMessages)));
        void qc.invalidateQueries();
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [runId, qc, toast]);

  const rows: Row[] = (msgs.data ?? []).flatMap((m) => m.attachments.map((a, i) => ({ key: `${m.id}-${i}`, msg: m, att: a })));
  const view = rows.filter((r) => tab === 'all' || (tab === 'accepted' && r.att.result === 'ACCEPTED') || (tab === 'rejected' && r.att.result === 'REJECTED') || (tab === 'none' && r.att.result === 'NO_ATTACHMENT'));
  const s = status.data;
  const running = !!runId || !!s?.running;

  const cols: Col<Row>[] = [
    { key: 'msg', label: t.mailbox.colMessage, header: t.mailbox.colMessage, sort: (r) => r.msg.id, render: (r) => <><b className="mono">{r.msg.id}</b> {r.msg.sender}<span className="sub">{r.msg.subject}</span></> },
    { key: 'at', label: t.mailbox.colReceived, header: t.mailbox.colReceived, sort: (r) => r.msg.receivedAt, render: (r) => fmtDateTime(r.msg.receivedAt) },
    { key: 'att', label: t.mailbox.colAttachment, header: t.mailbox.colAttachment, render: (r) => (r.att.fileName ? <span className="mono">{r.att.fileName}</span> : <span className="muted">{t.mailbox.none}</span>) },
    { key: 'res', label: t.mailbox.colResult, header: t.mailbox.colResult, render: (r) => <Chip kind={r.att.result === 'ACCEPTED' ? 'ok' : r.att.result === 'REJECTED' ? 'bad' : 'end'}>{t.mailbox.result[r.att.result]}</Chip> },
    {
      key: 'why', label: t.mailbox.colDetail, header: t.mailbox.colDetail,
      render: (r) =>
        r.att.result === 'ACCEPTED' && r.att.invoiceId ? <><Link to={`/invoices/${r.att.invoiceId}`}>{r.att.invoiceNumber}</Link><span className="sub">{t.mailbox.sourceEmail}</span></>
        : r.att.result === 'REJECTED' && r.att.rejection ? <span>{t.mailbox.rejection[r.att.rejection]}</span>
        : <span className="muted">{t.mailbox.noAttachmentText}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title={t.mailbox.title}
        meta={s && (<><span className="mono">{s.address}</span><span>{s.lastSuccessAt ? t.mailbox.lastFetch.replace('{time}', fmtDateTime(s.lastSuccessAt)) : t.mailbox.neverFetched}</span><span>{t.mailbox.schedule}</span></>)}
        actions={<button type="button" className="btn btn-primary" onClick={() => void start.run(undefined)} disabled={running || start.pending}>{(running || start.pending) ? <span className="spin" /> : <Icon name="refresh" />}{running ? t.mailbox.fetching : t.mailbox.fetchNow}</button>}
      />
      {running && <Notice kind="info" icon="refresh" title={t.mailbox.fetchingTitle}>{t.mailbox.fetchingText}</Notice>}
      {(failed || s?.lastFailure) && !running && <Notice kind="warn" title={t.mailbox.failed.replace('{time}', fmtDateTime(s?.lastFailure?.at ?? ''))}>{t.mailbox.failedHint}</Notice>}
      {start.error && <Notice kind="err">{start.error}</Notice>}
      {s && (
        <div className="kpis">
          <div className="tile"><span className="t-lbl">{t.mailbox.kMessages}</span><span className="t-val">{s.messages}</span><span className="t-sub">{t.mailbox.kMessagesSub}</span></div>
          <div className="tile"><span className="t-lbl">{t.mailbox.kCreated}</span><span className="t-val">{s.invoicesCreated}</span><span className="t-sub">{t.mailbox.kCreatedSub}</span></div>
          <div className="tile"><span className="t-lbl">{t.mailbox.kRejected}</span><span className="t-val">{s.rejectedAttachments}</span><span className="t-sub">{t.mailbox.kRejectedSub}</span></div>
          <div className="tile"><span className="t-lbl">{t.mailbox.kNone}</span><span className="t-val">{s.noAttachment}</span></div>
        </div>
      )}
      <section className="card">
        <Tabs<Tab> label={t.mailbox.savedViews} value={tab} onChange={setTab} tabs={[
          { id: 'all', label: t.mailbox.views.all, count: rows.length },
          { id: 'accepted', label: t.mailbox.views.accepted, count: rows.filter((r) => r.att.result === 'ACCEPTED').length },
          { id: 'rejected', label: t.mailbox.views.rejected, count: rows.filter((r) => r.att.result === 'REJECTED').length },
          { id: 'none', label: t.mailbox.views.none, count: rows.filter((r) => r.att.result === 'NO_ATTACHMENT').length },
        ]} />
        <Async
          q={msgs}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState icon="mail" title={t.mailbox.emptyTitle} text={t.mailbox.emptyText.replace('{a}', s?.address ?? '')} />}
        >
          {() => (
            <>
              <DataTable columns={cols} rows={view} rowKey={(r) => r.key} caption={t.mailbox.title} initialSort={{ key: 'at', dir: 'desc' }} />
              <p className="tbl-foot">{t.mailbox.footer.replace('{n}', String(view.length)).replace('{total}', String(rows.length)).replace('{m}', String(msgs.data?.length ?? 0))}</p>
            </>
          )}
        </Async>
      </section>
    </>
  );
}
