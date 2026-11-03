import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert, Button, Card, Col, Collapse, Descriptions, Form, Row, Select, Space, Steps, Table, Tabs, Tag, Timeline, Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, MinusCircleOutlined, UserOutlined } from '@ant-design/icons';
import type { Condition, InvoiceDetail, InvoiceFlow } from '../api/types';
import {
  confirmLineMatch, correctFlow, rejectInvoice, reportWrongEntity, rerunChecks, sendForDecision, takeException, withdrawInvoiceFromBatch, type CancellationResult,
} from '../api/invoices';
import { useInvoice } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { Count, DueSoon, MoreMenu, Notice, InvNo, ReqNo, PageHeader } from '../components/Bits';
import { HandTag, RequestBadge, StateBadge, StatusDot } from '../components/Tags';
import { ActionModal, ReasonModal } from '../components/Dialogs';
import { fmtDate, fmtDateTime, fmtMoney, fmtDecimal } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';
import { TOKENS } from '../theme/theme';
import { CancellationModal, CorrectionModal } from './InvoiceModals';

type Tab = 'overview' | 'lines' | 'checks' | 'documents' | 'anomalies' | 'history';
type Dlg = null | 'correction' | 'datafix' | 'reject' | 'cancel' | 'withdraw' | 'flow' | 'wrongEntity' | 'confirmLine' | 'sendDecision';

/** SCR-12 Invoice Detail and Evidence. */
export function InvoiceDetailPage() {
  const { id = '' } = useParams();
  const q = useInvoice(id);
  return <Async q={q}>{(d) => <Detail key={d.invoice.id} d={d} />}</Async>;
}

const STEPS = ['received', 'checked', 'outcome', 'request', 'sent', 'paid'] as const;

function stepIndex(d: InvoiceDetail): { cur: number; kind: 'normal' | 'exc' | 'bad'; label?: string } {
  const i = d.invoice;
  switch (i.state) {
    case 'RECEIVED': return { cur: 0, kind: 'normal' };
    case 'IN_CHECK': return { cur: 1, kind: 'normal' };
    case 'WAITING_FOR_GOODS': return { cur: 1, kind: 'exc', label: t.invoiceState.WAITING_FOR_GOODS };
    case 'EXCEPTION': return { cur: 2, kind: 'exc' };
    case 'IN_BATCH': return i.requestId ? { cur: 3, kind: 'normal' } : { cur: 2, kind: 'normal' };
    case 'SIGNED': return { cur: 3, kind: 'normal' };
    case 'SENT': return { cur: 4, kind: 'normal' };
    case 'PAID': return { cur: 5, kind: 'normal' };
    case 'REJECTED': return { cur: 1, kind: 'bad', label: t.invoiceState.REJECTED };
    default: return { cur: 1, kind: 'normal', label: t.invoiceState[i.state] };
  }
}

/** The lifecycle of one invoice as dotted antd Steps: an exception is a process step with its state as warning text; error only for a rejection. */
function Lifecycle({ d }: { d: InvoiceDetail }) {
  const s = stepIndex(d);
  const i = d.invoice;
  const warn = (node: ReactNode) => <span style={{ color: TOKENS.warning }}>{node}</span>;
  return (
    <Card size="small" aria-label={t.detail.progress}>
      <Steps
        size="small"
        progressDot
        current={s.cur}
        status={s.kind === 'bad' ? 'error' : 'process'}
        items={STEPS.map((k, n) => {
          const cur = n === s.cur;
          const exc = cur && s.kind === 'exc';
          const title = cur && s.label ? s.label : k === 'outcome' ? (i.state === 'EXCEPTION' ? t.invoiceState.EXCEPTION : t.invoiceState.IN_BATCH) : t.detail.steps[k];
          const desc = cur && k === 'received' ? fmtDateTime(i.receivedAt) : cur && i.state === 'EXCEPTION' && i.exception ? t.exceptionState[i.exception.state] : cur && i.state === 'IN_BATCH' && d.batch ? d.batch.label : undefined;
          return {
            // An exception step carries its state as warning text; without a description the title itself takes the warning color.
            title: exc && !desc ? warn(title) : title,
            description: exc && desc ? warn(desc) : desc,
          };
        })}
      />
    </Card>
  );
}

