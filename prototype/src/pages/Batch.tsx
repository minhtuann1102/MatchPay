import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Descriptions, Input, List, Radio, Select, Space, Steps, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import type { BatchOverview, Invoice, PaymentRequest, SampleItem } from '../api/types';
import { closeBatchForReview, expandSample, markSampleItem, releaseBatch, reopenBatch, resendToErp } from '../api/batch';
import { useBatch, useBatchList } from '../api/hooks';
import { Async } from '../components/Async';
import { EmptyState, MoreMenu, Notice, PageHeader, InvNo, ReqNo } from '../components/Bits';
import { BatchBadge, HandTag, RequestBadge, StateBadge, StatusDot } from '../components/Tags';
import { ActionError, ActionModal, ReasonModal } from '../components/Dialogs';
import { Kpi, KpiRow } from '../components/Kpi';
import { fmtDate, fmtDateTime, fmtMoney } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';
import { TOKENS } from '../theme/theme';

type Dlg = null | 'close' | 'release' | 'expand' | 'reopen' | { resend: PaymentRequest };

const STAGES = ['open', 'closed', 'sampled', 'released', 'sent'] as const;

function currentStage(o: BatchOverview): number {
  switch (o.batch.state) {
    case 'OPEN': return 0;
    case 'IN_REVIEW': return o.batch.sample.length > 0 && o.sampleRemaining === 0 ? 2 : 1;
    case 'IN_SIGNING': return 3;
    case 'SIGNED': return 3;
    case 'SENT': return 4;
    case 'COMPLETED': return 5;
  }
}

/** SCR-30 Batch Review, with SCR-31 to SCR-34 and SCR-57 as modals. */
export function Batch() {
  const list = useBatchList();
  const [sel, setSel] = useState<string | null>(null);
  const q = useBatch(sel);
  const [dlg, setDlg] = useState<Dlg>(null);
  const close = () => setDlg(null);
  return (
    <Async q={q} skeletonRows={8} isEmpty={(d) => !d} empty={<Card><EmptyState title={t.batch.noBatchTitle} text={t.batch.noBatchText} /></Card>}>
      {(o) =>
        o ? (
          <BatchView o={o} options={list.data ?? []} selected={sel ?? o.batch.id} onSelect={setSel} dlg={dlg} setDlg={setDlg} close={close} />
        ) : null
      }
    </Async>
  );
}

type AdmitRow = { key: string; kind: 'group' | 'inv' | 'sub'; name: string; inv?: Invoice; count: number; sum: number };

