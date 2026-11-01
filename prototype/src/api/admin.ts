import type { ApprovalMatrix, ApprovalTier, Db, Entity, Gate, Group, Id, Role, User } from './types';
import { ApiError, AP, call, FINANCE_ROLES, inScope } from './client';
import { admitToBatch, bump, checkVersion, entityOf, ruleEvent, supplierName } from './domain';
import { logAudit, nextSeq } from '../mock/db';

const GA: Role[] = ['GROUP_ADMIN'];
const ADMINS: Role[] = ['ENTITY_ADMIN', 'GROUP_ADMIN'];

const cfg = (d: Db, u: User, objectType: 'ENTITY_POLICY' | 'APPROVAL_MATRIX' | 'USER' | 'ENTITY' | 'GROUP' | 'GATE', objectId: string, label: string, code: string, params?: Record<string, string | number>, entityId: Id | null = u.entityId, eventType: 'CONFIGURATION_CHANGE' | 'USER_CHANGE' | 'GATE_CHANGE' = 'CONFIGURATION_CHANGE') =>
  logAudit(d, { entityId, hand: 'PERSON', actorName: u.fullName, actorId: u.id, eventType, objectType, objectId, objectLabel: label, event: { code, params } });

// ----- ERP sync (SCR-10 header) -----
export interface ErpSyncStatus {
  lastSyncAt: string;
  lastSyncFailed: boolean;
}
export const getErpSyncStatus = () => call<ErpSyncStatus>({ roles: FINANCE_ROLES, fast: true }, (d, u) => {
  const e = entityOf(d, u.entityId!);
  return { lastSyncAt: e.lastSyncAt, lastSyncFailed: e.lastSyncFailed };
});

/** Sync with the Entity ERP: invoices waiting for goods whose order now has a receipt are checked again. */
export const startErpSync = () =>
  call<{ rechecked: number; admitted: number }>({ roles: AP, write: true }, (d, u) => {
    const e = entityOf(d, u.entityId!);
    e.lastSyncAt = d.now;
    e.lastSyncFailed = false;
    let admitted = 0;
    let rechecked = 0;
    for (const inv of d.invoices.filter((i) => i.entityId === e.id && i.state === 'WAITING_FOR_GOODS' && i.flow !== 'SERVICES_WITH_ORDER')) {
      const po = d.purchaseOrders.find((p) => p.id === inv.poRef);
      if (!po) continue;
      rechecked += 1;
      if (po.receivedQuantity >= po.lines.reduce((s, l) => s + l.quantity, 0) && inv.plannedOutcome !== 'EXCEPTION_GATE') {
        inv.receiptRef = d.receipts.find((r) => r.poId === po.id)?.id ?? null;
        inv.plannedOutcome = 'IN_BATCH';
        inv.conditions = [1, 2, 3, 4, 5, 6].map((n) => ({ no: n as 1, result: 'PASS' as const, detail: { code: 'C_PASS_RECHECK' } }));
        const b = admitToBatch(d, inv);
        ruleEvent(d, inv, 'EV_RULE_ADMITTED', { batch: b.label });
        admitted += 1;
      }
    }
    return { rechecked, admitted };
  });

// ----- Users (SCR-70..72) -----
export interface UserInput {
  fullName: string;
  email: string;
  role: Role;
  entityId: Id | null;
  password?: string;
  erpUser: string | null;
  approvalLevel?: User['approvalLevel'];
  version?: number;
}

export const listUsers = (q: { entityId?: string; role?: Role | '' } = {}) =>
  call<(User & { entityName: string })[]>({ roles: ADMINS }, (d, u) =>
    d.users
      .filter((x) => (u.role === 'GROUP_ADMIN' ? true : x.entityId === u.entityId))
      .filter((x) => (!q.entityId || x.entityId === q.entityId) && (!q.role || x.role === q.role))
      .map((x) => ({ ...x, entityName: x.entityId ? entityOf(d, x.entityId).name : d.group.name })),
  );

export const getUser = (id: Id) =>
  call<User>({ roles: ADMINS }, (d, u) => {
    const x = d.users.find((y) => y.id === id);
    if (!x || (u.role === 'ENTITY_ADMIN' && x.entityId !== u.entityId)) throw new ApiError(404, 'NOT_FOUND');
    return x;
  });

export const listErpUsers = () => call<string[]>({ roles: ADMINS, fast: true }, (d) => d.users.map((x) => x.erpUser).filter((x): x is string => !!x));