function Detail({ d }: { d: InvoiceDetail }) {
  const { session } = useAuth();
  const inv = d.invoice;
  const [tab, setTab] = useState<Tab>('overview');
  const [dlg, setDlg] = useState<Dlg>(null);
  const [notice, setNotice] = useState<ReactNode>(null);
  const a = d.actions;
  const close = () => setDlg(null);
  const failed = inv.conditions.filter((c) => c.result === 'FAIL').length;
  const notEval = inv.conditions.filter((c) => c.result === 'NOT_EVALUATED').length;

  const take = useAction(() => takeException(inv.id), { success: t.detail.toastTaken });
  const rerun = useAction(() => rerunChecks(inv.id), { success: t.detail.toastRerun });
  const confirmLine = useAction((lineNo: number) => confirmLineMatch(inv.id, { lineNo, version: inv.version }), { success: t.detail.toastLine, onSuccess: close });
  const flow = useAction((f: InvoiceFlow) => correctFlow(inv.id, { flow: f, version: inv.version }), { success: t.detail.toastFlow, onSuccess: close });
  const wrong = useAction((note: string) => reportWrongEntity(inv.id, { note, version: inv.version }), { success: t.detail.toastWrongEntity, onSuccess: close });
  const decide = useAction(() => sendForDecision(inv.id, { version: inv.version }), { success: t.detail.toastSent, onSuccess: close });
  const reject = useAction((reason: string) => rejectInvoice(inv.id, { reason, version: inv.version }), { success: t.detail.toastRejected, onSuccess: close });
  const withdraw = useAction((reason: string) => withdrawInvoiceFromBatch(inv.id, { reason, version: inv.version }), { success: t.detail.toastWithdrawn, onSuccess: close });

  const doubtLine = inv.lines.find((l) => (l.probability ?? 1) < 0.9 && !l.confirmedBy);
  const exc = inv.exception && inv.exception.state !== 'CLOSED' ? inv.exception : null;
  const waitingDecision = exc?.state === 'WAITING_FOR_DECISION';

  // One primary action per page: the next step for the AP Accountant. The same action is left out of the overflow menu.
  type Key = 'take' | 'rerun' | 'line' | 'foreign' | 'correction';
  let primary: ReactNode = null;
  let primaryKey: Key | null = null;
  let nextTitle = '';
  let nextText = '';
  if (a.takeException) {
    primaryKey = 'take';
    nextTitle = t.detail.nextTake;
    nextText = t.detail.nextTakeText;
    primary = <Button type="primary" block loading={take.pending} onClick={() => void take.run(undefined)}>{t.detail.take}</Button>;
  } else if (inv.aiAvailable === false && a.rerunChecks) {
    primaryKey = 'rerun';
    nextTitle = t.detail.nextRerun;
    nextText = t.detail.nextRerunText;
    primary = <Button type="primary" block loading={rerun.pending} onClick={() => void rerun.run(undefined)}>{t.detail.rerun}</Button>;
  } else if (a.confirmLine && doubtLine) {
    primaryKey = 'line';
    nextTitle = t.detail.nextLine.replace('{n}', String(doubtLine.lineNo));
    nextText = t.detail.nextLineText.replace('{item}', doubtLine.matchedItem ?? '');
    primary = <Button type="primary" block onClick={() => setDlg('confirmLine')}>{t.detail.confirmLine}</Button>;
  } else if (exc && !waitingDecision && inv.flow === 'UNSUPPORTED_FOREIGN') {
    primaryKey = 'foreign';
    nextTitle = t.detail.nextForeign;
    nextText = t.detail.nextForeignText;
    primary = <Button type="primary" danger block onClick={() => setDlg('reject')}>{t.detail.reject}</Button>;
  } else if (a.requestCorrection) {
    primaryKey = 'correction';
    nextTitle = t.detail.nextCorrection;
    nextText = t.detail.nextCorrectionText;
    primary = <Button type="primary" block onClick={() => setDlg('correction')}>{t.detail.requestCorrection}</Button>;
  }

  const menu = ([
    { key: 'correction', show: a.requestCorrection, label: t.detail.requestCorrection, onClick: () => setDlg('correction') },
    { key: 'datafix', show: a.requestCorrection, label: t.detail.dataFix, onClick: () => setDlg('datafix') },
    { key: 'decision', show: a.sendForDecision, label: t.detail.sendForDecision, onClick: () => setDlg('sendDecision') },
    { key: 'line', show: a.confirmLine && !!doubtLine, label: t.detail.confirmLine, onClick: () => setDlg('confirmLine') },
    { key: 'flow', show: a.correctFlow, label: t.detail.correctFlow, onClick: () => setDlg('flow') },
    { key: 'wrong', show: !!exc && a.correctFlow, label: t.detail.reportWrongEntity, onClick: () => setDlg('wrongEntity') },
    { key: 'rerun', show: a.rerunChecks, label: t.detail.rerun, onClick: () => void rerun.run(undefined) },
    { key: 'cancel', show: a.recordCancellation, label: t.detail.recordCancellation, onClick: () => setDlg('cancel'), separatorBefore: true },
    { key: 'foreign', show: a.reject, label: t.detail.reject, onClick: () => setDlg('reject'), danger: true },
  ] as { key: string; show: boolean; label: string; onClick: () => void; separatorBefore?: boolean; danger?: boolean }[]).filter((m) => m.show && m.key !== primaryKey);

  // Counts are plain grey numbers; a failed-check count is red text; the other check summaries are grey text.
  const tabNote = (text: string, tone?: 'err') => (tone === 'err'
    ? <Typography.Text type="danger" className="xs" style={{ marginInlineStart: 4 }}>{text}</Typography.Text>
    : <span className="count">{text}</span>);
  const tabItems: { key: Tab; label: ReactNode; children: ReactNode }[] = [
    { key: 'overview', label: t.detail.tabs.overview, children: <Overview d={d} go={setTab} /> },
    { key: 'lines', label: <>{t.detail.tabs.lines}<Count n={inv.lines.length} /></>, children: <Lines d={d} /> },
    {
      key: 'checks',
      label: <>{t.detail.tabs.checks}{failed ? tabNote(t.detail.failedN.replace('{n}', String(failed)), 'err') : notEval ? tabNote(t.detail.notEvalN.replace('{n}', String(notEval))) : inv.conditions.length ? tabNote(t.detail.passedAll) : null}</>,
      children: <Checks d={d} />,
    },
    { key: 'documents', label: t.detail.tabs.documents, children: <Documents d={d} /> },
    { key: 'anomalies', label: t.detail.tabs.anomalies, children: <Anomalies d={d} /> },
    { key: 'history', label: <>{t.detail.tabs.history}<Count n={d.history.length} /></>, children: <History d={d} /> },
  ];

  const showPanel = !d.readOnly || a.decideTaxRisk || a.decideApproval;
  const actionErr = take.error ?? rerun.error;

  return (
    <>
      <PageHeader
        crumbs={[{ label: t.nav.invoices, to: '/invoices' }, { label: <InvNo value={inv.invoiceNumber} /> }]}
        title={<InvNo value={inv.invoiceNumber} />}
        readOnly={d.readOnly}
        extra={
          <Space size={8} wrap>
            <StateBadge state={inv.state} />
            <Typography.Text type="secondary">
              {[
                exc ? t.exceptionState[exc.state] : null,
                exc?.route ? t.detail.waitingFor.replace('{who}', exc.route === 'CHIEF_ACCOUNTANT' ? t.roles.CHIEF_ACCOUNTANT : t.roles.PAYMENT_APPROVER) : null,
                d.batch && inv.state === 'IN_BATCH' ? d.batch.label : null,
                t.source[inv.source],
              ].filter(Boolean).join(' \u00B7 ')}
            </Typography.Text>
          </Space>
        }
      />

      {notice}
      {actionErr && <Notice kind="err">{actionErr}</Notice>}

      <Card aria-label={t.detail.summary}>
        <Row gutter={[24, 16]}>
          <Col xs={24} lg={17}>
            <Descriptions colon={false}
              size="small"
              layout="vertical"
              column={{ xs: 1, sm: 2, xl: 3 }}
              items={[
                { key: 'sup', label: t.detail.supplier, children: <>{d.supplierName}{inv.sellerTaxCode ? ` ${inv.sellerTaxCode}` : <Typography.Text type="secondary"> {t.detail.noVnTax}</Typography.Text>}</> },
                { key: 'ent', label: t.detail.entity, children: <>{d.entityName} <Typography.Text type="secondary" className="mono">{inv.buyerTaxCode}</Typography.Text></> },
                { key: 'due', label: t.detail.dueDate, children: <span>{fmtDate(inv.dueDate)} {d.dueSoon && <DueSoon />}</span> },
                { key: 'flow', label: t.detail.flow, children: <span>{t.flow[inv.flow]} {inv.flowConfidence !== null && <HandTag hand="AI" />}</span> },
                ...(d.requiredLevel ? [{ key: 'lvl', label: t.detail.approvalLevel, children: t.approvalLevel[d.requiredLevel] }] : []),
                { key: 'auth', label: t.detail.authority, children: <>{inv.authorityStatus ? t.authority[inv.authorityStatus] : t.detail.notChecked}{inv.authorityCheckedAt && <Typography.Text type="secondary"> {t.detail.lookedUp.replace('{time}', fmtDateTime(inv.authorityCheckedAt))}</Typography.Text>}</> },
              ]}
            />
          </Col>
          <Col xs={24} lg={7}>
            <div className="kpi-label">{t.invoices.colTotal}</div>
            <div className="total-value">{fmtMoney(inv.totalAmount)}</div>
          </Col>
        </Row>
        {exc && (
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message={t.detail.reasons}
            description={<ul className="plain-list">{exc.reasons.map((r, n) => <li key={n}>{t.reason(r.code, r.params)}</li>)}</ul>}
          />
        )}
        {inv.rejection && (
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message={t.detail.rejectedBecause}
            description={<>{t.rejection[inv.rejection.code]}{inv.rejection.note && <><br />{inv.rejection.note}</>}</>}
          />
        )}
      </Card>

      <Lifecycle d={d} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={{ span: 17, order: 1 }} xl={18}>
          <Card styles={{ body: { paddingTop: 0 } }}>
            <Tabs aria-label={t.detail.sections} activeKey={tab} onChange={(k) => setTab(k as Tab)} items={tabItems} />
          </Card>
        </Col>
        <Col xs={24} lg={{ span: 7, order: 2 }} xl={6}>
          <aside aria-label={t.detail.actionPanel} className="side-sticky">
            {showPanel ? (
              <Card title={t.detail.resolve}>
                <div className="stack">
                  <div><HandTag hand="PERSON" /></div>
                  {primary ? (
                    <div className="stack" style={{ gap: 8 }}>
                      <Typography.Text strong className="next-title">{nextTitle}</Typography.Text>
                      <Typography.Text type="secondary">{nextText}</Typography.Text>
                      {primary}
                    </div>
                  ) : (
                    <Typography.Text type="secondary">{panelMessage(d, session?.role)}</Typography.Text>
                  )}
                  {a.withdraw && <Button block onClick={() => setDlg('withdraw')}>{t.detail.withdraw}</Button>}
                  {menu.length > 0 && <MoreMenu label={t.detail.otherActions} items={menu} />}
                  {(a.decideTaxRisk || a.decideApproval) && <Link to="/decisions"><Button type="primary" block>{t.detail.openDecisions}</Button></Link>}
                </div>
              </Card>
            ) : (
              <Card title={t.detail.noAction}>
                <Typography.Text type="secondary">{panelMessage(d, session?.role)}</Typography.Text>
              </Card>
            )}
          </aside>
        </Col>
      </Row>

      {(dlg === 'correction' || dlg === 'datafix') && (
        <CorrectionModal detail={d} initialKind={dlg === 'datafix' ? 'DATA_FIX_NOTICE' : 'CORRECTION_REQUEST'} onClose={close} />
      )}
      {dlg === 'cancel' && <CancellationModal detail={d} onClose={close} onDone={(r) => { close(); setNotice(<CancelNotice r={r} />); }} />}
      {dlg === 'reject' && (
        <ReasonModal
          title={t.reject.title}
          intro={<Typography.Paragraph>{t.reject.intro.replace('{n}', inv.invoiceNumber)}{inv.flow === 'UNSUPPORTED_FOREIGN' ? ` ${t.reject.foreign}` : ''}</Typography.Paragraph>}
          label={t.reject.reason}
          placeholder={t.reject.placeholder}
          confirmLabel={t.reject.confirm}
          danger
          pending={reject.pending}
          error={reject.error}
          rawError={reject.rawError}
          onSubmit={(r) => void reject.run(r)}
          onClose={close}
        />
      )}
      {dlg === 'withdraw' && (
        <ReasonModal
          title={t.detail.withdrawTitle}
          intro={<Typography.Paragraph>{t.detail.withdrawIntro}</Typography.Paragraph>}
          label={t.detail.withdrawReason}
          confirmLabel={t.detail.withdraw}
          pending={withdraw.pending}
          error={withdraw.error}
          rawError={withdraw.rawError}
          onSubmit={(r) => void withdraw.run(r)}
          onClose={close}
        />
      )}
      {dlg === 'wrongEntity' && (
        <ReasonModal
          title={t.detail.reportWrongEntity}
          intro={<WrongEntityTrace d={d} />}
          label={t.detail.wrongEntityNote}
          confirmLabel={t.detail.reportWrongEntity}
          pending={wrong.pending}
          error={wrong.error}
          rawError={wrong.rawError}
          onSubmit={(r) => void wrong.run(r)}
          onClose={close}
        />
      )}
      {dlg === 'confirmLine' && doubtLine && (
        <ActionModal title={t.detail.confirmLineTitle.replace('{n}', String(doubtLine.lineNo))} okText={t.detail.confirmLineSave} pending={confirmLine.pending} error={confirmLine.error} rawError={confirmLine.rawError} onClose={close} onOk={() => void confirmLine.run(doubtLine.lineNo)}>
          <Typography.Paragraph>{t.detail.confirmLineText.replace('{text}', doubtLine.text).replace('{item}', doubtLine.matchedItem ?? '')}</Typography.Paragraph>
          <Typography.Text type="secondary">{t.detail.confirmLineHint}</Typography.Text>
        </ActionModal>
      )}
      {dlg === 'sendDecision' && (
        <ActionModal title={t.detail.sendTitle} okText={t.detail.sendForDecision} pending={decide.pending} error={decide.error} rawError={decide.rawError} onClose={close} onOk={() => void decide.run(undefined)}>
          <Typography.Paragraph>{exc?.reasons.some((r) => r.code === 'TAX_RISK_HOLD') ? t.detail.sendToChief : t.detail.sendToApprover}</Typography.Paragraph>
          {inv.exception?.linkedGroup && <Typography.Text type="secondary">{t.detail.sendGroup.replace('{n}', String(d.linkedGroup.length))}</Typography.Text>}
        </ActionModal>
      )}
      {dlg === 'flow' && <FlowModal current={inv.flow} pending={flow.pending} error={flow.error} rawError={flow.rawError} onSave={(f) => void flow.run(f)} onClose={close} />}
    </>
  );
}