function BatchView({ o, options, selected, onSelect, dlg, setDlg, close }: { o: BatchOverview; options: { id: string; label: string; state: string }[]; selected: string; onSelect: (id: string) => void; dlg: Dlg; setDlg: (d: Dlg) => void; close: () => void }) {
  const b = o.batch;
  const stage = currentStage(o);
  const markAct = useAction((a: { invoiceId: string; mark: 'OK' | 'ERROR'; reason?: string }) => markSampleItem(b.id, { ...a, version: b.version }), { success: t.batch.toastMarked });
  const requestsRows = o.requests;

  const primary: ReactNode =
    b.state === 'OPEN' ? <Button type="primary" disabled={o.invoices.length === 0} onClick={() => setDlg('close')}>{t.batch.close}</Button>
    : b.state === 'IN_REVIEW' ? <Button type="primary" disabled={o.sampleRemaining > 0 || o.invoices.length === 0} onClick={() => setDlg('release')}>{t.batch.release}</Button>
    : null;

  const menuItems = [
    ...(b.state === 'IN_REVIEW' ? [{ label: t.batch.expand, onClick: () => setDlg('expand') }] : []),
    ...(b.state === 'IN_SIGNING' ? [{ label: t.batch.reopen, onClick: () => setDlg('reopen') }] : []),
  ];

  const dueSoonest = [...o.invoices].sort((a, c) => a.dueDate.localeCompare(c.dueDate))[0];
  const grouped = new Map<string, Invoice[]>();
  o.invoices.forEach((i) => grouped.set(i.sellerName, [...(grouped.get(i.sellerName) ?? []), i]));
  const admitRows: AdmitRow[] = [...grouped.entries()].flatMap(([name, list]) => [
    { key: `g-${name}`, kind: 'group' as const, name, count: list.length, sum: 0 },
    ...list.map((i) => ({ key: i.id, kind: 'inv' as const, name, inv: i, count: 0, sum: i.totalAmount })),
    { key: `s-${name}`, kind: 'sub' as const, name, count: list.length, sum: list.reduce((s, i) => s + i.totalAmount, 0) },
  ]);
  const admitCols: TableColumnsType<AdmitRow> = [
    {
      title: t.invoices.colInvoice, key: 'inv',
      onCell: (r) => ({ colSpan: r.kind === 'group' ? 5 : r.kind === 'sub' ? 3 : 1 }),
      render: (_, r) => r.kind === 'group' ? <Typography.Text strong>{t.batch.supplierGroup.replace('{s}', r.name).replace('{n}', String(r.count))}</Typography.Text>
        : r.kind === 'sub' ? <Typography.Text type="secondary">{t.batch.subtotal.replace('{s}', r.name)}</Typography.Text>
        : <Link to={`/invoices/${r.inv!.id}`}><InvNo value={r.inv!.invoiceNumber} /></Link>,
    },
    { title: t.invoices.colDue, key: 'due', onCell: (r) => ({ colSpan: r.kind === 'inv' ? 1 : 0 }), render: (_, r) => (r.inv ? fmtDate(r.inv.dueDate) : null) },
    { title: t.invoices.colState, key: 'st', onCell: (r) => ({ colSpan: r.kind === 'inv' ? 1 : 0 }), render: (_, r) => (r.inv ? <StateBadge state={r.inv.state} /> : null) },
    { title: t.invoices.colTotal, key: 'tot', align: 'right', onCell: (r) => ({ colSpan: r.kind === 'group' ? 0 : 1 }), render: (_, r) => (r.kind === 'sub' ? <b>{fmtMoney(r.sum)}</b> : fmtMoney(r.sum)) },
    {
      title: <span className="sr">{t.common.actions}</span>, key: 'act', fixed: 'right', width: 110, onCell: (r) => ({ colSpan: r.kind === 'inv' ? 1 : 0 }),
      render: (_, r) => (r.inv ? <Link to={`/invoices/${r.inv.id}`}><Button type="link" size="small">{t.batch.withdrawLink}</Button></Link> : null),
    },
  ];

  const reqCols: TableColumnsType<PaymentRequest> = [
    { title: t.batch.colRequest, key: 'r', render: (_, r) => <ReqNo value={r.id} /> },
    { title: t.batch.colSupplier, key: 's', render: (_, r) => o.invoices.find((i) => r.invoiceIds.includes(i.id))?.sellerName ?? '-' },
    { title: t.invoices.colTotal, key: 't', align: 'right', render: (_, r) => fmtMoney(r.total) },
    { title: t.batch.colLevel, key: 'l', render: (_, r) => t.approvalLevel[r.level] },
    {
      title: t.invoices.colState, key: 'st',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <RequestBadge state={r.state} />
          {r.signatures.map((s) => <Typography.Text type="secondary" className="xs" key={s.userId}>{t.batch.signedBy.replace('{who}', s.name).replace('{time}', fmtDateTime(s.at))}</Typography.Text>)}
          {r.declineReason && r.state === 'CANCELLED' && <Typography.Text type="secondary" className="xs">{r.declineReason}</Typography.Text>}
        </Space>
      ),
    },
    {
      title: t.batch.colErp, key: 'e',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <span>{t.sendStatus(r)}</span>
          {o.canResend.includes(r.id) && <Button size="small" onClick={() => setDlg({ resend: r })}>{t.batch.resend}</Button>}
          {r.paymentRef && <Typography.Text type="secondary" className="xs mono">{r.paymentRef}</Typography.Text>}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={`${t.batch.title}: ${b.label}`}
        meta={
          <Space size={12} wrap>
            <BatchBadge state={b.state} />
            {options.length > 1 && (
              <Space size={6}>
                <span>{t.batch.period}</span>
                <Select
                  aria-label={t.batch.period}
                  style={{ minWidth: 220 }}
                  value={selected}
                  onChange={onSelect}
                  options={options.map((x) => ({ value: x.id, label: `${x.label} - ${t.batchState[x.state as 'OPEN']}` }))}
                />
              </Space>
            )}
          </Space>
        }
        actions={<>{menuItems.length > 0 && <MoreMenu items={menuItems} />}{primary}</>}
      />
      {b.state === 'IN_REVIEW' && o.sampleRemaining > 0 && <Typography.Text type="secondary" role="status">{t.batch.stillToMark.replace('{n}', String(o.sampleRemaining))} {t.batch.releaseNeeds}</Typography.Text>}

      <Card size="small" aria-label={t.batch.progress}>
        <Steps size="small" progressDot current={stage} items={STAGES.map((k) => ({ title: t.batch.stages[k] }))} />
      </Card>

      {b.reopenedNote && b.state === 'IN_REVIEW' && <Notice kind="info" title={t.batch.reopenedDone}>{t.batch.reopenedText}</Notice>}
      {o.canResend.length > 0 && requestsRows.filter((r) => o.canResend.includes(r.id)).map((r) => (
        <Notice key={r.id} kind="warn" title={t.batch.sendFailed.replace('{r}', r.id)} action={<Button size="small" onClick={() => setDlg({ resend: r })}>{t.batch.resend}</Button>}>{t.batch.sendFailedText}</Notice>
      ))}

      <KpiRow>
        {[
          <Kpi key="i" title={t.batch.kInvoices} value={o.invoices.length} sub={t.batch.kInvoicesSub} />,
          <Kpi key="t" title={t.batch.kTotal} value={fmtMoney(o.total)} sub={t.batch.kTotalSub.replace('{n}', String(o.invoices.length))} />,
          <Kpi key="r" title={t.batch.kRequests} value={requestsRows.filter((r) => r.state !== 'CANCELLED').length || o.requestCountOnRelease} sub={requestsRows.length ? t.batch.kRequestsReleased : t.batch.kRequestsPlanned} />,
          <Kpi key="d" title={t.batch.kDue} value={dueSoonest ? fmtDate(dueSoonest.dueDate) : '-'} sub={dueSoonest ? `${dueSoonest.invoiceNumber}, ${dueSoonest.sellerName}` : t.invoices.kpiNone} />,
        ]}
      </KpiRow>

      {(b.sample.length > 0 || b.state === 'IN_REVIEW') && (
        <Card
          title={<Space wrap>{t.batch.sampleTitle}{b.selectedWithoutAi ? <StatusDot tone="warning">{t.batch.withoutAi}</StatusDot> : <HandTag hand="AI" />}</Space>}
          extra={b.state === 'IN_REVIEW' ? <Button size="small" onClick={() => setDlg('expand')}>{t.batch.expand}</Button> : undefined}
        >
          <div className="stack" style={{ gap: 8 }}>
            <Typography.Text>
              {t.batch.sampleExplain.replace('{n}', String(o.invoices.length + b.sample.filter((s) => s.mark === 'ERROR').length)).replace('{rate}', String(10)).replace('{size}', String(o.sampleSizeOnClose))}
            </Typography.Text>
            {b.expansions.map((e) => (
              <Typography.Text key={e.no} type="secondary">{t.batch.expansionLine.replace('{time}', fmtDateTime(e.at)).replace('{who}', e.byName).replace('{reason}', e.reason).replace('{n}', String(e.added))}</Typography.Text>
            ))}
            {b.sample.length === 0 ? <Typography.Text type="secondary">{t.batch.noSample}</Typography.Text> : (
              <>
                <List
                  bordered
                  dataSource={b.sample}
                  renderItem={(s) => (
                    <SampleRow key={s.invoiceId} item={s} invoice={o.sampleInvoices.find((i) => i.id === s.invoiceId)} editable={b.state === 'IN_REVIEW'} pending={markAct.pending} onMark={(mark, reason) => markAct.run({ invoiceId: s.invoiceId, mark, reason })} />
                  )}
                />
                <Space split={<span>-</span>} wrap><Typography.Text>{t.batch.stillToMark.replace('{n}', String(o.sampleRemaining))}</Typography.Text><Typography.Text type="secondary" className="xs">{t.batch.errorWarning}</Typography.Text></Space>
              </>
            )}
            <ActionError error={markAct.error} raw={markAct.rawError} />
          </div>
        </Card>
      )}

      <Card title={<Space wrap>{t.batch.admittedTitle}<HandTag hand="RULE" /><Typography.Text type="secondary" className="xs">{t.batch.groupedBy}</Typography.Text></Space>} styles={{ body: { padding: o.invoices.length ? 0 : undefined } }}>
        {o.invoices.length === 0 ? (
          <EmptyState title={t.batch.noInvoices} text={t.batch.noInvoicesText} />
        ) : (
          <Table<AdmitRow>
            size="middle"
            rowKey="key"
            pagination={false}
            columns={admitCols}
            dataSource={admitRows}
            scroll={{ x: 640 }}
            sticky={{ offsetHeader: 56 }}
            rowClassName={(r) => (r.kind === 'group' ? 'row-group' : r.kind === 'sub' ? 'row-sub total-row' : '')}
            summary={() => (
              <Table.Summary.Row className="row-sub total-row">
                <Table.Summary.Cell index={0} colSpan={3}><b>{t.batch.totalRow.replace('{n}', String(o.invoices.length))}</b></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right"><b>{fmtMoney(o.total)}</b></Table.Summary.Cell>
                <Table.Summary.Cell index={2} />
              </Table.Summary.Row>
            )}
          />
        )}
      </Card>

      {requestsRows.length > 0 && (
        <Card title={t.batch.requestsTitle} extra={<Typography.Text type="secondary" className="xs">{t.batch.requestsSub.replace('{total}', fmtMoney(requestsRows.filter((r) => r.state !== 'CANCELLED').reduce((s, r) => s + r.total, 0)))}</Typography.Text>} styles={{ body: { padding: 0 } }}>
          <Table<PaymentRequest> size="middle" rowKey="id" pagination={false} columns={reqCols} dataSource={requestsRows} scroll={{ x: 720 }} sticky={{ offsetHeader: 56 }} />
        </Card>
      )}

      {dlg === 'close' && <CloseModal o={o} onClose={close} />}
      {dlg === 'release' && <ReleaseModal o={o} onClose={close} />}
      {dlg === 'expand' && <ExpandModal o={o} onClose={close} />}
      {dlg === 'reopen' && <ReopenModal o={o} onClose={close} />}
      {dlg && typeof dlg === 'object' && <ResendModal r={dlg.resend} onClose={close} />}
    </>
  );
}

