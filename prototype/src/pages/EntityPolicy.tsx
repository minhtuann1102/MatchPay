import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, InputNumber, Row, Select, Slider, Space, Typography } from 'antd';
import { ClusterOutlined } from '@ant-design/icons';
import { updateEntityPolicy } from '../api/admin';
import { ApiError } from '../api/client';
import { usePolicy } from '../api/hooks';
import type { Entity } from '../api/types';
import { Async } from '../components/Async';
import { Notice, PageHeader } from '../components/Bits';
import { ActionError } from '../components/Dialogs';
import { MoneyInput } from '../components/Inputs';
import { fmtMoney, interpolate } from '../lib/format';
import { useAction } from '../lib/useAction';
import { errorText } from '../lib/errors';
import { t } from '../i18n/vi';

/** SCR-73 Entity Policy: tolerance, batch threshold, sample rate and grouping, never above the group limits. */
export function EntityPolicy() {
  const q = usePolicy();
  return <Async q={q} skeletonRows={7}>{(d) => <PolicyForm entity={d.entity} max={{ tolerance: d.group.maxPriceTolerance, threshold: d.group.maxBatchThreshold }} />}</Async>;
}

function PolicyForm({ entity, max }: { entity: Entity; max: { tolerance: number; threshold: number } }) {
  const init = { tol: entity.priceTolerance, thr: entity.batchThreshold, rate: entity.sampleRate, grouping: entity.grouping };
  const [v, setV] = useState<{ tol: number | null; thr: number | null; rate: number | null; grouping: Entity['grouping'] }>(init);
  const [touched, setTouched] = useState(false);
  // A fresh version from the server (after a save or a reload) resets the form.
  useEffect(() => { setV(init); setTouched(false); }, [entity.version]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = v.tol !== init.tol || v.thr !== init.thr || v.rate !== init.rate || v.grouping !== init.grouping;
  const bad = {
    tol: !(v.tol !== null && v.tol > 0) || (v.tol ?? 0) > max.tolerance,
    thr: !(v.thr !== null && v.thr > 0) || (v.thr ?? 0) > max.threshold,
    rate: !(v.rate !== null && v.rate >= 1 && v.rate <= 100),
  };
  const save = useAction(() => updateEntityPolicy({ priceTolerance: v.tol!, batchThreshold: v.thr!, sampleRate: v.rate!, grouping: v.grouping, version: entity.version }), { success: t.policy.saved });
  const serverFields = save.rawError instanceof ApiError && save.rawError.code === 'POLICY_INVALID' ? save.rawError.params : null;
  const tolErr = (touched && bad.tol) || serverFields?.priceTolerance !== undefined ? interpolate(t.policy.overMax, { max: `${max.tolerance}%` }) : null;
  const thrErr = (touched && bad.thr) || serverFields?.batchThreshold !== undefined ? interpolate(t.policy.overMax, { max: fmtMoney(max.threshold) }) : null;
  const rateErr = touched && bad.rate ? t.policy.invalid : null;
  return (
    <>
      <PageHeader title={t.policy.title} meta={interpolate(t.policy.intro, { entity: entity.name })} />
      <Notice kind="info" icon={<ClusterOutlined />} title={t.policy.groupLimits}>{interpolate(t.policy.maxTolerance, { n: max.tolerance })}. {interpolate(t.policy.maxThreshold, { n: fmtMoney(max.threshold) })}.</Notice>
      <Form layout="vertical" onFinish={() => { setTouched(true); if (Object.values(bad).some(Boolean)) return; void save.run(undefined); }}>
        <Card>
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item label={t.policy.tolerance} extra={interpolate(t.policy.toleranceHint, { max: max.tolerance })} validateStatus={tolErr ? 'error' : undefined} help={tolErr ?? undefined}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <InputNumber<number> aria-label={t.policy.tolerance} min={0} max={100} step={0.5} addonAfter="%" value={v.tol} onChange={(x) => setV({ ...v, tol: x })} style={{ width: '100%' }} />
                  <Slider min={0} max={Math.max(max.tolerance, 1)} step={0.5} value={Math.min(v.tol ?? 0, Math.max(max.tolerance, 1))} onChange={(x) => setV({ ...v, tol: x })} />
                </Space>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t.policy.threshold} extra={interpolate(t.policy.thresholdHint, { max: fmtMoney(max.threshold) })} validateStatus={thrErr ? 'error' : undefined} help={thrErr ?? undefined}>
                <MoneyInput aria-label={t.policy.threshold} value={v.thr} onChange={(x) => setV({ ...v, thr: x })} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t.policy.sampleRate} extra={t.policy.sampleHint} validateStatus={rateErr ? 'error' : undefined} help={rateErr ?? undefined}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <InputNumber<number> aria-label={t.policy.sampleRate} min={0} max={100} step={1} addonAfter="%" value={v.rate} onChange={(x) => setV({ ...v, rate: x })} style={{ width: '100%' }} />
                  <Slider min={1} max={100} value={Math.min(Math.max(v.rate ?? 1, 1), 100)} onChange={(x) => setV({ ...v, rate: x })} />
                </Space>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t.policy.grouping}>
                <Select aria-label={t.policy.grouping} value={v.grouping} onChange={(g) => setV({ ...v, grouping: g })} options={(['BY_SUPPLIER', 'PER_INVOICE'] as const).map((g) => ({ value: g, label: t.policy.groupingOptions[g] }))} />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Text type="secondary" className="xs">{t.policy.effect}</Typography.Text>
          <div style={{ marginTop: 12 }}>
            {serverFields ? <Notice kind="err">{errorText(save.rawError)}</Notice> : <ActionError error={save.error} raw={save.rawError} />}
          </div>
        </Card>
        <div className="save-bar">
          <Typography.Text type={dirty ? 'warning' : 'secondary'}>{dirty ? t.policy.dirty : ''}</Typography.Text>
          <Space>
            <Button disabled={!dirty || save.pending} onClick={() => { setV(init); setTouched(false); save.reset(); }}>{t.policy.discard}</Button>
            <Button type="primary" htmlType="submit" disabled={!dirty} loading={save.pending}>{t.policy.save}</Button>
          </Space>
        </div>
      </Form>
    </>
  );
}
