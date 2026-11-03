import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Descriptions, Form, Input, List, Modal, Select, Skeleton, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import type { DecisionRow } from '../api/decisions';
import { decideIndividualApproval, decideTaxRiskHold } from '../api/decisions';
import { useDecisionQueue, useInvoice } from '../api/hooks';
import { useAuth } from '../auth/AuthContext';
import { Async } from '../components/Async';
import { EmptyState, Notice, PageHeader, InvNo } from '../components/Bits';
import { ActionError } from '../components/Dialogs';
import { Kpi, KpiRow } from '../components/Kpi';
import { HandTag } from '../components/Tags';
import { fmtDate, fmtDateTime, fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';
import { TOKENS } from '../theme/theme';
import { Card } from 'antd';

type Kind = DecisionRow['kind'];

/** SCR-40 Decision Queue (Chief Accountant: tax-risk holds; Payment Approver: individual approvals). SCR-16 and SCR-18 are the modals. */
export function Decisions() {
  const { session } = useAuth();
  const isChief = session?.role === 'CHIEF_ACCOUNTANT';
  const q = useDecisionQueue();
  const [kind, setKind] = useState<'' | Kind>('');
  const [open, setOpen] = useState<DecisionRow | null>(null);
  const rows = (q.data ?? []).filter((r) => !kind || r.kind === kind);

  const age = (n: number) => (n <= 0 ? t.decisions.ageToday : interpolate(t.decisions.ageDays, { n }));
  const cols: TableColumnsType<DecisionRow> = [
    {
      title: t.decisions.colInvoice, key: 'inv', width: 230,
      render: (_, r) => <><InvNo value={r.invoice.invoiceNumber} /><br /><Typography.Text type="secondary" className="xs">{r.invoice.sellerName}</Typography.Text>{r.groupSize > 1 && <><br /><Typography.Text type="secondary" className="xs">{interpolate(t.decisions.groupOf, { n: r.groupSize })}</Typography.Text></>}</>,
    },
    {
      title: t.decisions.colReasons, key: 'why', width: 260,
      render: (_, r) => <Space direction="vertical" size={2}>{r.invoice.exception?.reasons.map((x, i) => <span key={i}>{t.reason(x.code, x.params)}</span>)}</Space>,
    },
    ...(isChief ? [] : [{ title: t.decisions.colLevel, key: 'lvl', width: 150, render: (_: unknown, r: DecisionRow) => (r.level ? <Tag>{t.approvalLevel[r.level]}</Tag> : '') } as TableColumnsType<DecisionRow>[number]]),
    { title: t.decisions.colAmount, key: 'amt', align: 'right', width: 150, sorter: (a, b) => a.amount - b.amount, render: (_, r) => <span className="nowrap">{fmtMoney(r.amount)}</span> },
    {
      title: t.decisions.colAge, key: 'age', width: 170, sorter: (a, b) => a.ageDays - b.ageDays, defaultSortOrder: 'descend',
      render: (_, r) => <>{age(r.ageDays)}<br /><Typography.Text type="secondary" className="xs">{interpolate(t.decisions.sent, { t: fmtDateTime(r.sentAt) })}</Typography.Text></>,
    },
    { title: <span className="sr">{t.decisions.colAction}</span>, key: 'act', fixed: 'right', width: 110, render: (_, r) => <Button size="small" onClick={(e) => { e.stopPropagation(); setOpen(r); }}>{t.decisions.review}</Button> },
  ];

  const all = q.data ?? [];
  const oldest = [...all].sort((a, b) => b.ageDays - a.ageDays)[0];
  return (
    <>
      <PageHeader
        title={isChief ? t.decisions.titleChief : t.decisions.titleApprover}
        meta={isChief ? t.decisions.introChief : interpolate(t.decisions.introApprover, { level: session?.approvalLevel ? t.approvalLevel[session.approvalLevel] : '' })}
      />
      {all.length > 0 && (
        <KpiRow span={8}>
          {[
            <Kpi key="w" title={t.decisions.kWaiting} value={all.length} color={all.length > 0 ? TOKENS.warning : undefined} sub={[...new Set(all.map((r) => t.decisions.kinds[r.kind]))].join(', ')} />,
            <Kpi key="a" title={t.decisions.kAmount} value={fmtMoney(all.reduce((s, r) => s + r.amount, 0))} />,
            oldest ? <Kpi key="o" title={t.decisions.kOldest} value={age(oldest.ageDays)} sub={interpolate(t.decisions.sent, { t: fmtDateTime(oldest.sentAt) })} /> : null,
          ]}
        </KpiRow>
      )}
      <Card styles={{ body: { padding: 0 } }}>
        {all.length > 0 && (
          <div className="toolbar">
            <Select
              aria-label={t.decisions.kindFilter}
              style={{ minWidth: 260 }}
              value={kind}
              onChange={setKind}
              options={[{ value: '', label: `${t.decisions.kindFilter}: ${t.decisions.allKinds}` }, ...(['TAX_RISK_HOLD', 'INDIVIDUAL_APPROVAL'] as Kind[]).filter((k) => all.some((r) => r.kind === k)).map((k) => ({ value: k, label: t.decisions.kinds[k] }))]}
            />
            <Typography.Text type="secondary" className="xs">{t.decisions.onlyYours}</Typography.Text>
          </div>
        )}
        <Async q={q} isEmpty={(d) => d.length === 0} empty={<EmptyState title={t.decisions.emptyTitle} text={t.decisions.emptyText} />}>
          {() => (rows.length === 0 ? <EmptyState title={t.decisions.noMatch} action={<Button onClick={() => setKind('')}>{t.common.clearFilters}</Button>} /> : (
            <Table<DecisionRow>
              size="middle"
              rowKey={(r) => r.invoice.id}
              columns={cols}
              dataSource={rows}
              pagination={false}
              scroll={{ x: 760 }}
              sticky={{ offsetHeader: 56 }}
              onRow={(r) => ({ onClick: () => setOpen(r), style: { cursor: 'pointer' } })}
            />
          ))}
        </Async>
      </Card>
      {open && <DecideModal row={open} chief={isChief} onClose={() => setOpen(null)} />}
    </>
  );
}

function DecideModal({ row, chief, onClose }: { row: DecisionRow; chief: boolean; onClose: () => void }) {
  const detail = useInvoice(row.invoice.id);
  const inv = detail.data?.invoice ?? row.invoice;
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [which, setWhich] = useState<string>('');
  const needReason = chief || which === 'DECLINE';
  const reasonBad = touched && !reason.trim() && needReason;
  const run = useAction(
    async (decision: string): Promise<void> => {
      if (chief) await decideTaxRiskHold(inv.id, { decision: decision as 'RELEASE' | 'REJECT', reason: reason.trim(), version: inv.version });
      else await decideIndividualApproval(inv.id, { decision: decision as 'APPROVE' | 'DECLINE', reason: reason.trim(), version: inv.version });
    },
    { success: () => (which === 'RELEASE' ? t.decisions.released : which === 'REJECT' ? t.decisions.rejected : which === 'APPROVE' ? t.decisions.approved : t.decisions.declined), onSuccess: onClose },
  );
  // Both decisions of the Chief Accountant need a reason; the approver needs one only to decline.
  const submit = (d: string) => {
    setWhich(d);
    setTouched(true);
    if (!reason.trim() && (chief || d === 'DECLINE')) return;
    void run.run(d);
  };
  const group = detail.data?.linkedGroup ?? [];
  const failed = inv.conditions.filter((c) => c.result === 'FAIL');
  return (
    <Modal
      open
      title={chief ? t.decisions.taxTitle : t.decisions.approveTitle}
      width={680}
      onCancel={onClose}
      maskClosable={!run.pending}
      keyboard={!run.pending}
      destroyOnHidden
      footer={
        <div className="dec-footer">
          <Link to={`/invoices/${inv.id}`} onClick={onClose}><Button type="link">{t.decisions.openInvoice}</Button></Link>
          <Space wrap>
            <Button onClick={onClose} disabled={run.pending}>{t.common.cancel}</Button>
            <Button danger onClick={() => submit(chief ? 'REJECT' : 'DECLINE')} disabled={run.pending}>{chief ? t.decisions.reject : t.decisions.decline}</Button>
            <Button type="primary" loading={run.pending} onClick={() => submit(chief ? 'RELEASE' : 'APPROVE')}>{chief ? t.decisions.release : t.decisions.approve}</Button>
          </Space>
        </div>
      }
    >
      <div className="modal-body">
        {detail.isPending ? <Skeleton active paragraph={{ rows: 3 }} /> : (
          <>
            <section aria-label={t.decisions.evidence}>
              <Descriptions colon={false} size="small" column={1} items={[
                { key: 'i', label: t.decisions.colInvoice, children: <InvNo value={inv.invoiceNumber} /> },
                { key: 's', label: t.decisions.supplier, children: inv.sellerName },
                { key: 'a', label: t.decisions.amount, children: fmtMoney(inv.totalAmount) },
                { key: 'd', label: t.decisions.due, children: fmtDate(inv.dueDate) },
                ...(detail.data?.requiredLevel ? [{ key: 'l', label: t.decisions.colLevel, children: t.approvalLevel[detail.data.requiredLevel] }] : []),
                { key: 'r', label: t.decisions.reasons, children: inv.exception?.reasons.map((x) => t.reason(x.code, x.params)).join('; ') },
              ]} />
            </section>
            {chief && detail.data?.tax && (
              <Alert type="info" showIcon icon={<SafetyCertificateOutlined />} message={<Space>{t.decisions.taxTitle}<HandTag hand="RULE" /></Space>} description={interpolate(t.decisions.taxText, { supplier: inv.sellerName, date: fmtDate(detail.data.tax.listedAt) })} />
            )}
            {failed.length > 0 && (
              <List
                size="small"
                bordered
                aria-label={t.decisions.checks}
                dataSource={failed}
                renderItem={(c) => <List.Item><span><b>{t.conditionTitle[c.no]}</b>: {t.condition(c.detail)}</span></List.Item>}
              />
            )}
            {group.length > 1 && (
              <Notice kind="warn" title={t.decisions.combinedNote}>
                {group.map((g) => `${g.invoiceNumber} (${fmtMoney(g.totalAmount)})`).join(', ')}. {interpolate(t.decisions.combined, { total: fmtMoney(group.reduce((s, g) => s + g.totalAmount, 0)) })}
              </Notice>
            )}
          </>
        )}
        <Form layout="vertical">
          <Form.Item
            label={t.decisions.reason}
            required={chief}
            extra={chief ? t.decisions.reasonHint : undefined}
            validateStatus={reasonBad ? 'error' : undefined}
            help={reasonBad ? t.decisions.reasonRequired : undefined}
          >
            <Input.TextArea rows={3} maxLength={500} showCount autoFocus value={reason} onChange={(e) => setReason(e.target.value)} aria-label={t.decisions.reason} />
          </Form.Item>
        </Form>
        {(run.rawError as { code?: string } | null)?.code === 'PROCESSED_BY_YOU' ? <Notice kind="warn">{t.decisions.processedByYou}</Notice> : <ActionError error={run.error} raw={run.rawError} />}
      </div>
    </Modal>
  );
}
