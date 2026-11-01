import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '../api/types';
import { getSessionUserId, subscribeSession } from '../api/client';
import { getSession, login as apiLogin, logout as apiLogout } from '../api/reporting';

interface Auth {
  session: Session | null;
  ready: boolean;
  /** True when the session ended while the user was signed in. */
  ended: boolean;
  signIn: (userId: string) => Promise<Session>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [ended, setEnded] = useState(false);

  const refresh = useCallback(async () => {
    const s = await getSession();
    setSession((prev) => {
      if (prev && !s) setEnded(true);
      return s;
    });
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
    return subscribeSession(() => void refresh());
  }, [refresh]);

  const signIn = useCallback(async (userId: string) => {
    const s = await apiLogin(userId);
    setEnded(false);
    setSession(s);
    return s;
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();
    setEnded(false);
    setSession(null);
  }, []);

  return <Ctx.Provider value={{ session, ready, ended, signIn, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth(): Auth {
  const c = useContext(Ctx);
  if (!c) throw new Error('AuthProvider missing');
  return c;
}

export const currentUserId = getSessionUserId;
