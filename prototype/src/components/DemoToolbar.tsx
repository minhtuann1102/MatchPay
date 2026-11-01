import { useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { App, FloatButton, Modal, Popconfirm, Select, Tooltip, Typography } from 'antd';
import { ClearOutlined, ExperimentOutlined, KeyOutlined, SwapOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { getForced, setForced, subscribeForced, type ForcedState } from '../api/client';
import { REAUTH_CODE } from '../api/signing';
import { resetDemoData, getDb } from '../mock/db';
import { usePersonaSwitch } from '../lib/usePersonaSwitch';
import { useAuth } from '../auth/AuthContext';
import { t } from '../i18n/vi';
import { fmtDateTime } from '../lib/format';

const STATES: ForcedState[] = ['none', 'loading', 'empty', 'server-error', 'ai-error', 'conflict'];

/** Demo tools (Demo Operator idea, D-12): switch persona, force a documented state, show the re-auth code, reset data. */
export function DemoToolbar() {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<'persona' | 'state' | null>(null);
  const forced = useSyncExternalStore(subscribeForced, getForced);
  const { session } = useAuth();
  const { personas, current, switchTo } = usePersonaSwitch();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { message } = App.useApp();
  const d = t.demo;

  const reset = () => {
    resetDemoData();
    setForced('none');
    void qc.clear();
    void message.success(d.resetDone);
    nav('/login');
  };

  return (
    <>
      <FloatButton.Group
        trigger="click"
        open={open}
        onOpenChange={setOpen}
        type={forced !== 'none' ? 'primary' : 'default'}
        icon={<ExperimentOutlined />}
        tooltip={d.title}
        aria-label={d.title}
        style={{ insetInlineEnd: 20, insetBlockEnd: 20 }}
      >
        <FloatButton icon={<SwapOutlined />} tooltip={d.persona} aria-label={d.persona} onClick={() => setDialog('persona')} />
        <FloatButton icon={<ThunderboltOutlined />} tooltip={d.forceState} aria-label={d.forceState} badge={forced !== 'none' ? { dot: true } : undefined} onClick={() => setDialog('state')} />
        <Tooltip title={`${d.otp}: ${REAUTH_CODE}`} placement="left">
          <FloatButton icon={<KeyOutlined />} aria-label={d.otp} />
        </Tooltip>
        <Popconfirm title={d.resetTitle} description={d.resetText} okText={d.reset} okButtonProps={{ danger: true }} cancelText={t.common.cancel} placement="left" onConfirm={reset}>
          <FloatButton icon={<ClearOutlined />} aria-label={d.reset} tooltip={d.reset} />
        </Popconfirm>
      </FloatButton.Group>
      <Modal open={dialog === 'persona'} title={d.persona} footer={null} onCancel={() => setDialog(null)} destroyOnHidden>
        <Select
          aria-label={d.persona}
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="label"
          value={session?.userId ?? current ?? undefined}
          options={personas.map((p) => ({ value: p.id, label: `${p.fullName}, ${t.roles[p.role]}${p.approvalLevel ? ` (${t.approvalLevel[p.approvalLevel]})` : ''}` }))}
          onChange={(id) => { setDialog(null); setOpen(false); void switchTo(id); }}
        />
      </Modal>
      <Modal open={dialog === 'state'} title={d.forceState} footer={null} onCancel={() => setDialog(null)} destroyOnHidden>
        <Select
          aria-label={d.forceState}
          style={{ width: '100%' }}
          value={forced}
          options={STATES.map((s) => ({ value: s, label: d.states[s] }))}
          onChange={(v) => { setForced(v); void qc.invalidateQueries(); setDialog(null); setOpen(false); }}
        />
        <Typography.Paragraph type="secondary" className="xs" style={{ marginTop: 8, marginBottom: 0 }}>{d.forceHint}</Typography.Paragraph>
        <Typography.Paragraph type="secondary" className="xs" style={{ marginTop: 8, marginBottom: 0 }}>{d.clock}: {fmtDateTime(getDb().now)}</Typography.Paragraph>
      </Modal>
    </>
  );
}
