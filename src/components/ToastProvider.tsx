'use client';
import { useState, useCallback, createContext, useContext, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};

type ToastContextType = {
  toast: (message: string, type?: ToastType, duration?: number) => void;
};

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} />,
  error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '#10b981' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: '#f87171' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '#f59e0b' },
  info:    { bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)', icon: '#60a5fa' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, type, message, duration }]);
    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — fixed top-right, above everything */}
      <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'none' }}>
        {toasts.map(t => {
          const c = COLORS[t.type];
          return (
            <div
              key={t.id}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '0.75rem 1rem 0.75rem 0.875rem', backdropFilter: 'blur(12px)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: '260px', maxWidth: '400px', pointerEvents: 'auto', animation: 'slideIn 0.2s ease-out' }}
            >
              <span style={{ color: c.icon, flexShrink: 0 }}>{ICONS[t.type]}</span>
              <span style={{ flex: 1, fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>{t.message}</span>
              <button onClick={() => dismiss(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '2px', display: 'flex', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </ToastContext.Provider>
  );
}