function SampleRow({ item, invoice, editable, pending, onMark }: { item: SampleItem; invoice?: Invoice; editable: boolean; pending: boolean; onMark: (m: 'OK' | 'ERROR', reason?: string) => Promise<unknown> }) {
  const [errOpen, setErrOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const invalid = !reason.trim();
  return (
    <List.Item className="sample-item">
      <div className="sample-row">
        <div className="sample-top">
          <div>
            {invoice ? <Link to={`/invoices/${invoice.id}`}><InvNo value={invoice.invoiceNumber} /></Link> : <b>{item.invoiceId}</b>} <Typography.Text type="secondary">{invoice?.sellerName}</Typography.Text>
            <div>{t.why(item.why.code, item.why.params)}{item.expansionNo > 0 && <Tag style={{ marginInlineStart: 8 }}>{t.batch.expansionTag.replace('{n}', String(item.expansionNo))}</Tag>}</div>
          </div>
          <Space wrap>
            <b>{invoice ? fmtMoney(invoice.totalAmount) : ''}</b>
            {item.mark ? (
              item.mark === 'OK' ? <StatusDot tone="success">{t.batch.markOk}</StatusDot> : <StatusDot tone="error">{t.batch.markError}</StatusDot>
            ) : editable ? (
              <Space role="group" aria-label={t.batch.yourCheck}>
                <Button size="small" disabled={pending} onClick={() => void onMark('OK')}>{t.batch.markOk}</Button>
                <Button size="small" danger={errOpen} aria-pressed={errOpen} disabled={pending} onClick={() => setErrOpen((x) => !x)}>{t.batch.markError}</Button>
              </Space>
            ) : (
              <StatusDot tone="neutral">{t.batch.notMarked}</StatusDot>
            )}
          </Space>
        </div>
        {item.mark && <Typography.Text type="secondary" className="xs">{item.mark === 'OK' ? t.batch.markedBy.replace('{who}', item.markedBy ?? '').replace('{time}', fmtDateTime(item.markedAt)) : t.batch.errorBy.replace('{who}', item.markedBy ?? '').replace('{reason}', item.errorReason ?? '')}</Typography.Text>}
        {errOpen && !item.mark && (
          <div className="stack" style={{ gap: 8 }}>
            <label htmlFor={`err-${item.invoiceId}`}>{t.batch.errorReason} <span style={{ color: TOKENS.error }}>*</span></label>
            <Input.TextArea id={`err-${item.invoiceId}`} rows={3} maxLength={500} showCount autoFocus status={touched && invalid ? 'error' : undefined} value={reason} onChange={(e) => setReason(e.target.value)} />
            <Typography.Text type={touched && invalid ? 'danger' : 'secondary'} className="xs">{touched && invalid ? t.batch.errorReasonRequired : t.batch.errorHint}</Typography.Text>
            <Space>
              <Button danger size="small" disabled={pending} onClick={() => { setTouched(true); if (!invalid) void onMark('ERROR', reason.trim()); }}>{t.batch.confirmError}</Button>
              <Button type="text" size="small" onClick={() => setErrOpen(false)}>{t.common.cancel}</Button>
            </Space>
          </div>
        )}
      </div>
    </List.Item>
  );
}

// ----- Modals -----
function CloseModal({ o, onClose }: { o: BatchOverview; onClose: () => void }) {
  const act = useAction(() => closeBatchForReview(o.batch.id, { version: o.batch.version }), { success: t.batch.toastClosed, onSuccess: onClose });
  const [y, m] = o.batch.period.split('-').map(Number) as [number, number];
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  return (
    <ActionModal title={t.batch.closeTitle} okText={t.batch.close} pending={act.pending} error={act.error} rawError={act.rawError} onClose={onClose} onOk={() => void act.run(undefined)}>
      <Descriptions colon={false} size="small" column={1} items={[
        { key: 'p', label: t.batch.period, children: o.batch.label },
        { key: 'i', label: t.batch.kInvoices, children: t.batch.countTotal.replace('{n}', String(o.invoices.length)).replace('{total}', fmtMoney(o.total)) },
        { key: 's', label: t.batch.sampleSize, children: t.batch.sampleSizeValue.replace('{n}', String(o.sampleSizeOnClose)) },
      ]} />
      <Notice kind="info">{t.batch.nextPeriodNote.replace('{p}', t.periodLabel(next))}</Notice>
    </ActionModal>
  );
}

function ReleaseModal({ o, onClose }: { o: BatchOverview; onClose: () => void }) {
  const act = useAction(() => releaseBatch(o.batch.id, { version: o.batch.version }), { success: t.batch.toastReleased, onSuccess: onClose });
  return (
    <ActionModal title={t.batch.releaseTitle} okText={t.batch.release} okDisabled={o.sampleRemaining > 0} pending={act.pending} error={act.error} rawError={act.rawError} onClose={onClose} onOk={() => void act.run(undefined)}>
      <Descriptions colon={false} size="small" column={1} items={[
        { key: 'i', label: t.batch.kInvoices, children: t.batch.countTotal.replace('{n}', String(o.invoices.length)).replace('{total}', fmtMoney(o.total)) },
        { key: 's', label: t.batch.sampleTitle, children: o.sampleRemaining === 0 ? <Typography.Text type="success"><CheckCircleFilled /> {t.batch.allMarked}</Typography.Text> : <Typography.Text type="danger">{t.batch.stillToMark.replace('{n}', String(o.sampleRemaining))}</Typography.Text> },
        { key: 'r', label: t.batch.kRequests, children: t.batch.requestsOnRelease.replace('{n}', String(o.requestCountOnRelease)) },
      ]} />
      <Typography.Text type="secondary">{t.batch.afterRelease}</Typography.Text>
    </ActionModal>
  );
}

function ExpandModal({ o, onClose }: { o: BatchOverview; onClose: () => void }) {
  const original = Math.max(1, o.batch.sample.filter((s) => s.expansionNo === 0).length);
  const [all, setAll] = useState(false);
  const act = useAction((reason: string) => expandSample(o.batch.id, { reason, all, version: o.batch.version }), { success: t.batch.toastExpanded, onSuccess: onClose });
  const full = o.notInSample === 0;
  const willAdd = all ? o.notInSample : Math.min(original, o.notInSample);
  return (
    <ReasonModal
      title={t.batch.expandTitle}
      label={t.batch.expandReason}
      confirmLabel={t.batch.expand}
      pending={act.pending}
      error={act.error}
      rawError={act.rawError}
      onSubmit={(r) => void act.run(r)}
      onClose={onClose}
      intro={
        <>
          <Descriptions colon={false} size="small" column={1} items={[
            { key: 'c', label: t.batch.currentSample, children: t.batch.currentSampleValue.replace('{n}', String(o.batch.sample.length)).replace('{e}', String(o.batch.sample.filter((s) => s.mark === 'ERROR').length)) },
            { key: 'n', label: t.batch.notInSample, children: t.batch.invoicesN.replace('{n}', String(o.notInSample)) },
            { key: 'w', label: t.batch.willAdd, children: full ? '-' : t.batch.invoicesN.replace('{n}', String(willAdd)) },
          ]} />
          {full ? <Notice kind="warn">{t.batch.sampleFull}</Notice> : (
            <Radio.Group value={all ? 'all' : 'orig'} onChange={(e) => setAll(e.target.value === 'all')} style={{ display: 'grid', gap: 8 }}>
              <Radio value="orig">{t.batch.addOriginal.replace('{n}', String(Math.min(original, o.notInSample)))}</Radio>
              <Radio value="all">{t.batch.addAll.replace('{n}', String(o.notInSample))}</Radio>
            </Radio.Group>
          )}
          <Typography.Text type="secondary" className="xs">{t.batch.expandNote}</Typography.Text>
        </>
      }
    />
  );
}

function ReopenModal({ o, onClose }: { o: BatchOverview; onClose: () => void }) {
  const act = useAction((reason: string) => reopenBatch(o.batch.id, { reason, version: o.batch.version }), { success: t.batch.toastReopened, onSuccess: onClose });
  const signed = o.requests.find((r) => r.state !== 'CANCELLED' && r.signatures.length > 0);
  const live = o.requests.filter((r) => r.state !== 'CANCELLED').length;
  return (
    <ReasonModal
      title={t.batch.reopenTitle}
      label={t.batch.reopenReason}
      confirmLabel={t.batch.reopen}
      pending={act.pending}
      error={act.error}
      rawError={act.rawError}
      onSubmit={(r) => void act.run(r)}
      onClose={onClose}
      intro={
        <>
          {signed && <Notice kind="err" title={t.errors.REQUEST_ALREADY_SIGNED_TITLE}>{t.errors.REQUEST_ALREADY_SIGNED.replace('{request}', signed.id).replace('{by}', signed.signatures[0]!.name)}</Notice>}
          <Descriptions colon={false} size="small" column={1} items={[
            { key: 'r', label: t.batch.requestsCancelled, children: signed ? t.batch.notPossible : t.batch.noneSigned.replace('{n}', String(live)) },
            { key: 'i', label: t.batch.kInvoices, children: t.batch.invoicesStay.replace('{n}', String(o.invoices.length)) },
            { key: 'k', label: t.batch.kept, children: t.batch.keptValue },
          ]} />
        </>
      }
    />
  );
}

function ResendModal({ r, onClose }: { r: PaymentRequest; onClose: () => void }) {
  const act = useAction(() => resendToErp(r.id, { version: r.version }), { success: t.batch.toastResent, onSuccess: onClose });
  return (
    <ActionModal title={t.batch.resendTitle} okText={t.batch.resend} pending={act.pending} error={act.error} rawError={act.rawError} onClose={onClose} onOk={() => void act.run(undefined)}>
      <Descriptions colon={false} size="small" column={1} items={[
        { key: 'r', label: t.batch.colRequest, children: <><ReqNo value={r.id} />, {fmtMoney(r.total)}</> },
        { key: 'a', label: t.batch.autoAttempts, children: t.batch.attemptsFailed.replace('{n}', String(r.attempts.filter((a) => !a.manual).length)).replace('{time}', fmtDateTime(r.attempts[r.attempts.length - 1]?.at)) },
      ]} />
      <Alert type="info" showIcon message={t.batch.resendNote.replace('{r}', r.id)} />
    </ActionModal>
  );
}
