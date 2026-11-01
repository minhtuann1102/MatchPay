import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/Toast';
import { errorText } from './errors';

interface Opts<R> {
  /** Toast shown on success. */
  success?: string | ((res: R) => string);
  onSuccess?: (res: R) => void;
}

/**
 * A button-bound mutation: disables while it runs, refreshes every query on success so a change shows on
 * the other screens, shows a toast, and keeps the error text for inline display.
 */
export function useAction<A, R>(fn: (arg: A) => Promise<R>, opts: Opts<R> = {}) {
  const qc = useQueryClient();
  const toast = useToast();
  const m = useMutation({
    mutationFn: fn,
    onSuccess: (res) => {
      void qc.invalidateQueries();
      if (opts.success) toast(typeof opts.success === 'function' ? opts.success(res) : opts.success);
      opts.onSuccess?.(res);
    },
  });
  return {
    run: (arg: A) => m.mutateAsync(arg).catch(() => undefined),
    pending: m.isPending,
    error: m.error ? errorText(m.error) : null,
    rawError: m.error,
    reset: m.reset,
  };
}
