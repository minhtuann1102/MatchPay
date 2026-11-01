import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from './Modal';
import { Field, Notice } from './Bits';
import { isConflict } from '../lib/errors';
import { t } from '../i18n/vi';

/** Shows an action error; for an outdated view it offers a reload that keeps the typed text (BR-37). */
export function ActionError({ error, raw, onReload }: { error: string | null; raw?: unknown; onReload?: () => void }) {
  const qc = useQueryClient();
  if (!error) return null;
  return (
    <Notice
      kind="err"
      action={isConflict(raw) ? <button type="button" className="btn btn-sm" onClick={() => { void qc.invalidateQueries(); onReload?.(); }}>{t.common.reload}</button> : undefined}
    >
      {error}
    </Notice>
  );
}

interface Props {
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

/** A modal with one required text field: reject, withdraw, decline, reopen, and similar actions. */
export function ReasonModal({ title, intro, label, placeholder, confirmLabel, danger, required = true, requiredMessage, pending, error, rawError, onSubmit, onClose, children }: Props) {
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const invalid = required && !text.trim();
  return (
    <Modal
      title={title}
      onClose={onClose}
      dismissable={!pending}
      onSubmit={() => {
        setTouched(true);
        if (!invalid) onSubmit(text.trim());
      }}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={pending}>{t.common.cancel}</button>
          <button type="submit" className={`btn ${danger ? 'btn-danger-solid' : 'btn-primary'}`} disabled={pending}>
            {pending && <span className="spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      {intro}
      {children}
      <Field label={required ? `${label} ${t.common.required}` : label} htmlFor="reason-text" error={touched && invalid ? requiredMessage ?? t.common.reasonRequired : null}>
        <textarea
          id="reason-text"
          className={`textarea${touched && invalid ? ' invalid' : ''}`}
          value={text}
          placeholder={placeholder}
          data-autofocus
          aria-invalid={touched && invalid}
          aria-describedby={touched && invalid ? 'reason-text-err' : undefined}
          onChange={(e) => setText(e.target.value)}
        />
      </Field>
      <ActionError error={error} raw={rawError} />
    </Modal>
  );
}
