import { ApiError } from '../api/client';
import { t } from '../i18n/vi';
import { interpolate } from './format';

/** Vietnamese text for any error from the mock API. */
export function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    const tpl = t.errors[err.code as keyof typeof t.errors];
    if (tpl) return interpolate(tpl, err.params);
    return t.errors.GENERIC;
  }
  return t.errors.GENERIC;
}

export const isConflict = (err: unknown): boolean => err instanceof ApiError && (err.code === 'STALE_VERSION' || err.code === 'CONFLICT');
export const isForbidden = (err: unknown): boolean => err instanceof ApiError && (err.status === 403 || err.status === 404);
