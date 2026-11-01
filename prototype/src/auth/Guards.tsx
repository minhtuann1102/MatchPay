import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '../api/types';
import { useAuth } from './AuthContext';
import { AccessDenied } from '../pages/AccessDenied';
import { Shell } from '../components/Shell';

/** Signed-out users go to /login (AC-01.4). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, ready, ended } = useAuth();
  const loc = useLocation();
  if (!ready) return null;
  if (!session) return <Navigate to="/login" replace state={{ ended, from: loc.pathname }} />;
  return <Shell>{children}</Shell>;
}

/** A page the role may not open shows SCR-90 in its place (AC-01.6). */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { session } = useAuth();
  if (!session || !roles.includes(session.role)) return <AccessDenied />;
  return <>{children}</>;
}
