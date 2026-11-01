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
import { t } from './i18n/vi';

// Phase 1 pages are real; every other route of 02-routes-and-permissions.md renders a placeholder.
const PAGES: Record<string, ReactElement> = {
  '/invoices': <Invoices />,
  '/invoices/:id': <InvoiceDetailPage />,
  '/recurring-profiles': <Recurring />,
  '/mailbox': <Mailbox />,
  '/batch': <Batch />,
  '/notifications': <Notifications />,
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
