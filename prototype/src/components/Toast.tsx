import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

type Push = (text: string) => void;
const Ctx = createContext<Push>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const push = useCallback((text: string) => {
    setMsg({ id: Date.now(), text });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 4500);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" role="status">
        {msg && (
          <div className="toast" key={msg.id}>
            <Icon name="check" />
            <span>{msg.text}</span>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = (): Push => useContext(Ctx);
