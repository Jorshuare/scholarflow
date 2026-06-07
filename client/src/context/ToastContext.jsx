import { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext(null);

const CONFIG = {
  success: { bar: 'bg-emerald-500', icon: '✓', iconBg: 'bg-emerald-50 text-emerald-600' },
  error:   { bar: 'bg-red-500',     icon: '✕', iconBg: 'bg-red-50 text-red-600'         },
  warn:    { bar: 'bg-amber-400',   icon: '!', iconBg: 'bg-amber-50 text-amber-600'      },
  info:    { bar: 'bg-[#002868]',   icon: 'i', iconBg: 'bg-blue-50 text-[#002868]'       },
};

let _uid = 0;

function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map(t => {
        const c = CONFIG[t.type] ?? CONFIG.info;
        return (
          <div
            key={t.id}
            className="flex items-start bg-white border border-[#E4E7EF] rounded-xl shadow-lg overflow-hidden toast-enter pointer-events-auto"
          >
            <div className={`w-1 self-stretch shrink-0 ${c.bar}`} />
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-3 ml-3 ${c.iconBg}`}>
              {c.icon}
            </div>
            <p className="text-sm text-gray-700 py-3 px-3 flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-300 hover:text-gray-500 mt-2.5 mr-3 text-lg leading-none transition-colors shrink-0"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((type, message, duration = 4000) => {
    const id = ++_uid;
    setToasts(prev => [...prev.slice(-2), { id, type, message }]); // max 3 visible
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const toast = {
    success: msg => push('success', msg),
    error:   msg => push('error',   msg, 6000), // errors stay longer
    warn:    msg => push('warn',    msg),
    info:    msg => push('info',    msg),
  };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
