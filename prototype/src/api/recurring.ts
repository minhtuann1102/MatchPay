import type { Id, RecurringProfile } from './types';
import { ApiError, AP, call, inScope } from './client';
import { bump, checkVersion, supplierName } from './domain';
import { logAudit, nextSeq } from '../mock/db';

export interface ProfileRow extends RecurringProfile {
  supplierName: string;
  average: number | null;
}

export interface ProfileInput {
  supplierId: Id;
  location: string;
  contract: string;
  period: RecurringProfile['period'];
  priceType: RecurringProfile['priceType'];
  contractPrice: number | null;
  deviationThreshold: number | null;
  version?: number;
}

const toRow = (supplier: string, p: RecurringProfile): ProfileRow => ({
  ...p,
  supplierName: supplier,
  average: p.earlier.length ? Math.round(p.earlier.reduce((s, e) => s + e.amount, 0) / p.earlier.length) : null,
});

const audit = (d: Parameters<typeof logAudit>[0], entityId: Id, userName: string, userId: Id, p: RecurringProfile, code: string) =>
  logAudit(d, { entityId, hand: 'PERSON', actorName: userName, actorId: userId, eventType: 'CONFIGURATION_CHANGE', objectType: 'ENTITY_POLICY', objectId: p.id, objectLabel: p.contract, event: { code, params: { contract: p.contract } } });

function validate(d: Parameters<typeof supplierName>[0], entityId: Id, body: ProfileInput, selfId?: Id): void {
  if (!body.supplierId || !body.location.trim() || !body.contract.trim()) throw new ApiError(422, 'PROFILE_FIELDS_REQUIRED');
  if (body.priceType === 'FIXED' && !(body.contractPrice && body.contractPrice > 0)) throw new ApiError(422, 'CONTRACT_PRICE_REQUIRED');
  if (body.priceType === 'USAGE_BASED' && !(body.deviationThreshold && body.deviationThreshold > 0)) throw new ApiError(422, 'THRESHOLD_REQUIRED');
  const dup = d.profiles.find(
    (p) => p.id !== selfId && p.entityId === entityId && p.status === 'ACTIVE' && p.supplierId === body.supplierId && p.period === body.period && p.location.trim().toLowerCase() === body.location.trim().toLowerCase(),
  );
  if (dup) throw new ApiError(409, 'DUPLICATE_PROFILE');
}

export const listRecurringProfiles = (q: { status?: 'ACTIVE' | 'INACTIVE' } = {}) =>
  call<ProfileRow[]>({ roles: AP }, (d, u) =>
    d.profiles.filter((p) => p.entityId === u.entityId && (!q.status || p.status === q.status)).map((p) => toRow(supplierName(d, p.supplierId), p)),
  );

export const getRecurringProfile = (id: Id) =>
  call<ProfileRow>({ roles: AP }, (d, u) => {
    const p = inScope(u, d.profiles.find((x) => x.id === id));
    return toRow(supplierName(d, p.supplierId), p);
  });

export const createRecurringProfile = (body: ProfileInput) =>
  call<ProfileRow>({ roles: AP, write: true }, (d, u) => {
    validate(d, u.entityId!, body);
    const p: RecurringProfile = {
      id: `rp-${nextSeq(d, 'profile')}`, entityId: u.entityId!, supplierId: body.supplierId, location: body.location.trim(), contract: body.contract.trim(), period: body.period,
      priceType: body.priceType, contractPrice: body.priceType === 'FIXED' ? body.contractPrice : null, deviationThreshold: body.priceType === 'USAGE_BASED' ? body.deviationThreshold : null,
      status: 'ACTIVE', earlier: [], version: 1,
    };
    d.profiles.push(p);
    audit(d, u.entityId!, u.fullName, u.id, p, 'EV_PROFILE_CREATED');
    return toRow(supplierName(d, p.supplierId), p);
  });

export const updateRecurringProfile = (id: Id, body: ProfileInput) =>
  call<ProfileRow>({ roles: AP, write: true }, (d, u) => {
    const p = inScope(u, d.profiles.find((x) => x.id === id));
    checkVersion(p.version, body.version);
    validate(d, u.entityId!, body, p.id);
    Object.assign(p, {
      supplierId: body.supplierId, location: body.location.trim(), contract: body.contract.trim(), period: body.period, priceType: body.priceType,
      contractPrice: body.priceType === 'FIXED' ? body.contractPrice : null, deviationThreshold: body.priceType === 'USAGE_BASED' ? body.deviationThreshold : null,
    });
    bump(p);
    audit(d, u.entityId!, u.fullName, u.id, p, 'EV_PROFILE_UPDATED');
    return toRow(supplierName(d, p.supplierId), p);
  });

export const deactivateRecurringProfile = (id: Id, body: { version?: number } = {}) =>
  call<ProfileRow>({ roles: AP, write: true }, (d, u) => {
    const p = inScope(u, d.profiles.find((x) => x.id === id));
    checkVersion(p.version, body.version);
    p.status = 'INACTIVE';
    bump(p);
    audit(d, u.entityId!, u.fullName, u.id, p, 'EV_PROFILE_DEACTIVATED');
    return toRow(supplierName(d, p.supplierId), p);
  });