function panelMessage(d: InvoiceDetail, role?: string): string {
  const inv = d.invoice;
  if (d.readOnly) return t.detail.readOnlyPanel;
  if (inv.state === 'IN_BATCH') return t.detail.admittedPanel;
  if (inv.exception?.state === 'WAITING_FOR_DECISION') return t.detail.waitingPanel;
  void role;
  return t.detail.nothingToDo;
}

function CancelNotice({ r }: { r: CancellationResult }) {
  const key = r.outcome === 'WITHDRAWN' ? 'withdrawn' : r.outcome === 'REQUEST_CANCELLED' ? 'requestCancelled' : 'rejected';
  return (
    <Notice kind="ok" title={t.cancel.done}>
      {t.cancel[key].replace('{n}', r.invoice.invoiceNumber).replace('{r}', r.requestId ?? '').replace('{total}', r.newTotal !== null ? fmtMoney(r.newTotal) : '').replace('{level}', r.newLevel ? t.approvalLevel[r.newLevel as 'CFO'] : '')}
    </Notice>
  );
}

function WrongEntityTrace({ d }: { d: InvoiceDetail }) {
  const i = d.invoice;
  const rows: { k: string; v: string; same: boolean }[] = [
    { k: t.detail.buyerTaxCode, v: i.buyerTaxCode, same: true },
    { k: t.detail.buyerName, v: i.buyerName, same: i.buyerName === d.entityName },
    { k: t.detail.orderRef, v: i.poRef ?? '-', same: true },
  ];
  return (
    <div className="stack" style={{ gap: 8 }}>
      <Typography.Text>{t.detail.wrongEntityIntro}</Typography.Text>
      <Table
        size="small"
        pagination={false}
        showHeader={false}
        rowKey="k"
        dataSource={rows}
        columns={[
          { dataIndex: 'k' },
          { dataIndex: 'v' },
          { key: 's', render: (_, r) => (r.same ? <StatusDot tone="success">{t.detail.same}</StatusDot> : <StatusDot tone="warning">{t.detail.differs}</StatusDot>) },
        ]}
      />
      <Typography.Text type="secondary">{t.detail.wrongEntityHint.replace('{entity}', d.entityName)}</Typography.Text>
    </div>
  );
}

