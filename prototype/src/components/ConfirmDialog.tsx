import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { t } from '../i18n/vi';

interface Props {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, children, confirmLabel, danger, pending, error, onConfirm, onCancel }: Props) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      dismissable={!pending}
      onSubmit={onConfirm}
      footer={
        <>
          <button type="button" className="btn" onClick={onCancel} disabled={pending}>{t.common.cancel}</button>
          <button type="submit" className={`btn ${danger ? 'btn-danger-solid' : 'btn-primary'}`} disabled={pending}>
            {pending && <span className="spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      {children}
      {error && <div className="notice n-err" role="alert"><div className="grow"><span>{error}</span></div></div>}
    </Modal>
  );
}
