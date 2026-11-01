import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { errorText } from './errors';

interface Opts<R> {
  /** Message shown on success (antd message). */
  success?: string | ((res: R) => string);
  onSuccess?: (res: R) => void;
}

/**
 * A button-bound mutation: pending state for the button's `loading`, refreshes every query on success so a change
 * shows on the other screens, shows an antd message, and keeps the error text for inline display.
 */
export function useAction<A, R>(fn: (arg: A) => Promise<R>, opts: Opts<R> = {}) {
  const qc = useQueryClient();
  const { message } = App.useApp();
  const m = useMutation({
    mutationFn: fn,
    onSuccess: (res) => {
      void qc.invalidateQueries();
      if (opts.success) void message.success(typeof opts.success === 'function' ? opts.success(res) : opts.success);
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
