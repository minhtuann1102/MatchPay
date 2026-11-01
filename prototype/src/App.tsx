import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { RequireAuth, RequireRole } from './auth/Guards';
import { ROUTE_ROLES, homeOf } from './auth/nav';
import { useAuth } from './auth/AuthContext';
import { Login } from './pages/Login';
import { AccessDenied } from './pages/AccessDenied';
import { Placeholder } from './pages/Placeholder';
import { Invoices } from './pages/Invoices';
import { InvoiceDetailPage } from './pages/InvoiceDetail';
import { Recurring } from './pages/Recurring';
import { Mailbox } from './pages/Mailbox';
import { Batch } from './pages/Batch';
import { Notifications } from './pages/Notifications';
import { Acceptance } from './pages/Acceptance';
import { Decisions } from './pages/Decisions';
import { Signing } from './pages/Signing';
import { RequestDetailPage } from './pages/RequestDetail';
import { Delegations } from './pages/Delegations';
import { Dashboard } from './pages/Dashboard';
import { AuditLog } from './pages/AuditLog';
import { Users } from './pages/Users';
import { EntityPolicy } from './pages/EntityPolicy';
import { ApprovalMatrix } from './pages/ApprovalMatrix';
import { Group } from './pages/Group';
import { Entities } from './pages/Entities';
import { Gates } from './pages/Gates';
import { ErpSimulator } from './pages/ErpSimulator';
import { t } from './i18n/vi';

// Every route of 02-routes-and-permissions.md has a page; the placeholder stays as a fallback for a route without one.
const PAGES: Record<string, ReactElement> = {
  '/invoices': <Invoices />,
  '/invoices/:id': <InvoiceDetailPage />,
  '/recurring-profiles': <Recurring />,
  '/mailbox': <Mailbox />,
  '/batch': <Batch />,
  '/notifications': <Notifications />,
  '/acceptance': <Acceptance />,
  '/decisions': <Decisions />,
  '/signing': <Signing />,
  '/signing/requests/:id': <RequestDetailPage />,
  '/delegations': <Delegations />,
  '/dashboard': <Dashboard />,
  '/audit-log': <AuditLog />,
  '/users': <Users />,
  '/entity/policy': <EntityPolicy />,
  '/entity/approval-matrix': <ApprovalMatrix />,
  '/group': <Group />,
  '/group/entities': <Entities />,
  '/group/gates': <Gates />,
  '/demo/erp-simulator': <ErpSimulator />,
};

function Home() {
  const { session, ready } = useAuth();
  if (!ready) return null;
  return <Navigate to={session ? homeOf(session.role) : '/login'} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      {Object.entries(ROUTE_ROLES).map(([path, roles]) => (
        <Route
          key={path}
          path={path}
          element={
            <RequireAuth>
              <RequireRole roles={roles}>{PAGES[path] ?? <Placeholder title={t.screens[path] ?? path} />}</RequireRole>
            </RequireAuth>
          }
        />
      ))}
      <Route path="/403" element={<RequireAuth><AccessDenied /></RequireAuth>} />
      <Route path="*" element={<RequireAuth><AccessDenied /></RequireAuth>} />
    </Routes>
  );
}
