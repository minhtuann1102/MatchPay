import type { Role } from '../api/types';
import type { ReactNode } from 'react';
import {
  AuditOutlined, BankOutlined, BarChartOutlined, BellOutlined, ApiOutlined, CheckSquareOutlined, ClusterOutlined, ContainerOutlined, EditOutlined,
  FileTextOutlined, MailOutlined, SettingOutlined, SwapOutlined, SyncOutlined, TableOutlined, TeamOutlined, UnlockOutlined, ScheduleOutlined,
} from '@ant-design/icons';
import { t } from '../i18n/vi';

export interface NavItem {
  id: string;
  to: string;
  label: string;
  icon: ReactNode;
  /** Which count the badge shows. */
  badge?: 'needs' | 'decisions' | 'signing' | 'acceptance' | 'gateAlerts';
}

// Sidebar items per role: docs/03-information-architecture/03-navigation.md and wireframes/assets/states.js.
export const NAV: Record<Role, NavItem[]> = {
  AP_ACCOUNTANT: [
    { id: 'invoices', to: '/invoices', label: t.nav.invoices, icon: <FileTextOutlined />, badge: 'needs' },
    { id: 'batch', to: '/batch', label: t.nav.batch, icon: <ContainerOutlined /> },
    { id: 'mailbox', to: '/mailbox', label: t.nav.mailbox, icon: <MailOutlined /> },
    { id: 'recurring', to: '/recurring-profiles', label: t.nav.recurring, icon: <SyncOutlined /> },
    { id: 'notifications', to: '/notifications', label: t.nav.notifications, icon: <BellOutlined /> },
    { id: 'dashboard', to: '/dashboard', label: t.nav.dashboard, icon: <BarChartOutlined /> },
  ],
  CHIEF_ACCOUNTANT: [
    { id: 'decisions', to: '/decisions', label: t.nav.decisionsChief, icon: <AuditOutlined />, badge: 'decisions' },
    { id: 'signing', to: '/signing', label: t.nav.signing, icon: <EditOutlined />, badge: 'signing' },
    { id: 'delegations', to: '/delegations', label: t.nav.delegations, icon: <SwapOutlined /> },
    { id: 'invoices', to: '/invoices', label: t.nav.invoices, icon: <FileTextOutlined /> },
    { id: 'notifications', to: '/notifications', label: t.nav.notifications, icon: <BellOutlined /> },
    { id: 'dashboard', to: '/dashboard', label: t.nav.dashboard, icon: <BarChartOutlined /> },
    { id: 'audit', to: '/audit-log', label: t.nav.audit, icon: <ScheduleOutlined /> },
  ],
  PAYMENT_APPROVER: [
    { id: 'signing', to: '/signing', label: t.nav.signing, icon: <EditOutlined />, badge: 'signing' },
    { id: 'decisions', to: '/decisions', label: t.nav.decisionsApprover, icon: <CheckSquareOutlined />, badge: 'decisions' },
    { id: 'delegations', to: '/delegations', label: t.nav.delegations, icon: <SwapOutlined /> },
    { id: 'invoices', to: '/invoices', label: t.nav.invoices, icon: <FileTextOutlined /> },
    { id: 'notifications', to: '/notifications', label: t.nav.notifications, icon: <BellOutlined /> },
    { id: 'dashboard', to: '/dashboard', label: t.nav.dashboard, icon: <BarChartOutlined /> },
  ],
  REQUESTING_DEPARTMENT: [{ id: 'acceptance', to: '/acceptance', label: t.nav.acceptance, icon: <CheckSquareOutlined />, badge: 'acceptance' }],
  ENTITY_ADMIN: [
    { id: 'policy', to: '/entity/policy', label: t.nav.policy, icon: <SettingOutlined /> },
    { id: 'matrix', to: '/entity/approval-matrix', label: t.nav.matrix, icon: <TableOutlined /> },
    { id: 'users', to: '/users', label: t.nav.users, icon: <TeamOutlined /> },
    { id: 'delegations', to: '/delegations', label: t.nav.delegations, icon: <SwapOutlined /> },
    { id: 'dashboard', to: '/dashboard', label: t.nav.dashboard, icon: <BarChartOutlined /> },
    { id: 'audit', to: '/audit-log', label: t.nav.audit, icon: <ScheduleOutlined /> },
  ],
  GROUP_ADMIN: [
    { id: 'group', to: '/group', label: t.nav.group, icon: <ClusterOutlined /> },
    { id: 'gates', to: '/group/gates', label: t.nav.gates, icon: <UnlockOutlined />, badge: 'gateAlerts' },
    { id: 'entities', to: '/group/entities', label: t.nav.entities, icon: <BankOutlined /> },
    { id: 'users', to: '/users', label: t.nav.users, icon: <TeamOutlined /> },
    { id: 'dashboard', to: '/dashboard', label: t.nav.dashboard, icon: <BarChartOutlined /> },
    { id: 'audit', to: '/audit-log', label: t.nav.audit, icon: <ScheduleOutlined /> },
  ],
  DEMO_OPERATOR: [{ id: 'erp', to: '/demo/erp-simulator', label: t.nav.erp, icon: <ApiOutlined /> }],
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