function FlowModal({ current, pending, error, rawError, onSave, onClose }: { current: InvoiceFlow; pending: boolean; error: string | null; rawError: unknown; onSave: (f: InvoiceFlow) => void; onClose: () => void }) {
  const [f, setF] = useState<InvoiceFlow>(current);
  const options: InvoiceFlow[] = ['GOODS_WITH_ORDER', 'SERVICES_WITH_ORDER', 'RECURRING', 'EMPLOYEE_EXPENSE', 'OTHER'];
  return (
    <ActionModal title={t.detail.correctFlow} okText={t.detail.saveFlow} pending={pending} error={error} rawError={rawError} onClose={onClose} onOk={() => onSave(f)}>
      <Typography.Paragraph>{t.detail.flowHint}</Typography.Paragraph>
      <Form layout="vertical">
        <Form.Item label={t.detail.flow}>
          <Select aria-label={t.detail.flow} value={f} onChange={setF} options={options.map((o) => ({ value: o, label: t.flow[o] }))} />
        </Form.Item>
      </Form>
    </ActionModal>
  );
}

// ---------- Tabs ----------
function condTitle(c: Condition): string {
  return t.conditionTitle[c.no];
}

function Overview({ d, go }: { d: InvoiceDetail; go: (t: Tab) => void }) {
  const inv = d.invoice;
  const failing = inv.conditions.filter((c) => c.result === 'FAIL');
  const total = inv.conditions.length;
  const allPass = total > 0 && failing.length === 0 && inv.conditions.every((c) => c.result === 'PASS');
  const notEval = inv.conditions.filter((c) => c.result === 'NOT_EVALUATED');
  const title = allPass ? t.detail.allSixHold : failing.length ? t.detail.failedOfSix.replace('{n}', String(failing.length)) : notEval.length ? t.detail.notEvaluated.replace('{n}', String(notEval.length)) : '';
  return (
    <div className="stack">
      {total > 0 && (
        <Alert
          type={allPass ? 'success' : 'warning'}
          showIcon
          aria-label={t.detail.ruleResult}
          message={<Space wrap>{title}<HandTag hand="RULE" /></Space>}
          description={
            <div className="stack" style={{ gap: 8 }}>
              {failing.map((c) => (
                <div key={c.no} className="attn-row">
                  <div><b>{c.no}. {condTitle(c)}</b><br />{t.condition(c.detail)}</div>
                  <Button size="small" onClick={() => go('checks')}>{t.detail.viewInChecks}</Button>
                </div>
              ))}
              {allPass && inv.note && <span>{t.note(inv.note)}</span>}
              {!allPass && failing.length > 0 && <Typography.Text type="secondary">{t.detail.passedList.replace('{list}', inv.conditions.filter((c) => c.result === 'PASS').map((c) => c.no).join(', ')).replace('{x}', '')}</Typography.Text>}
              {notEval.length > 0 && failing.length === 0 && <span>{t.condition(notEval[0]!.detail)}</span>}
            </div>
          }
        />
      )}

      <Card size="small" title={t.detail.keyFacts} extra={<Button type="link" size="small" onClick={() => go('documents')}>{t.detail.openDocuments}</Button>}>
        <Descriptions colon={false}
          size="small"
          layout="vertical"
          column={{ xs: 1, md: 2, xl: 3 }}
          items={[
            { key: 'd', label: t.detail.invoiceDate, children: fmtDate(inv.invoiceDate) },
            { key: 'o', label: t.detail.order, children: inv.poRef ? <span className="mono">{inv.poRef}</span> : t.detail.none },
            { key: 'r', label: t.detail.receipt, children: inv.receiptRef ? <span className="mono">{inv.receiptRef}</span> : inv.flow === 'SERVICES_WITH_ORDER' ? t.detail.noneService : t.detail.none },
            { key: 't', label: t.detail.trust, children: t.trust[inv.trust] },
            { key: 's', label: t.detail.signatureCheck, children: <Space size={6}><HandTag hand="RULE" />{inv.authorityStatus ? t.detail.sigValid : t.detail.sigPending}</Space> },
            { key: 'l', label: t.detail.lastSync, children: d.erpItems[0] ? fmtDateTime(d.erpItems[0].syncedAt) : t.detail.none },
          ]}
        />
      </Card>

      {inv.flowConfidence !== null && inv.flowReason && (
        <Card size="small" title={<Space><HandTag hand="AI" />{t.detail.flowIdent}</Space>}>
          <Typography.Paragraph style={{ marginBottom: 4 }}>{t.flow[inv.flow]}, {t.detail.confidence} <span className="mono">{fmtDecimal(inv.flowConfidence)}</span>. {t.flowReason(inv.flowReason)}</Typography.Paragraph>
          <Typography.Text type="secondary" className="xs">{t.detail.versions}: model 2026.10 - prompt v14</Typography.Text>
        </Card>
      )}

      {inv.serviceAcceptance && (
        <Card size="small" title={t.detail.acceptance}>
          <Descriptions colon={false}
            size="small"
            column={{ xs: 1, md: 3 }}
            items={[
              { key: 's', label: t.detail.source, children: t.roles.REQUESTING_DEPARTMENT },
              { key: 'c', label: t.detail.confirmedBy, children: `${inv.serviceAcceptance.by}, ${fmtDateTime(inv.serviceAcceptance.at)}` },
              { key: 'n', label: t.detail.note, children: inv.serviceAcceptance.note || t.detail.none },
            ]}
          />
        </Card>
      )}

      {d.tax && (
        <Card size="small" title={<Space><HandTag hand="RULE" />{t.detail.taxRisk}</Space>}>
          {t.detail.taxRiskText.replace('{supplier}', d.supplierName).replace('{date}', fmtDate(d.tax.listedAt))}
        </Card>
      )}

      {d.linkedGroup.length > 1 && (
        <Card size="small" title={<Space>{t.detail.linked}<HandTag hand="AI" /></Space>}>
          <Table
            size="small"
            pagination={false}
            rowKey="id"
            dataSource={d.linkedGroup}
            columns={[
              { title: t.invoices.colInvoice, key: 'n', render: (_, l) => (l.id === inv.id ? <><InvNo value={l.invoiceNumber} /> <Typography.Text type="secondary">{t.detail.thisPage}</Typography.Text></> : <Link to={`/invoices/${l.id}`}><InvNo value={l.invoiceNumber} /></Link>) },
              { title: t.detail.order, dataIndex: 'poRef', className: 'mono' },
              { title: t.invoices.colTotal, key: 't', align: 'right', render: (_, l) => fmtMoney(l.totalAmount) },
            ]}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}>{t.detail.combined}</Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right"><b>{fmtMoney(d.linkedGroup.reduce((s, l) => s + l.totalAmount, 0))}</b></Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>
      )}

      {d.request ? (
        <Card size="small" title={t.detail.paymentRequest} extra={<RequestBadge state={d.request.state} />}>
          <div className="stack" style={{ gap: 8 }}>
            <span><ReqNo value={d.request.id} />, {fmtMoney(d.request.total)}, {t.approvalLevel[d.request.level]}</span>
            {d.request.signatures.length === 0 && <Typography.Text type="secondary">{t.detail.noSignatures}</Typography.Text>}
            {d.request.signatures.map((s) => (
              <div className="sig" key={s.userId + s.step}>
                <span className="sig-mark">{s.name.slice(0, 1)}</span>
                <div><b>{s.onBehalfOfName ? t.detail.signedOnBehalf.replace('{who}', s.name).replace('{for}', s.onBehalfOfName) : t.detail.signedBy.replace('{who}', s.name)}</b><br /><Typography.Text type="secondary" className="xs">{fmtDateTime(s.at)} - <span className="mono">{s.contentHash}</span></Typography.Text></div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Typography.Text type="secondary">{t.detail.noRequest}</Typography.Text>
      )}
      {inv.paymentRef && <Typography.Text>{t.detail.paymentRef}: <span className="mono">{inv.paymentRef}</span></Typography.Text>}
      {d.cancellation && (
        <Card size="small" title={t.detail.cancellationNotice}>
          <Descriptions colon={false}
            size="small"
            column={{ xs: 1, md: 3 }}
            items={[
              { key: 'r', label: t.cancel.reference, children: d.cancellation.reference },
              { key: 'd', label: t.cancel.date, children: fmtDate(d.cancellation.noticeDate) },
              { key: 'f', label: t.cancel.file, children: d.cancellation.fileName ?? t.detail.none },
            ]}
          />
        </Card>
      )}
    </div>
  );
}

function Lines({ d }: { d: InvoiceDetail }) {
  const inv = d.invoice;
  if (!inv.lines.length) return <Typography.Text type="secondary">{inv.aiAvailable ? t.detail.noLines : t.detail.aiMissing}</Typography.Text>;
  const cols: TableColumnsType<(typeof inv.lines)[number]> = [
    { title: '#', dataIndex: 'lineNo', width: 48 },
    { title: t.detail.lineText, dataIndex: 'text', ellipsis: true, width: 200 },
    {
      title: t.detail.lineMatched, key: 'm', width: 200,
      render: (_, l) => <>{l.matchedItem ?? t.detail.none}{l.confirmedBy && <><br /><Typography.Text type="secondary" className="xs">{t.detail.confirmedByName.replace('{who}', l.confirmedBy)}</Typography.Text></>}</>,
    },
    { title: t.detail.lineMethod, key: 'me', width: 170, render: (_, l) => (l.method ? t.method[l.method] : '') },
    {
      title: t.detail.lineProb, key: 'p', width: 200,
      render: (_, l) => (
        <>
          {l.probability !== null && <StatusDot tone={l.probability < 0.9 ? 'warning' : 'success'}>{fmtDecimal(l.probability)} {l.probability < 0.9 ? t.detail.doubtful : t.detail.matched}</StatusDot>}
          {l.doubtNote && <><br /><Typography.Text type="secondary" className="xs">{t.doubt[l.doubtNote as 'UNIT_UNKNOWN'] ?? l.doubtNote}</Typography.Text></>}
        </>
      ),
    },
    { title: t.detail.lineTotal, key: 'a', align: 'right', width: 140, render: (_, l) => fmtMoney(l.amount) },
  ];
  return (
    <div className="stack" style={{ gap: 8 }}>
      <Space><HandTag hand="AI" /><Typography.Text strong>{t.detail.lineMatches}</Typography.Text></Space>
      <Table
        size="small"
        rowKey="lineNo"
        columns={cols}
        dataSource={inv.lines}
        pagination={false}
        scroll={{ x: 900 }}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={5}>{t.detail.vat}: {fmtMoney(inv.vatAmount)}</Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right"><b>{t.detail.totalWithVat} {fmtMoney(inv.totalAmount)}</b></Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </div>
  );
}

/** The six conditions of BR-05 as vertical Steps: Pass is a green check, Fail a red cross, with the value. */
function ConditionSteps({ list }: { list: Condition[] }) {
  return (
    <Steps
      direction="vertical"
      size="small"
      items={list.map((c) => ({
        status: c.result === 'PASS' ? 'finish' : c.result === 'FAIL' ? 'error' : 'wait',
        icon: c.result === 'PASS' ? <CheckCircleFilled style={{ color: TOKENS.success }} /> : c.result === 'FAIL' ? <CloseCircleFilled style={{ color: TOKENS.error }} /> : <MinusCircleOutlined />,
        title: <Space wrap size={8}>{c.no}. {condTitle(c)}<StatusDot tone={c.result === 'PASS' ? 'success' : c.result === 'FAIL' ? 'error' : 'neutral'}>{t.conditionResult[c.result]}</StatusDot></Space>,
        description: t.condition(c.detail),
      }))}
    />
  );
}

function Checks({ d }: { d: InvoiceDetail }) {
  const cs = d.invoice.conditions;
  if (!cs.length) return <Typography.Text type="secondary">{t.detail.noChecks}</Typography.Text>;
  const shown = cs.filter((c) => c.result !== 'PASS');
  const passed = cs.filter((c) => c.result === 'PASS');
  return (
    <div className="stack" style={{ gap: 12 }}>
      <Space><HandTag hand="RULE" /><Typography.Text strong>{t.detail.sixConditions}</Typography.Text></Space>
      {shown.length > 0 && <ConditionSteps list={shown} />}
      {passed.length > 0 && (
        <Collapse
          size="small"
          defaultActiveKey={shown.length === 0 ? ['p'] : []}
          items={[{ key: 'p', label: t.detail.passedSummary.replace('{n}', String(passed.length)).replace('{list}', passed.map((c) => c.no).join(', ')), children: <ConditionSteps list={passed} /> }]}
        />
      )}
    </div>
  );
}

function Documents({ d }: { d: InvoiceDetail }) {
  const i = d.invoice;
  return (
    <div className="stack">
      <Card size="small" title={t.detail.sourceDocument} extra={<Tag className="hand hand-data">{t.detail.documentData}</Tag>}>
        <Descriptions colon={false}
          size="small"
          column={{ xs: 1, md: 2 }}
          items={[
            { key: 'se', label: t.detail.seller, children: `${i.sellerName}${i.sellerTaxCode ? `, ${t.detail.taxCode} ${i.sellerTaxCode}` : ''}` },
            { key: 'sn', label: t.detail.seriesNumber, children: <span className="mono">{i.series} / {i.number}</span> },
            { key: 'bt', label: t.detail.buyerTaxCode, children: i.buyerTaxCode },
            { key: 'bn', label: t.detail.buyerName, children: i.buyerName },
            { key: 'or', label: t.detail.orderRef, children: i.poRef ? <span className="mono">{i.poRef}</span> : t.detail.none },
            { key: 'h', label: t.detail.storedHash, children: <span className="mono hash">{i.hash}</span> },
          ]}
        />
        <Typography.Text type="secondary" className="xs">{t.detail.injectionNote}</Typography.Text>
      </Card>
      <Card size="small" title={t.detail.erpData} extra={<Tag className="hand hand-data">{t.detail.erpDataTag}</Tag>}>
        {d.erpItems.length === 0 ? <Typography.Text type="secondary">{t.detail.noErp}</Typography.Text> : (
          <Table
            size="small"
            pagination={false}
            rowKey={(e) => `${e.doc}-${e.item}`}
            dataSource={d.erpItems}
            scroll={{ x: 600 }}
            columns={[
              { title: t.detail.erpDoc, dataIndex: 'doc', className: 'mono' },
              { title: t.detail.erpItem, dataIndex: 'item' },
              { title: t.detail.erpQty, dataIndex: 'quantity' },
              { title: t.detail.erpPrice, key: 'p', render: (_, e) => (e.price ? fmtMoney(Number(e.price)) : '') },
              { title: t.detail.lastSync, key: 's', render: (_, e) => fmtDateTime(e.syncedAt) },
            ]}
          />
        )}
      </Card>
    </div>
  );
}

function Anomalies({ d }: { d: InvoiceDetail }) {
  const list = d.invoice.anomalies;
  return (
    <div className="stack" style={{ gap: 12 }}>
      <Space><HandTag hand="AI" /><Typography.Text strong>{t.detail.anomalyNumbers}</Typography.Text></Space>
      {list.length === 0 ? <Typography.Text type="secondary">{t.detail.noAnomalies}</Typography.Text> : (
        <Descriptions colon={false}
          size="small"
          bordered
          column={1}
          items={list.map((a, n) => ({ key: n, label: t.anomalyTitle(a.code), children: <Space wrap>{t.anomaly(a)}{a.flagged && <StatusDot tone="warning">{t.detail.flagged}</StatusDot>}</Space> }))}
        />
      )}
    </div>
  );
}

function History({ d }: { d: InvoiceDetail }) {
  return (
    <div className="stack" style={{ gap: 12 }}>
      <Typography.Text type="secondary">{t.detail.historyHint}</Typography.Text>
      {d.history.length === 0 ? <Typography.Text type="secondary">{t.detail.noHistory}</Typography.Text> : (
        <Timeline
          items={d.history.map((h) => ({
            key: h.id,
            color: h.hand === 'PERSON' ? TOKENS.ink : h.hand === 'AI' ? TOKENS.primary : TOKENS.neutralDot,
            dot: h.hand === 'PERSON' ? <UserOutlined /> : undefined,
            children: (
              <div>
                <time dateTime={h.at}><Typography.Text type="secondary" className="xs">{fmtDateTime(h.at)}</Typography.Text></time>
                <div>
                  <Space size={6} wrap>
                    {h.hand === 'AI' || h.hand === 'RULE' || h.hand === 'PERSON' ? <HandTag hand={h.hand} /> : <HandTag hand={h.hand} />}
                    {h.hand === 'PERSON' && h.actorName ? <b>{h.actorName}</b> : null}
                    <span>{t.event(h.event.code, h.event.params)}</span>
                    {h.note ? <q style={{ color: TOKENS.text2 }}>{h.note}</q> : null}
                  </Space>
                </div>
              </div>
            ),
          }))}
        />
      )}
    </div>
  );
}
