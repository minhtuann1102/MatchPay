import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { t } from '../i18n/vi';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Traps focus, closes on Esc and restores focus to the opener. */
function useDialog(onClose: () => void, dismissable: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) {
        e.stopPropagation();
        onClose();
      }
      if (e.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) return;
      const firstEl = items[0]!;
      const lastEl = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  large?: boolean;
  /** Set false while a mutation runs. */
  dismissable?: boolean;
  onSubmit?: () => void;
}

export function Modal({ title, onClose, children, footer, large, dismissable = true, onSubmit }: ModalProps) {
  const ref = useDialog(onClose, dismissable);
  const id = `dlg-${title.length}-${title.charCodeAt(0)}`;
  const body = (
    <>
      <div className="modal-b">{children}</div>
      {footer && <div className="modal-f">{footer}</div>}
    </>
  );
  return createPortal(
    <div className="modal-back overlay" onMouseDown={(e) => e.target === e.currentTarget && dismissable && onClose()}>
      <div className={`modal${large ? ' modal-lg' : ''}`} role="dialog" aria-modal="true" aria-labelledby={id} ref={ref} tabIndex={-1}>
        <div className="modal-h">
          <h2 id={id}>{title}</h2>
          <button type="button" className="btn btn-quiet btn-sm" onClick={onClose} disabled={!dismissable} aria-label={t.common.close}>
            <Icon name="x" small />
          </button>
        </div>
        {onSubmit ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            noValidate
          >
            {body}
          </form>
        ) : (
          body
        )}
      </div>
    </div>,
    document.body,
  );
}

interface DrawerProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  dismissable?: boolean;
}

export function Drawer({ title, onClose, children, footer, dismissable = true }: DrawerProps) {
  const ref = useDialog(onClose, dismissable);
  const id = `drw-${title.length}`;
  return createPortal(
    <div className="modal-back overlay drawer-back" onMouseDown={(e) => e.target === e.currentTarget && dismissable && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby={id} ref={ref} tabIndex={-1}>
        <div className="modal-h">
          <h2 id={id}>{title}</h2>
          <button type="button" className="btn btn-quiet btn-sm" onClick={onClose} disabled={!dismissable} aria-label={t.common.close}>
            <Icon name="x" small />
          </button>
        </div>
        <div className="drawer-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}
