import { useSyncExternalStore, type ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Skeleton } from 'antd';
import { getForced, subscribeForced, type ForcedState } from '../api/client';
import { isForbidden, errorText } from '../lib/errors';
import { ErrorState } from './Bits';
import { AccessDeniedBody } from '../pages/AccessDenied';

export const useForced = (): ForcedState => useSyncExternalStore(subscribeForced, getForced);

/** Loading skeleton used by Async and by pages that wait for several queries. */
export const Loading = ({ rows = 6 }: { rows?: number }) => (
  <div className="pad" role="status" aria-busy="true"><Skeleton active title={false} paragraph={{ rows }} /></div>
);

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
  if (forced === 'loading' || q.isPending) return <Loading rows={skeletonRows} />;
  if (forced === 'server-error') return <ErrorState onRetry={() => void q.refetch()} />;
  if (q.isError) {
    if (isForbidden(q.error)) return <AccessDeniedBody record />;
    return <ErrorState text={errorText(q.error)} onRetry={() => void q.refetch()} />;
  }
  if (empty && (forced === 'empty' || (isEmpty && isEmpty(q.data)))) return <>{empty}</>;
  return <>{children(q.data)}</>;
}
