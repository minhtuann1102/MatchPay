import type { ApprovalLevel, Id, Invoice } from './types';
import { ApiError, call } from './client';
import { admitToBatch, apOf, bump, checkVersion, notify, personEvent, ruleEvent } from './domain';

export interface DecisionRow {
  invoice: Invoice;
  kind: 'TAX_RISK_HOLD' | 'INDIVIDUAL_APPROVAL';
  level: ApprovalLevel | null;
  amount: number;
  groupSize: number;
  sentAt: string;
  ageDays: number;
}

export const getDecisionQueue = () =>
  call<DecisionRow[]>({ roles: ['CHIEF_ACCOUNTANT', 'PAYMENT_APPROVER'] }, (d, u) => {
    const route = u.role === 'CHIEF_ACCOUNTANT' ? 'CHIEF_ACCOUNTANT' : 'PAYMENT_APPROVER';
    const mine = d.invoices.filter(
      (i) => i.entityId === u.entityId && i.exception?.state === 'WAITING_FOR_DECISION' && i.exception.route === route && (route === 'CHIEF_ACCOUNTANT' || i.exception.requiredLevel === u.approvalLevel),
    );
    return mine
      .map((i): DecisionRow => {
        const g = i.exception!.linkedGroup;
        const group = g ? mine.filter((x) => x.exception?.linkedGroup === g) : [i];
        const sentAt = i.exception!.sentForDecisionAt ?? i.exception!.openedAt;
        return {
          invoice: i,
          kind: route === 'CHIEF_ACCOUNTANT' ? 'TAX_RISK_HOLD' : 'INDIVIDUAL_APPROVAL',
          level: i.exception!.requiredLevel,
          amount: i.totalAmount,
          groupSize: group.length,
          sentAt,
          ageDays: Math.round((Date.parse(d.now.slice(0, 10)) - Date.parse(sentAt.slice(0, 10))) / 86_400_000),
        };
      })
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  });

export const decideTaxRiskHold = (id: Id, body: { decision: 'RELEASE' | 'REJECT'; reason: string; version?: number }) =>
  call<Invoice>({ roles: ['CHIEF_ACCOUNTANT'], write: true }, (d, u) => {
    const inv = d.invoices.find((i) => i.id === id && i.entityId === u.entityId);
    if (!inv) throw new ApiError(404, 'NOT_FOUND');
    checkVersion(inv.version, body.version);
    const e = inv.exception;
    if (!e || e.state !== 'WAITING_FOR_DECISION' || e.route !== 'CHIEF_ACCOUNTANT') throw new ApiError(409, 'STALE_VERSION');
    if (!body.reason.trim()) throw new ApiError(422, 'REASON_REQUIRED');
    e.decisionNote = body.reason.trim();
    if (body.decision === 'RELEASE') {
      e.reasons = e.reasons.filter((r) => r.code !== 'TAX_RISK_HOLD');
      inv.conditions = inv.conditions.map((c) => (c.no === 5 ? { ...c, result: 'PASS', detail: { code: 'C5_RELEASED' } } : c));
      personEvent(d, u, inv, 'EV_TAXRISK_RELEASED', {}, body.reason);
      e.state = 'IN_REVIEW';
      e.route = null;
      if (!inv.conditions.some((c) => c.result === 'FAIL')) {
        const b = admitToBatch(d, inv);
        ruleEvent(d, inv, 'EV_RULE_ADMITTED', { batch: b.label });
      }
    } else {
      personEvent(d, u, inv, 'EV_TAXRISK_REJECTED', {}, body.reason);
      e.state = 'CLOSED';
      e.outcome = 'REJECTED';
      inv.state = 'REJECTED';
      inv.rejection = { code: 'REJECTED_BY_PERSON', note: body.reason.trim() };
      inv.note = { code: 'NOTE_REJECTED_BY_PERSON' };
    }
    notify(d, apOf(d, inv.entityId), 'EXCEPTION_OPENED', 'INVOICE', inv.id, { invoice: inv.invoiceNumber, reason: body.decision === 'RELEASE' ? 'DECIDED_RELEASED' : 'DECIDED_REJECTED', supplier: inv.sellerName, amount: inv.totalAmount, more: 0 });
    bump(inv);
    return inv;
  });

export const decideIndividualApproval = (id: Id, body: { decision: 'APPROVE' | 'DECLINE'; reason?: string; version?: number }) =>
  call<Invoice[]>({ roles: ['PAYMENT_APPROVER'], write: true }, (d, u) => {
    const first = d.invoices.find((i) => i.id === id && i.entityId === u.entityId);
    if (!first) throw new ApiError(404, 'NOT_FOUND');
    checkVersion(first.version, body.version);
    const e = first.exception;
    if (!e || e.state !== 'WAITING_FOR_DECISION' || e.route !== 'PAYMENT_APPROVER' || e.requiredLevel !== u.approvalLevel) throw new ApiError(409, 'STALE_VERSION');
    const group = e.linkedGroup ? d.invoices.filter((i) => i.exception?.linkedGroup === e.linkedGroup) : [first];
    if (group.some((i) => i.processedBy.includes(u.id))) throw new ApiError(422, 'PROCESSED_BY_YOU');
    if (body.decision === 'DECLINE' && !(body.reason ?? '').trim()) throw new ApiError(422, 'REASON_REQUIRED');
    for (const inv of group) {
      const ex = inv.exception!;
      ex.decisionNote = body.reason?.trim() || null;
      if (body.decision === 'APPROVE') {
        ex.state = 'CLOSED';
        ex.outcome = 'APPROVED_INDIVIDUALLY';
        ex.individuallyApproved = true;
        personEvent(d, u, inv, 'EV_APPROVED_INDIVIDUALLY', { level: u.approvalLevel ?? '' }, body.reason);
        const b = admitToBatch(d, inv, { code: 'NOTE_APPROVED_INDIVIDUALLY' });
        ex.state = 'CLOSED';
        ex.outcome = 'APPROVED_INDIVIDUALLY';
        ex.individuallyApproved = true;
        ruleEvent(d, inv, 'EV_RULE_ADMITTED', { batch: b.label });
      } else {
        ex.state = 'IN_REVIEW';
        ex.route = null;
        ex.reasons.push({ code: 'APPROVAL_DECLINED' });
        personEvent(d, u, inv, 'EV_APPROVAL_DECLINED', {}, body.reason);
      }
      bump(inv);
    }
    if (body.decision === 'DECLINE') {
      notify(d, apOf(d, first.entityId), 'EXCEPTION_OPENED', 'INVOICE', first.id, { invoice: first.invoiceNumber, reason: 'APPROVAL_DECLINED', supplier: first.sellerName, amount: first.totalAmount, more: 0 });
    }
    return group;
  });
