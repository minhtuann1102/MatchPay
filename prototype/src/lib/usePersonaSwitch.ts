import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { homeOf } from '../auth/nav';
import { setForced } from '../api/client';
import { listPersonas } from '../api/reporting';

/** Switch the signed-in persona (Demo Operator idea, D-12): signs in as the other persona and goes to its home page. */
export function usePersonaSwitch() {
  const { session, signIn } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const personas = useQuery({ queryKey: ['personas'], queryFn: listPersonas });
  const switchTo = async (id: string) => {
    const s = await signIn(id);
    await qc.invalidateQueries();
    setForced('none');
    nav(homeOf(s.role));
  };
  return { personas: personas.data ?? [], current: session?.userId ?? null, switchTo };
}
