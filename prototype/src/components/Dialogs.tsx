import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Form, Input, Modal } from 'antd';
import { Notice } from './Bits';
import { isConflict } from '../lib/errors';
import { t } from '../i18n/vi';

/** Shows an action error; for an outdated view it offers a reload that keeps the typed text (BR-37). */
export function ActionError({ error, raw, onReload }: { error: string | null; raw?: unknown; onReload?: () => void }) {
  const qc = useQueryClient();
  if (!error) return null;
  return (
    <Notice
      kind="err"
      className="action-error"
      action={isConflict(raw) ? <Button size="small" onClick={() => { void qc.invalidateQueries(); onReload?.(); }}>{t.common.reload}</Button> : undefined}
    >
      {error}
    </Notice>
  );
}

interface ActionModalProps {
  title: ReactNode;
  children?: ReactNode;
  okText: string;
  onOk: () => void;
  onClose: () => void;
  danger?: boolean;
  pending?: boolean;
  okDisabled?: boolean;
  error?: string | null;
  rawError?: unknown;
  width?: number;
  /** Extra buttons before Cancel (for example a secondary action). */
  footerExtra?: ReactNode;
  hideOk?: boolean;
  hideCancel?: boolean;
}

/** One dialog for every confirm and form: antd Modal with a primary or danger OK button, a loading state, and the action error. */
export function ActionModal({ title, children, okText, onOk, onClose, danger, pending, okDisabled, error, rawError, width = 520, footerExtra, hideOk, hideCancel }: ActionModalProps) {
  return (
    <Modal
      open
      title={title}
      width={width}
      onCancel={onClose}
      maskClosable={!pending}
      keyboard={!pending}
      closable={!pending}
      cancelText={t.common.cancel}
      okText={okText}
      onOk={onOk}
      okButtonProps={{ danger, loading: pending, disabled: okDisabled, style: hideOk ? { display: 'none' } : undefined }}
      cancelButtonProps={{ disabled: pending }}
      footer={(_, { OkBtn, CancelBtn }) => (<>{footerExtra}{!hideCancel && <CancelBtn />}<OkBtn /></>)}
      destroyOnHidden
    >
      <div className="modal-body">
        {children}
        <ActionError error={error ?? null} raw={rawError} />
      </div>
    </Modal>
  );
}

interface ReasonProps {
  title: string;
  intro?: ReactNode;
  label: string;
  placeholder?: string;
  confirmLabel: string;
  danger?: boolean;
  required?: boolean;
  requiredMessage?: string;
  pending: boolean;
  error: string | null;
  rawError?: unknown;
  onSubmit: (text: string) => void;
  onClose: () => void;
  children?: ReactNode;
}

/** A dialog with one required text area: reject, withdraw, decline, reopen, and similar actions. */
export function ReasonModal({ title, intro, label, placeholder, confirmLabel, danger, required = true, requiredMessage, pending, error, rawError, onSubmit, onClose, children }: ReasonProps) {
  const [form] = Form.useForm<{ reason: string }>();
  useEffect(() => { form.resetFields(); }, [form]);
  return (
    <ActionModal
      title={title}
      okText={confirmLabel}
      danger={danger}
      pending={pending}
      error={error}
      rawError={rawError}
      onClose={onClose}
      onOk={() => { void form.validateFields().then((v) => onSubmit((v.reason ?? '').trim())).catch(() => undefined); }}
    >
      {intro}
      {children}
      <Form form={form} layout="vertical" onFinish={() => undefined}>
        <Form.Item
          name="reason"
          label={label}
          rules={required ? [{ required: true, whitespace: true, message: requiredMessage ?? t.common.reasonRequired }] : []}
        >
          <Input.TextArea rows={4} maxLength={500} showCount placeholder={placeholder} autoFocus />
        </Form.Item>
      </Form>
    </ActionModal>
  );
}
