import type { Role } from '../api/types';
import type { IconName } from '../components/Icon';
import { t } from '../i18n/vi';

export interface NavItem {
  id: string;
  to: string;
  label: string;
  icon: IconName;
  /** Which count the badge shows. */
  badge?: 'needs' | 'decisions' | 'signing' | 'acceptance' | 'gateAlerts';
}

// Sidebar items per role: docs/03-information-architecture/03-navigation.md and wireframes/assets/states.js.
export const NAV: Record<Role, NavItem[]> = {
  AP_ACCOUNTANT: [
    { id: 'invoices', to: '/invoices', label: t.nav.invoices, icon: 'file', badge: 'needs' },
    { id: 'batch', to: '/batch', label: t.nav.batch, icon: 'stack' },
    { id: 'mailbox', to: '/mailbox', label: t.nav.mailbox, icon: 'mail' },
    { id: 'recurring', to: '/recurring-profiles', label: t.nav.recurring, icon: 'repeat' },
    { id: 'notifications', to: '/notifications', label: t.nav.notifications, icon: 'bell' },
    { id: 'dashboard', to: '/dashboard', label: t.nav.dashboard, icon: 'bars' },
  ],
  CHIEF_ACCOUNTANT: [
    { id: 'decisions', to: '/decisions', label: t.nav.decisionsChief, icon: 'scale', badge: 'decisions' },
    { id: 'signing', to: '/signing', label: t.nav.signing, icon: 'pen', badge: 'signing' },
    { id: 'delegations', to: '/delegations', label: t.nav.delegations, icon: 'handover' },
    { id: 'invoices', to: '/invoices', label: t.nav.invoices, icon: 'file' },
    { id: 'notifications', to: '/notifications', label: t.nav.notifications, icon: 'bell' },
    { id: 'dashboard', to: '/dashboard', label: t.nav.dashboard, icon: 'bars' },
    { id: 'audit', to: '/audit-log', label: t.nav.audit, icon: 'book' },
  ],
  PAYMENT_APPROVER: [
    { id: 'signing', to: '/signing', label: t.nav.signing, icon: 'pen', badge: 'signing' },
    { id: 'decisions', to: '/decisions', label: t.nav.decisionsApprover, icon: 'checkcircle', badge: 'decisions' },
    { id: 'delegations', to: '/delegations', label: t.nav.delegations, icon: 'handover' },
    { id: 'invoices', to: '/invoices', label: t.nav.invoices, icon: 'file' },
    { id: 'notifications', to: '/notifications', label: t.nav.notifications, icon: 'bell' },
    { id: 'dashboard', to: '/dashboard', label: t.nav.dashboard, icon: 'bars' },
  ],
  REQUESTING_DEPARTMENT: [{ id: 'acceptance', to: '/acceptance', label: t.nav.acceptance, icon: 'checkcircle', badge: 'acceptance' }],
  ENTITY_ADMIN: [
    { id: 'policy', to: '/entity/policy', label: t.nav.policy, icon: 'sliders' },
    { id: 'matrix', to: '/entity/approval-matrix', label: t.nav.matrix, icon: 'grid' },
    { id: 'users', to: '/users', label: t.nav.users, icon: 'users' },
    { id: 'delegations', to: '/delegations', label: t.nav.delegations, icon: 'handover' },
    { id: 'dashboard', to: '/dashboard', label: t.nav.dashboard, icon: 'bars' },
    { id: 'audit', to: '/audit-log', label: t.nav.audit, icon: 'book' },
  ],
  GROUP_ADMIN: [
    { id: 'group', to: '/group', label: t.nav.group, icon: 'network' },
    { id: 'gates', to: '/group/gates', label: t.nav.gates, icon: 'unlock', badge: 'gateAlerts' },
    { id: 'entities', to: '/group/entities', label: t.nav.entities, icon: 'building' },
    { id: 'users', to: '/users', label: t.nav.users, icon: 'users' },
    { id: 'dashboard', to: '/dashboard', label: t.nav.dashboard, icon: 'bars' },
    { id: 'audit', to: '/audit-log', label: t.nav.audit, icon: 'book' },
  ],
  DEMO_OPERATOR: [{ id: 'erp', to: '/demo/erp-simulator', label: t.nav.erp, icon: 'server' }],
};

/** Role home page: the first sidebar item (03-navigation.md). */
export const homeOf = (role: Role): string => NAV[role][0]!.to;

// Routes of 02-routes-and-permissions.md with the roles that may open them.
const AP: Role[] = ['AP_ACCOUNTANT'];
const CA: Role[] = ['CHIEF_ACCOUNTANT'];
const FIN: Role[] = ['AP_ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'PAYMENT_APPROVER'];
const SIGNERS: Role[] = ['CHIEF_ACCOUNTANT', 'PAYMENT_APPROVER'];
export const ROUTE_ROLES: Record<string, Role[]> = {
  '/invoices': FIN,
  '/invoices/:id': FIN,
  '/recurring-profiles': AP,
  '/acceptance': ['REQUESTING_DEPARTMENT'],
  '/mailbox': AP,
  '/batch': AP,
  '/decisions': SIGNERS,
  '/signing': SIGNERS,
  '/signing/requests/:id': SIGNERS,
  '/delegations': [...SIGNERS, 'ENTITY_ADMIN'],
  '/dashboard': ['AP_ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'PAYMENT_APPROVER', 'ENTITY_ADMIN', 'GROUP_ADMIN'],
  '/audit-log': [...CA, 'ENTITY_ADMIN', 'GROUP_ADMIN'],
  '/notifications': FIN,
  '/users': ['ENTITY_ADMIN', 'GROUP_ADMIN'],
  '/entity/policy': ['ENTITY_ADMIN'],
  '/entity/approval-matrix': ['ENTITY_ADMIN'],
  '/group': ['GROUP_ADMIN'],
  '/group/entities': ['GROUP_ADMIN'],
  '/group/gates': ['GROUP_ADMIN'],
  '/demo/erp-simulator': ['DEMO_OPERATOR'],
};