function validateUser(d: Db, actor: User, body: UserInput, selfId?: Id): void {
  if (!body.fullName.trim() || !/^\S+@\S+\.\S+$/.test(body.email)) throw new ApiError(422, 'USER_FIELDS_REQUIRED');
  if (d.users.some((x) => x.id !== selfId && x.email.toLowerCase() === body.email.toLowerCase())) throw new ApiError(409, 'EMAIL_IN_USE');
  if (actor.role === 'ENTITY_ADMIN') {
    if (!['AP_ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'PAYMENT_APPROVER', 'REQUESTING_DEPARTMENT'].includes(body.role) || body.entityId !== actor.entityId) throw new ApiError(403, 'FORBIDDEN');
  }
  if (body.role === 'PAYMENT_APPROVER' && !body.approvalLevel) throw new ApiError(422, 'LEVEL_REQUIRED');
}

export const createUser = (body: UserInput) =>
  call<User>({ roles: ADMINS, write: true }, (d, u) => {
    validateUser(d, u, body);
    if ((body.password ?? '').length < 8) throw new ApiError(422, 'PASSWORD_SHORT');
    const x: User = { id: `u-${nextSeq(d, 'user')}`, fullName: body.fullName.trim(), email: body.email.trim(), role: body.role, entityId: body.entityId, approvalLevel: body.role === 'PAYMENT_APPROVER' ? body.approvalLevel ?? null : null, erpUser: body.erpUser, status: 'ACTIVE', version: 1 };
    d.users.push(x);
    cfg(d, u, 'USER', x.id, x.fullName, 'EV_USER_CREATED', { role: x.role }, x.entityId, 'USER_CHANGE');
    return x;
  });

export const updateUser = (id: Id, body: UserInput) =>
  call<User>({ roles: ADMINS, write: true }, (d, u) => {
    const x = inScope(u.role === 'GROUP_ADMIN' ? { entityId: null } as never : u, d.users.find((y) => y.id === id)) as User;
    if (u.role === 'ENTITY_ADMIN' && x.entityId !== u.entityId) throw new ApiError(404, 'NOT_FOUND');
    checkVersion(x.version, body.version);
    if (x.id === u.id && body.role !== x.role) throw new ApiError(422, 'OWN_ROLE');
    validateUser(d, u, body, x.id);
    Object.assign(x, { fullName: body.fullName.trim(), email: body.email.trim(), role: body.role, entityId: body.entityId, erpUser: body.erpUser, approvalLevel: body.role === 'PAYMENT_APPROVER' ? body.approvalLevel ?? null : null });
    bump(x);
    cfg(d, u, 'USER', x.id, x.fullName, 'EV_USER_ROLE_SET', { role: x.role, level: x.approvalLevel ?? '' }, x.entityId, 'USER_CHANGE');
    return x;
  });

export const deactivateUser = (id: Id) =>
  call<User>({ roles: ADMINS, write: true }, (d, u) => {
    const x = d.users.find((y) => y.id === id);
    if (!x || (u.role === 'ENTITY_ADMIN' && x.entityId !== u.entityId)) throw new ApiError(404, 'NOT_FOUND');
    if (x.id === u.id) throw new ApiError(422, 'OWN_ROLE');
    x.status = 'DEACTIVATED';
    bump(x);
    cfg(d, u, 'USER', x.id, x.fullName, 'EV_USER_DEACTIVATED', {}, x.entityId, 'USER_CHANGE');
    return x;
  });

// ----- Group, entities, policy, matrix (SCR-73..77) -----
export const getGroup = () => call<Group & { entityCount: number }>({ roles: [...ADMINS] }, (d) => ({ ...d.group, entityCount: d.entities.length }));

export const updateGroupLimits = (body: { maxPriceTolerance: number; maxBatchThreshold: number; version?: number }) =>
  call<{ group: Group; lowered: { entityId: Id; name: string; from: number; to: number }[] }>({ roles: GA, write: true }, (d, u) => {
    checkVersion(d.group.version, body.version);
    if (!(body.maxPriceTolerance > 0) || !(body.maxBatchThreshold > 0)) throw new ApiError(422, 'LIMIT_INVALID');
    d.group.maxPriceTolerance = body.maxPriceTolerance;
    d.group.maxBatchThreshold = body.maxBatchThreshold;
    bump(d.group);
    const lowered: { entityId: Id; name: string; from: number; to: number }[] = [];
    for (const e of d.entities) {
      if (e.priceTolerance > body.maxPriceTolerance) { lowered.push({ entityId: e.id, name: e.name, from: e.priceTolerance, to: body.maxPriceTolerance }); e.priceTolerance = body.maxPriceTolerance; bump(e); }
      if (e.batchThreshold > body.maxBatchThreshold) { e.batchThreshold = body.maxBatchThreshold; bump(e); }
    }
    cfg(d, u, 'GROUP', 'group', d.group.name, 'EV_LIMITS_CHANGED', { tolerance: body.maxPriceTolerance, threshold: body.maxBatchThreshold }, null);
    return { group: d.group, lowered };
  });

export const listSectors = () => call<string[]>({ roles: GA, fast: true }, (d) => d.group.sectors);
export const addSector = (name: string) =>
  call<string[]>({ roles: GA, write: true }, (d, u) => {
    const n = name.trim();
    if (!n) throw new ApiError(422, 'LIMIT_INVALID');
    if (!d.group.sectors.includes(n)) d.group.sectors.push(n);
    cfg(d, u, 'GROUP', 'group', d.group.name, 'EV_SECTOR_ADDED', { sector: n }, null);
    return d.group.sectors;
  });
export const removeSector = (name: string) =>
  call<string[]>({ roles: GA, write: true }, (d, u) => {
    d.group.sectors = d.group.sectors.filter((s) => s !== name);
    cfg(d, u, 'GROUP', 'group', d.group.name, 'EV_SECTOR_REMOVED', { sector: name }, null);
    return d.group.sectors;
  });

export const listEntities = () => call<Entity[]>({ roles: GA }, (d) => d.entities);

export const createEntity = (body: { name: string; taxCode: string }) =>
  call<Entity>({ roles: GA, write: true }, (d, u) => {
    if (!/^\d{10}$/.test(body.taxCode.trim())) throw new ApiError(422, 'TAX_CODE_INVALID');
    if (d.entities.some((e) => e.taxCode === body.taxCode.trim())) throw new ApiError(409, 'TAX_CODE_DUPLICATE');
    if (!body.name.trim()) throw new ApiError(422, 'USER_FIELDS_REQUIRED');
    const n = nextSeq(d, 'entity');
    const e: Entity = { id: `ent-${n}`, code: `E${n}`, name: body.name.trim(), taxCode: body.taxCode.trim(), priceTolerance: Math.min(2, d.group.maxPriceTolerance), batchThreshold: Math.min(150_000_000, d.group.maxBatchThreshold), sampleRate: 10, grouping: 'BY_SUPPLIER', mailbox: `invoices-${n}@calderwood.example`, lastSyncAt: d.now, lastSyncFailed: false, version: 1 };
    d.entities.push(e);
    d.matrices.push({ entityId: e.id, tiers: [{ level: 'DEPARTMENT_HEAD', from: 0, upTo: 50_000_000, approverIds: [] }, { level: 'CFO', from: 50_000_000, upTo: null, approverIds: [] }], version: 1 });
    cfg(d, u, 'ENTITY', e.id, e.name, 'EV_ENTITY_ADDED', { taxCode: e.taxCode }, null);
    return e;
  });

export const getEntityPolicy = () =>
  call<{ entity: Entity; group: Group }>({ roles: ['ENTITY_ADMIN'] }, (d, u) => ({ entity: entityOf(d, u.entityId!), group: d.group }));

export const updateEntityPolicy = (body: { priceTolerance: number; batchThreshold: number; sampleRate: number; grouping: Entity['grouping']; version?: number }) =>
  call<Entity>({ roles: ['ENTITY_ADMIN'], write: true }, (d, u) => {
    const e = entityOf(d, u.entityId!);
    checkVersion(e.version, body.version);
    const errors: Record<string, number> = {};
    if (body.priceTolerance > d.group.maxPriceTolerance) errors.priceTolerance = d.group.maxPriceTolerance;
    if (body.batchThreshold > d.group.maxBatchThreshold) errors.batchThreshold = d.group.maxBatchThreshold;
    if (!(body.sampleRate >= 1 && body.sampleRate <= 100)) errors.sampleRate = 1;
    if (Object.keys(errors).length) throw new ApiError(422, 'POLICY_INVALID', errors);
    Object.assign(e, { priceTolerance: body.priceTolerance, batchThreshold: body.batchThreshold, sampleRate: body.sampleRate, grouping: body.grouping });
    bump(e);
    cfg(d, u, 'ENTITY_POLICY', 'policy-' + e.id, e.name, 'EV_POLICY_CHANGED', { text: 'POLICY_SAVED' });
    return e;
  });

export const getApprovalMatrix = () =>
  call<{ matrix: ApprovalMatrix; approvers: User[] }>({ roles: ['ENTITY_ADMIN'] }, (d, u) => ({
    matrix: d.matrices.find((m) => m.entityId === u.entityId)!,
    approvers: d.users.filter((x) => x.entityId === u.entityId && x.role === 'PAYMENT_APPROVER'),
  }));

export const replaceApprovalMatrix = (body: { tiers: ApprovalTier[]; version?: number }) =>
  call<ApprovalMatrix>({ roles: ['ENTITY_ADMIN'], write: true }, (d, u) => {
    const m = d.matrices.find((x) => x.entityId === u.entityId)!;
    checkVersion(m.version, body.version);
    const tiers = [...body.tiers].sort((a, b) => a.from - b.from);
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i]!;
      const prev = tiers[i - 1];
      if (i === 0 && t.from !== 0) throw new ApiError(422, 'MATRIX_GAP', { from: 0, to: t.from });
      if (prev && prev.upTo !== null && t.from > prev.upTo) throw new ApiError(422, 'MATRIX_GAP', { from: prev.upTo, to: t.from });
      if (prev && (prev.upTo === null || t.from < prev.upTo)) throw new ApiError(422, 'MATRIX_OVERLAP');
    }
    if (tiers[tiers.length - 1]!.upTo !== null) throw new ApiError(422, 'MATRIX_GAP', { from: tiers[tiers.length - 1]!.upTo!, to: 0 });
    const empty = tiers.find((t) => !t.approverIds.some((id) => d.users.find((x) => x.id === id && x.status === 'ACTIVE')));
    if (empty) throw new ApiError(422, 'MATRIX_NO_APPROVER', { from: empty.from });
    m.tiers = tiers;
    bump(m);
    // Requests not yet signed are recomputed; one that needs another level loses its signatures.
    for (const r of d.requests.filter((x) => x.entityId === u.entityId && x.state.startsWith('AWAITING'))) {
      const level = tiers.find((t) => r.total >= t.from && (t.upTo === null || r.total < t.upTo))?.level ?? r.level;
      if (level !== r.level) { r.level = level; r.signatures = []; r.state = 'AWAITING_CHIEF_ACCOUNTANT'; bump(r); }
    }
    cfg(d, u, 'APPROVAL_MATRIX', 'matrix-' + u.entityId, entityOf(d, u.entityId!).name, 'EV_MATRIX_CHANGED');
    return m;
  });

