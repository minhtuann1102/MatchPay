import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense, type ReactElement } from 'react';
import { Loading } from './components/Async';
import { RequireAuth, RequireRole } from './auth/Guards';
import { ROUTE_ROLES, homeOf } from './auth/nav';
import { useAuth } from './auth/AuthContext';
import { Login } from './pages/Login';
import { AccessDenied } from './pages/AccessDenied';
import { Placeholder } from './pages/Placeholder';
const Invoices = lazy(() => import('./pages/Invoices').then((m) => ({ default: m.Invoices })));
const InvoiceDetailPage = lazy(() => import('./pages/InvoiceDetail').then((m) => ({ default: m.InvoiceDetailPage })));
const Recurring = lazy(() => import('./pages/Recurring').then((m) => ({ default: m.Recurring })));
const Mailbox = lazy(() => import('./pages/Mailbox').then((m) => ({ default: m.Mailbox })));
const Batch = lazy(() => import('./pages/Batch').then((m) => ({ default: m.Batch })));
const Notifications = lazy(() => import('./pages/Notifications').then((m) => ({ default: m.Notifications })));
const Acceptance = lazy(() => import('./pages/Acceptance').then((m) => ({ default: m.Acceptance })));
const Decisions = lazy(() => import('./pages/Decisions').then((m) => ({ default: m.Decisions })));
const Signing = lazy(() => import('./pages/Signing').then((m) => ({ default: m.Signing })));
const RequestDetailPage = lazy(() => import('./pages/RequestDetail').then((m) => ({ default: m.RequestDetailPage })));
const Delegations = lazy(() => import('./pages/Delegations').then((m) => ({ default: m.Delegations })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const AuditLog = lazy(() => import('./pages/AuditLog').then((m) => ({ default: m.AuditLog })));
const Users = lazy(() => import('./pages/Users').then((m) => ({ default: m.Users })));
const EntityPolicy = lazy(() => import('./pages/EntityPolicy').then((m) => ({ default: m.EntityPolicy })));
const ApprovalMatrix = lazy(() => import('./pages/ApprovalMatrix').then((m) => ({ default: m.ApprovalMatrix })));
const Group = lazy(() => import('./pages/Group').then((m) => ({ default: m.Group })));
const Entities = lazy(() => import('./pages/Entities').then((m) => ({ default: m.Entities })));
const Gates = lazy(() => import('./pages/Gates').then((m) => ({ default: m.Gates })));
const ErpSimulator = lazy(() => import('./pages/ErpSimulator').then((m) => ({ default: m.ErpSimulator })));
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
    <Suspense fallback={<Loading rows={8} />}>
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
    </Suspense>
  );
}
