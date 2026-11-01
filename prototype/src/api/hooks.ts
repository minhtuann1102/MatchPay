// TanStack Query hooks over the mock API. Every mutation invalidates all queries (see lib/useAction), so a change shows on every screen.
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { InvoiceQuery } from './types';
import * as inv from './invoices';
import * as batch from './batch';
import * as rec from './recurring';
import * as acc from './acceptance';
import * as mb from './mailbox';
import * as dec from './decisions';
import * as sign from './signing';
import * as rep from './reporting';
import * as adm from './admin';
import * as sim from './sim';
import { getSessionUserId } from './client';

// The session id is part of every key, so a persona switch never shows another persona's cache.
const sid = () => getSessionUserId();

export const useWorklistSummary = () => useQuery({ queryKey: ['worklistSummary', sid()], queryFn: inv.getWorklistSummary });
export const useInvoices = (q: InvoiceQuery) => useQuery({ queryKey: ['invoices', sid(), q], queryFn: () => inv.listInvoices(q), placeholderData: keepPreviousData });
export const useInvoice = (id: string) => useQuery({ queryKey: ['invoice', sid(), id], queryFn: () => inv.getInvoice(id), retry: false });
export const useSuppliers = () => useQuery({ queryKey: ['suppliers', sid()], queryFn: inv.listSuppliers });
export const useTemplates = () => useQuery({ queryKey: ['templates', sid()], queryFn: inv.listMessageTemplates });
export const useErpSync = () => useQuery({ queryKey: ['erpSync', sid()], queryFn: adm.getErpSyncStatus });

export const useProfiles = () => useQuery({ queryKey: ['profiles', sid()], queryFn: () => rec.listRecurringProfiles() });
export const useAcceptanceQueue = (q: { supplierId?: string; dueSoon?: boolean }) => useQuery({ queryKey: ['acceptance', sid(), q], queryFn: () => acc.listAcceptanceQueue(q) });

export const useMailboxStatus = () => useQuery({ queryKey: ['mailboxStatus', sid()], queryFn: mb.getMailboxStatus });
export const useMailboxMessages = () => useQuery({ queryKey: ['mailboxMessages', sid()], queryFn: mb.listMailboxMessages });

export const useBatchList = () => useQuery({ queryKey: ['batches', sid()], queryFn: batch.listBatches });
export const useBatch = (id: string | null) => useQuery({ queryKey: ['batch', sid(), id], queryFn: () => (id ? batch.getBatch(id) : batch.getCurrentBatch()), retry: false });

export const useDecisionQueue = () => useQuery({ queryKey: ['decisions', sid()], queryFn: dec.getDecisionQueue });
export const useRequests = () => useQuery({ queryKey: ['requests', sid()], queryFn: () => sign.listPaymentRequests() });
export const useRequest = (id: string) => useQuery({ queryKey: ['request', sid(), id], queryFn: () => sign.getPaymentRequest(id), retry: false });
export const useDelegations = () => useQuery({ queryKey: ['delegations', sid()], queryFn: sign.listDelegations });

export const useNotifications = (unreadOnly: boolean) => useQuery({ queryKey: ['notifications', sid(), unreadOnly], queryFn: () => rep.listNotifications({ unreadOnly }) });
export const useUnreadCount = () => useQuery({ queryKey: ['unread', sid()], queryFn: rep.getUnreadNotificationCount, refetchInterval: 15000 });
export const useDashboard = (period: string) => useQuery({ queryKey: ['dashboard', sid(), period], queryFn: () => rep.getDashboard({ period }) });
export const useGroupDashboard = (period: string) => useQuery({ queryKey: ['groupDashboard', sid(), period], queryFn: () => rep.getGroupDashboard({ period }) });
export const useAudit = (q: rep.AuditQuery) => useQuery({ queryKey: ['audit', sid(), q], queryFn: () => rep.listAuditEntries(q), placeholderData: keepPreviousData });

export const useUsers = (q: { entityId?: string; role?: string }) => useQuery({ queryKey: ['users', sid(), q], queryFn: () => adm.listUsers(q as never) });
export const usePolicy = () => useQuery({ queryKey: ['policy', sid()], queryFn: adm.getEntityPolicy });
export const useMatrix = () => useQuery({ queryKey: ['matrix', sid()], queryFn: adm.getApprovalMatrix });
export const useGroup = () => useQuery({ queryKey: ['group', sid()], queryFn: adm.getGroup });
export const useEntities = () => useQuery({ queryKey: ['entities', sid()], queryFn: adm.listEntities });
export const useGates = () => useQuery({ queryKey: ['gates', sid()], queryFn: adm.listGates });
export const useGroupOverview = () => useQuery({ queryKey: ['groupOverview', sid()], queryFn: rep.getGroupOverview });

export const useSimMaster = () => useQuery({ queryKey: ['simMaster', sid()], queryFn: sim.getSimMasterData });
export const useSimOrders = (entityId: string) => useQuery({ queryKey: ['simOrders', sid(), entityId], queryFn: () => sim.listSimPurchaseOrders(entityId) });
export const useSimReceipts = (entityId: string) => useQuery({ queryKey: ['simReceipts', sid(), entityId], queryFn: () => sim.listSimReceipts(entityId) });
