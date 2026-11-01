import { useSyncExternalStore, type ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { getForced, subscribeForced, type ForcedState } from '../api/client';
import { isForbidden } from '../lib/errors';
import { errorText } from '../lib/errors';
import { ErrorState, Skeleton } from './Bits';
import { AccessDeniedBody } from '../pages/AccessDenied';

export const useForced = (): ForcedState => useSyncExternalStore(subscribeForced, getForced);

interface Props<T> {
  q: UseQueryResult<T>;
  /** Shown when the data is empty (or the demo toolbar forces the empty state). */
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  skeletonRows?: number;
  children: (data: T) => ReactNode;
}

/** Loading, error, empty and content for one query, honouring the demo toolbar's forced state. */
export function Async<T>({ q, empty, isEmpty, skeletonRows, children }: Props<T>) {
  const forced = useForced();
  if (forced === 'loading' || q.isPending) return <Skeleton rows={skeletonRows} />;
  if (forced === 'server-error') return <ErrorState onRetry={() => void q.refetch()} />;
  if (q.isError) {
    if (isForbidden(q.error)) return <AccessDeniedBody record />;
    return <ErrorState text={errorText(q.error)} onRetry={() => void q.refetch()} />;
  }
  if (empty && (forced === 'empty' || (isEmpty && isEmpty(q.data)))) return <>{empty}</>;
  return <>{children(q.data)}</>;
}