// ----- Gates (SCR-75, SCR-78, SCR-79) -----
export interface GateRow extends Gate {
  supplierName: string;
  entityName: string;
  accuracy: number;
  alert: { rate: number; errors: number; sampled: number } | null;
}
const gateRow = (d: Db, g: Gate): GateRow => ({
  ...g, supplierName: supplierName(d, g.supplierId), entityName: entityOf(d, g.entityId).name, accuracy: g.compared ? (g.unchanged / g.compared) * 100 : 0,
  alert: g.state === 'OPEN' && g.sampled > 0 && (g.sampleErrors / g.sampled) * 100 > 2 ? { rate: (g.sampleErrors / g.sampled) * 100, errors: g.sampleErrors, sampled: g.sampled } : null,
});
export const listGates = () => call<GateRow[]>({ roles: GA }, (d) => d.gates.map((g) => gateRow(d, g)));
export const getGate = (id: Id) => call<GateRow>({ roles: GA }, (d) => {
  const g = d.gates.find((x) => x.id === id);
  if (!g) throw new ApiError(404, 'NOT_FOUND');
  return gateRow(d, g);
});
export const openGate = (id: Id, body: { reason?: string; version?: number }) =>
  call<GateRow>({ roles: GA, write: true }, (d, u) => {
    const g = d.gates.find((x) => x.id === id);
    if (!g) throw new ApiError(404, 'NOT_FOUND');
    checkVersion(g.version, body.version);
    if (g.state === 'OPEN') throw new ApiError(409, 'STALE_VERSION');
    if (g.compared < 50) throw new ApiError(422, 'GATE_TOO_FEW');
    const acc = (g.unchanged / g.compared) * 100;
    if (acc < 98 && !(body.reason ?? '').trim()) throw new ApiError(422, 'REASON_REQUIRED');
    g.state = 'OPEN';
    g.openSince = d.now.slice(0, 10);
    bump(g);
    cfg(d, u, 'GATE', g.id, `${supplierName(d, g.supplierId)} / ${entityOf(d, g.entityId).name}`, 'EV_GATE_OPENED', { accuracy: Number(acc.toFixed(1)), compared: g.compared }, null, 'GATE_CHANGE');
    return gateRow(d, g);
  });
export const closeGate = (id: Id, body: { version?: number } = {}) =>
  call<GateRow>({ roles: GA, write: true }, (d, u) => {
    const g = d.gates.find((x) => x.id === id);
    if (!g) throw new ApiError(404, 'NOT_FOUND');
    checkVersion(g.version, body.version);
    if (g.state === 'CLOSED') throw new ApiError(409, 'STALE_VERSION');
    g.state = 'CLOSED';
    g.openSince = null;
    bump(g);
    cfg(d, u, 'GATE', g.id, `${supplierName(d, g.supplierId)} / ${entityOf(d, g.entityId).name}`, 'EV_GATE_CLOSED', {}, null, 'GATE_CHANGE');
    return gateRow(d, g);
  });
