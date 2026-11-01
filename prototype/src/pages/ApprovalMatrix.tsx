import { useEffect, useState } from 'react';
import { Button, Card, Checkbox, Col, Form, Row, Space, Typography } from 'antd';
import { replaceApprovalMatrix } from '../api/admin';
import { useMatrix } from '../api/hooks';
import type { ApprovalMatrix as Matrix, ApprovalTier, User } from '../api/types';
import { Async } from '../components/Async';
import { Notice, PageHeader } from '../components/Bits';
import { ActionError } from '../components/Dialogs';
import { MoneyInput } from '../components/Inputs';
import { fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { t } from '../i18n/vi';

/** SCR-74 Approval Matrix: two levels by total amount (BR-03), the boundary and the approvers of each level are editable. */
export function ApprovalMatrix() {
  const q = useMatrix();
  return <Async q={q} skeletonRows={7}>{(d) => <MatrixForm matrix={d.matrix} approvers={d.approvers} />}</Async>;
}

function MatrixForm({ matrix, approvers }: { matrix: Matrix; approvers: User[] }) {
  const low = matrix.tiers[0]!;
  const high = matrix.tiers[1] ?? { level: 'CFO' as const, from: low.upTo ?? 0, upTo: null, approverIds: [] };
  const init = { boundary: (low.upTo ?? high.from) as number | null, low: low.approverIds, high: high.approverIds };
  const [v, setV] = useState(init);
  const [touched, setTouched] = useState(false);
  useEffect(() => { setV(init); setTouched(false); }, [matrix.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const boundary = v.boundary ?? 0;
  const dirty = v.boundary !== init.boundary || v.low.join() !== init.low.join() || v.high.join() !== init.high.join();
  const badBoundary = !(boundary > 0);
  const tiers: ApprovalTier[] = [
    { level: low.level, from: 0, upTo: boundary, approverIds: v.low },
    { level: high.level, from: boundary, upTo: null, approverIds: v.high },
  ];
  const save = useAction(() => replaceApprovalMatrix({ tiers, version: matrix.version }), { success: t.matrix.saved });
  const active = approvers.filter((a) => a.status === 'ACTIVE');
  const names = (ids: string[]) => ids.map((id) => approvers.find((a) => a.id === id)?.fullName).filter(Boolean).join(', ') || t.matrix.none;
  const tierCard = (key: 'low' | 'high', n: number, tier: ApprovalTier) => (
    <Card
      key={key}
      aria-labelledby={`mx-${key}`}
      title={<span id={`mx-${key}`}>{interpolate(t.matrix.tier, { n })}: {t.approvalLevel[tier.level]}</span>}
      extra={<Typography.Text type="secondary" className="xs">{key === 'low' ? `${t.matrix.from} ${fmtMoney(0)}, ${t.matrix.upTo.toLowerCase()} ${fmtMoney(boundary || 0)}` : `${t.matrix.from} ${fmtMoney(boundary || 0)}, ${t.matrix.noUpper.toLowerCase()}`}</Typography.Text>}
      style={{ height: '100%' }}
    >
      <Typography.Text strong>{t.matrix.approvers}</Typography.Text>
      {active.length === 0 ? <p><Typography.Text type="secondary">{t.matrix.noApprover}</Typography.Text></p> : (
        <Checkbox.Group value={v[key]} onChange={(vals) => setV((x) => ({ ...x, [key]: vals as string[] }))} style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {active.map((a) => <Checkbox key={a.id} value={a.id}>{a.fullName} <Typography.Text type="secondary">({a.approvalLevel ? t.approvalLevel[a.approvalLevel] : ''})</Typography.Text></Checkbox>)}
        </Checkbox.Group>
      )}
      <Typography.Paragraph type="secondary" className="xs" style={{ marginTop: 8, marginBottom: 0 }}>{t.matrix.approversHint}</Typography.Paragraph>
    </Card>
  );
  return (
    <>
      <PageHeader title={t.matrix.title} meta={t.matrix.intro} />
      <Form layout="vertical" onFinish={() => { setTouched(true); if (badBoundary) return; void save.run(undefined); }}>
        <div className="stack">
          <Card>
            <Form.Item label={t.matrix.boundary} extra={t.matrix.boundaryHint} validateStatus={touched && badBoundary ? 'error' : undefined} help={touched && badBoundary ? t.errors.LIMIT_INVALID : undefined} style={{ marginBottom: 0 }}>
              <MoneyInput aria-label={t.matrix.boundary} value={v.boundary} onChange={(x) => setV({ ...v, boundary: x })} />
            </Form.Item>
          </Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>{tierCard('low', 1, tiers[0]!)}</Col>
            <Col xs={24} md={12}>{tierCard('high', 2, tiers[1]!)}</Col>
          </Row>
          <Notice kind="info" title={t.matrix.preview}>
            {tiers.map((x) => interpolate(t.matrix.previewLine, { level: t.approvalLevel[x.level], range: x.upTo === null ? `${fmtMoney(x.from)} ${t.matrix.noUpper.toLowerCase()}` : `0 - ${fmtMoney(x.upTo)}`, names: names(x.approverIds) })).join(' | ')}
          </Notice>
          <ActionError error={save.error} raw={save.rawError} />
        </div>
        <div className="save-bar">
          <Typography.Text type={dirty ? 'warning' : 'secondary'}>{dirty ? t.matrix.dirty : ''}</Typography.Text>
          <Space>
            <Button disabled={!dirty || save.pending} onClick={() => { setV(init); setTouched(false); save.reset(); }}>{t.matrix.discard}</Button>
            <Button type="primary" htmlType="submit" disabled={!dirty} loading={save.pending}>{t.matrix.save}</Button>
          </Space>
        </div>
      </Form>
    </>
  );
}
