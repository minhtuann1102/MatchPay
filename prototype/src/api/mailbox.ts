import type { FetchRun, Id, MailboxMessage } from './types';
import { ApiError, AP, call, getForced } from './client';
import { entityOf } from './domain';
import { createReceivedInvoice } from './invoices';
import { logAudit, nextSeq, pad } from '../mock/db';
import { MOCK_TEXT } from '../mock/labels';

const realStart = new Map<Id, number>();
const FETCH_MS = 2200;

export interface MailboxStatus {
  address: string;
  lastSuccessAt: string | null;
  lastFailure: { at: string } | null;
  messages: number;
  invoicesCreated: number;
  rejectedAttachments: number;
  noAttachment: number;
  attachments: number;
  running: FetchRun | null;
}

export const getMailboxStatus = () =>
  call<MailboxStatus>({ roles: AP }, (d, u) => {
    const ent = entityOf(d, u.entityId!);
    const msgs = d.mailbox.filter((m) => m.entityId === u.entityId);
    const atts = msgs.flatMap((m) => m.attachments);
    const runs = d.fetchRuns.filter((r) => r.entityId === u.entityId);
    const lastOk = [...runs].reverse().find((r) => r.state === 'SUCCEEDED');
    const last = runs[runs.length - 1];
    return {
      address: ent.mailbox,
      lastSuccessAt: lastOk?.finishedAt ?? null,
      lastFailure: last?.state === 'FAILED' ? { at: last.finishedAt ?? last.startedAt } : null,
      messages: msgs.length,
      invoicesCreated: atts.filter((a) => a.result === 'ACCEPTED').length,
      rejectedAttachments: atts.filter((a) => a.result === 'REJECTED').length,
      noAttachment: atts.filter((a) => a.result === 'NO_ATTACHMENT').length,
      attachments: atts.length,
      running: runs.find((r) => r.state === 'RUNNING') ?? null,
    };
  });

export const listMailboxMessages = () =>
  call<MailboxMessage[]>({ roles: AP }, (d, u) => d.mailbox.filter((m) => m.entityId === u.entityId).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt) || b.id.localeCompare(a.id)));

export const getMailboxMessage = (id: string) =>
  call<MailboxMessage>({ roles: AP }, (d, u) => {
    const m = d.mailbox.find((x) => x.id === id && x.entityId === u.entityId);
    if (!m) throw new ApiError(404, 'NOT_FOUND');
    return m;
  });

export const startMailboxFetch = () =>
  call<FetchRun>({ roles: AP, write: true }, (d, u) => {
    const running = d.fetchRuns.find((r) => r.entityId === u.entityId && r.state === 'RUNNING');
    if (running) return running;
    const run: FetchRun = { id: `fetch-${nextSeq(d, 'fetch')}`, entityId: u.entityId!, state: 'RUNNING', startedAt: d.now, finishedAt: null, newMessages: 0 };
    d.fetchRuns.push(run);
    realStart.set(run.id, Date.now());
    return run;
  });

/** Polled by the page. The run ends after a short delay and adds the new messages (a message fetched before is not processed again). */
export const getMailboxFetchRun = (id: Id) =>
  call<FetchRun>({ roles: AP, write: true, fast: true }, (d, u) => {
    const run = d.fetchRuns.find((r) => r.id === id && r.entityId === u.entityId);
    if (!run) throw new ApiError(404, 'NOT_FOUND');
    if (run.state !== 'RUNNING') return run;
    if (Date.now() - (realStart.get(id) ?? 0) < FETCH_MS) return run;
    run.finishedAt = d.now;
    if (getForced() === 'ai-error') {
      run.state = 'FAILED';
      return run;
    }
    run.state = 'SUCCEEDED';
    const n1 = nextSeq(d, 'message');
    const idx = d.invoices.length;
    const inv = createReceivedInvoice(d, u.entityId!, 'EMAIL', `MSG-${pad(n1)}`, idx);
    d.mailbox.push({ id: `MSG-${pad(n1)}`, entityId: u.entityId!, sender: inv.sellerName, receivedAt: d.now, subject: `${MOCK_TEXT.fetchedSubject} ${inv.invoiceNumber}`, attachments: [{ fileName: `inv-${inv.invoiceNumber}.xml`, result: 'ACCEPTED', invoiceId: inv.id, invoiceNumber: inv.invoiceNumber }] });
    const n2 = nextSeq(d, 'message');
    d.mailbox.push({ id: `MSG-${pad(n2)}`, entityId: u.entityId!, sender: inv.sellerName, receivedAt: d.now, subject: MOCK_TEXT.fetchedOtherSubject, attachments: [{ fileName: 'doi-chieu.pdf', result: 'REJECTED', rejection: 'XML_NOT_SUPPORTED' }] });
    run.newMessages = 2;
    logAudit(d, { entityId: u.entityId, hand: 'SYSTEM', eventType: 'MAILBOX', objectType: 'MAILBOX', objectId: `MSG-${pad(n2)}`, objectLabel: `MSG-${pad(n2)}`, event: { code: 'EV_MAILBOX_FETCH', params: { messages: 2 } } });
    return run;
  });
