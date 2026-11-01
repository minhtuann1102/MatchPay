import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Card, Col, Descriptions, List, Row, Space, Statistic, Steps, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { EditOutlined, SwapOutlined, LockOutlined, WarningOutlined, SendOutlined } from '@ant-design/icons';
import { resendToErp } from '../api/batch';
import { declineRequest, removeRequestLine, type RequestDetail as Detail } from '../api/signing';
import { useRequest } from '../api/hooks';
import { Async, useForced } from '../components/Async';
import { InvNo, Notice, PageHeader, ReqNo, SealStamp } from '../components/Bits';
import { HandTag, RequestBadge, StateBadge } from '../components/Tags';
import { ActionModal, ReasonModal } from '../components/Dialogs';
import { fmtDate, fmtDateTime, fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { signReasonText, SignModal } from './Signing';
import { t } from '../i18n/vi';

const STEPS = ['AWAITING_CHIEF_ACCOUNTANT', 'AWAITING_PAYMENT_APPROVER', 'SIGNED', 'SENT', 'PAID'] as const;

/** SCR-51 Payment Request Detail with SCR-53 (remove line), SCR-54 (decline), SCR-52 (sign) and SCR-57 (resend to ERP). */
export function RequestDetailPage() {
  const { id = '' } = useParams();
  const q = useRequest(id);
  return <Async q={q} skeletonRows={8}>{(d) => <Body d={d} />}</Async>;
}

type Dlg = null | 'sign' | 'decline' | 'resend' | { remove: string };

function Body({ d }: { d: Detail }) {
  const r = d.request;
  const forced = useForced();
  const [dlg, setDlg] = useState<Dlg>(null);
  const close = () => setDlg(null);
  const stepIdx = Math.max(0, STEPS.indexOf(r.state as (typeof STEPS)[number]));
  const awaiting = r.state.startsWith('AWAITING');
  const cancelled = r.state === 'CANCELLED';
  const blocked = awaiting && !r.sign.canSign;
  const summaryOk = d.summary && forced !== 'ai-error';

  const invCols: TableColumnsType<Detail['invoices'][number]> = [
    { title: t.request.colInvoice, key: 'i', render: (_, i) => <><Link to={`/invoices/${i.id}`}><InvNo value={i.invoiceNumber} /></Link><br /><Typography.Text type="secondary" className="xs">{i.sellerName}</Typography.Text></> },
    { title: t.request.colDue, key: 'd', render: (_, i) => fmtDate(i.dueDate) },
    { title: t.request.colTotal, key: 't', align: 'right', render: (_, i) => fmtMoney(i.totalAmount) },
    { title: t.request.colState, key: 's', render: (_, i) => <StateBadge state={i.state} /> },
    { title: <span className="sr">{t.request.colAction}</span>, key: 'a', fixed: 'right', width: 130, render: (_, i) => (awaiting ? <Button size="small" onClick={() => setDlg({ remove: i.id })}>{t.request.remove}</Button> : null) },
  ];

  return (
    <>
      <PageHeader
        crumbs={[{ label: t.nav.signing, to: '/signing' }, { label: <ReqNo value={r.id} /> }]}
        title={<ReqNo value={r.id} />}
        extra={<RequestBadge state={r.state} />}
        actions={
          <>
            {awaiting && <Button onClick={() => setDlg('decline')}>{t.request.decline}</Button>}
            {d.canResend && <Button icon={<SendOutlined />} onClick={() => setDlg('resend')}>{t.request.resend}</Button>}
            {r.sign.canSign && <Button type="primary" icon={<EditOutlined />} onClick={() => setDlg('sign')}>{t.request.signCta}</Button>}
          </>
        }
      />

      <Card aria-label={t.request.titleFallback}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={10}><Statistic title={t.signing.colTotal} value={fmtMoney(r.total)} valueStyle={{ fontSize: 28, fontWeight: 600 }} /></Col>
          <Col xs={24} md={14}>
            {!cancelled && r.signatures.length > 0 ? (
              <div className="seals" aria-label={t.request.sigTitle} style={{ justifyContent: 'flex-start' }}>
                {r.signatures.map((s) => (
                  <div className="stamped" key={s.step}>
                    <SealStamp role={s.role} at={s.at} small />
                    <div><b>{s.name}</b><br /><Typography.Text type="secondary">{t.roles[s.role]}, {fmtDateTime(s.at)}</Typography.Text></div>
                  </div>
                ))}
              </div>
            ) : (
              <Descriptions size="small" column={1} items={[
                { key: 's', label: t.request.supplier, children: r.supplierName },
                { key: 'l', label: t.request.level, children: t.approvalLevel[r.level] },
              ]} />
            )}
          </Col>
        </Row>
      </Card>

      {cancelled && r.declineReason && <Notice kind="err">{interpolate(t.request.cancelledNote, { r: r.declineReason, who: r.declinedByName ?? '' })}</Notice>}
      {d.canResend && <Notice kind="warn" title={interpolate(t.batch.sendFailed, { r: r.id })} action={<Button size="small" onClick={() => setDlg('resend')}>{t.request.resend}</Button>}>{t.batch.sendFailedText}</Notice>}
      {d.delegatedUntil && awaiting && <Notice kind="info" icon={<SwapOutlined />}>{interpolate(t.request.delegatedAway, { date: fmtDate(d.delegatedUntil) })}</Notice>}
      {r.sign.onBehalfOf && r.sign.canSign && <Notice kind="info" icon={<SwapOutlined />}>{interpolate(t.request.onBehalfNote, { who: r.sign.onBehalfOf })}</Notice>}
      {blocked && <Notice kind="warn" icon={<LockOutlined />} title={t.request.blockedHeading}>{signReasonText(r.sign.reason)}</Notice>}

      {!cancelled && (
        <Card size="small" aria-label={t.request.steps[r.state as keyof typeof t.request.steps] ?? ''}>
          <Steps
            size="small"
            current={stepIdx}
            items={STEPS.map((k, n) => ({
              title: t.request.steps[k],
              description: k === 'AWAITING_CHIEF_ACCOUNTANT' && r.signatures[0] ? `${r.signatures[0].name}, ${fmtDateTime(r.signatures[0].at)}`
                : k === 'AWAITING_PAYMENT_APPROVER' && r.signatures[1] ? `${r.signatures[1].name}, ${fmtDateTime(r.signatures[1].at)}`
                : k === 'SENT' && n === stepIdx && r.sendStatus === 'IN_ERP' ? t.sendStatus(r) : undefined,
            }))}
          />
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <div className="stack">
            <Card title={t.request.invoicesTitle} extra={<Typography.Text type="secondary" className="xs">{t.request.openInvoice}</Typography.Text>} styles={{ body: { padding: 0 } }}>
              <Table
                size="middle"
                rowKey="id"
                columns={invCols}
                dataSource={d.invoices}
                pagination={false}
                scroll={{ x: 600 }}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>{t.request.invoices}: {d.invoices.length}</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right"><b>{fmtMoney(r.total)}</b></Table.Summary.Cell>
                    <Table.Summary.Cell index={2} colSpan={2} />
                  </Table.Summary.Row>
                )}
              />
            </Card>

            <Card title={t.request.summaryTitle}>
              <div className="stack">
                {summaryOk ? (
                  <Card size="small" className="hand-card hand-card-ai" title={<HandTag hand="AI" />}>{interpolate(t.request.summaryText, { n: d.invoices.length })}</Card>
                ) : (
                  <Alert type="info" showIcon message={t.request.summaryUnavailable} />
                )}
                <Card size="small" className="hand-card hand-card-rule" title={<Space><HandTag hand="RULE" />{t.request.totalsTitle}</Space>}>
                  <Descriptions size="small" column={1} items={[
                    { key: 'e', label: t.request.byEntity, children: d.summary?.byEntity.map((x) => `${x.name}: ${fmtMoney(x.total)}`).join('; ') ?? fmtMoney(r.total) },
                    { key: 's', label: t.request.bySupplier, children: d.summary?.bySupplier.map((x) => `${x.name}: ${fmtMoney(x.total)}`).join('; ') ?? `${r.supplierName}: ${fmtMoney(r.total)}` },
                    { key: 'l', label: t.request.largeInvoices, children: d.largeInvoices.length ? d.largeInvoices.join(', ') : t.request.none },
                    ...(d.summary && d.summary.sampleTotal > 0 ? [{ key: 'a', label: t.request.sample, children: interpolate(t.request.sampleValue, { ok: d.summary.sampleOk, total: d.summary.sampleTotal }) }] : []),
                  ]} />
                </Card>
              </div>
            </Card>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <div className="stack">
            <Card title={t.request.signHeading} className="act-card">
              <div className="stack">
                <Descriptions size="small" column={1} items={[
                  { key: 's', label: t.request.supplier, children: r.supplierName },
                  { key: 'l', label: t.request.level, children: interpolate(r.level === 'CFO' ? t.request.levelRule : t.request.levelRuleLow, { level: t.approvalLevel[r.level] }) },
                  {
                    key: 'f', label: t.request.flags,
                    children: r.flags.bankChanged || r.flags.newSupplier
                      ? <Space direction="vertical" size={4}>{r.flags.bankChanged && <Tag color="warning" icon={<WarningOutlined />}>{t.request.flagBank}</Tag>}{r.flags.newSupplier && <Tag color="warning" icon={<WarningOutlined />}>{t.request.flagNew}</Tag>}</Space>
                      : interpolate(t.request.noFlags, { s: r.supplierName }),
                  },
                ]} />
                {r.sign.canSign ? (
                  <Button type="primary" icon={<EditOutlined />} onClick={() => setDlg('sign')}>{t.request.signCta}</Button>
                ) : (
                  <Typography.Text type="secondary">{awaiting ? signReasonText(r.sign.reason) : cancelled ? '' : t.request.readOnlyNote}</Typography.Text>
                )}
              </div>
            </Card>

            <Card title={t.request.sigTitle}>
              <div className="stack">
                {([1, 2] as const).map((step) => {
                  const s = r.signatures.find((x) => x.step === step);
                  if (r.individuallyApproved && step === 2) return null;
                  return s ? (
                    <div className="sig" key={step}>
                      <span className="sig-mark">{s.name.slice(0, 1)}</span>
                      <div>
                        <b>{s.name}</b>{s.onBehalfOfName && <> <Tag color="error">{interpolate(t.request.sigOnBehalf, { who: s.onBehalfOfName })}</Tag></>}
                        <br /><Typography.Text type="secondary" className="xs">{t.roles[s.role]}, {fmtDateTime(s.at)}</Typography.Text>
                        <br /><Typography.Text type="secondary" className="xs mono hash">{t.request.hash}: {s.contentHash}</Typography.Text>
                      </div>
                    </div>
                  ) : (
                    <div className="sig sig-pending" key={step}>
                      <span className="sig-mark">{step}</span>
                      <div><b>{step === 1 ? t.roles.CHIEF_ACCOUNTANT : `${t.roles.PAYMENT_APPROVER}, ${t.approvalLevel[r.level]}`}</b><br /><Typography.Text type="secondary" className="xs">{t.request.sigWaiting}</Typography.Text></div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title={t.request.erpTitle}>
              <div className="stack" style={{ gap: 8 }}>
                <Typography.Text>{r.state === 'CANCELLED' ? '' : t.sendStatus(r)}</Typography.Text>
                {r.paymentRef && <Typography.Text>{t.request.paymentRef}: <span className="mono">{r.paymentRef}</span></Typography.Text>}
                {d.attempts.length === 0 ? <Typography.Text type="secondary">{t.request.noAttempts}</Typography.Text> : (
                  <List
                    size="small"
                    aria-label={t.request.erpAttempts}
                    dataSource={d.attempts}
                    renderItem={(a) => <List.Item>{interpolate(t.request.attemptNo, { n: a.no })}: {t.request.attemptResult[a.result]}, {fmtDateTime(a.at)}{a.manual ? `. ${interpolate(t.request.attemptManual, { who: a.byName ?? '' })}` : ''}</List.Item>}
                  />
                )}
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      {dlg === 'sign' && <SignModal items={[r]} onClose={close} />}
      {dlg === 'decline' && <DeclineModal d={d} onClose={close} />}
      {dlg === 'resend' && <ResendConfirm d={d} onClose={close} />}
      {dlg && typeof dlg === 'object' && <RemoveModal d={d} invoiceId={dlg.remove} onClose={close} />}
    </>
  );
}

function RemoveModal({ d, invoiceId, onClose }: { d: Detail; invoiceId: string; onClose: () => void }) {
  const inv = d.invoices.find((i) => i.id === invoiceId)!;
  const act = useAction((reason: string) => removeRequestLine(d.request.id, { invoiceId, reason, version: d.request.version }), { success: t.request.removed, onSuccess: onClose });
  return (
    <ReasonModal title={interpolate(t.request.removeTitle, { n: inv.invoiceNumber })} intro={<Typography.Paragraph>{t.request.removeText}</Typography.Paragraph>} label={t.request.removeReason} confirmLabel={t.request.remove} danger pending={act.pending} error={act.error} rawError={act.rawError} onSubmit={(x) => void act.run(x)} onClose={onClose} />
  );
}

function DeclineModal({ d, onClose }: { d: Detail; onClose: () => void }) {
  const act = useAction((reason: string) => declineRequest(d.request.id, { reason, version: d.request.version }), { success: t.request.declined, onSuccess: onClose });
  return (
    <ReasonModal title={interpolate(t.request.declineTitle, { r: d.request.id })} intro={<Typography.Paragraph>{t.request.declineText}</Typography.Paragraph>} label={t.request.declineReason} confirmLabel={t.request.decline} danger pending={act.pending} error={act.error} rawError={act.rawError} onSubmit={(x) => void act.run(x)} onClose={onClose} />
  );
}

function ResendConfirm({ d, onClose }: { d: Detail; onClose: () => void }) {
  const act = useAction(() => resendToErp(d.request.id, { version: d.request.version }), { success: t.request.resent, onSuccess: onClose });
  return (
    <ActionModal title={interpolate(t.request.resendTitle, { r: d.request.id })} okText={t.request.resend} pending={act.pending} error={act.error} rawError={act.rawError} onClose={onClose} onOk={() => void act.run(undefined)}>
      <Typography.Paragraph>{t.request.resendText}</Typography.Paragraph>
    </ActionModal>
  );
}

