import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, Flame } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, type, title, message, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const success = useCallback((title, message, duration) => {
    return addToast({ type: 'success', title, message, duration });
  }, [addToast]);

  const error = useCallback((title, message, duration) => {
    return addToast({ type: 'error', title, message, duration: duration || 6000 });
  }, [addToast]);

  const warning = useCallback((title, message, duration) => {
    return addToast({ type: 'warning', title, message, duration });
  }, [addToast]);

  const info = useCallback((title, message, duration) => {
    return addToast({ type: 'info', title, message, duration });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      
      {/* Toast Notification Container in RTL */}
      <div dir="rtl" className="fixed bottom-6 left-6 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none font-cairo">
        <AnimatePresence>
          {toasts.map((toast) => {
            const icons = {
              success: <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />,
              error: <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
              warning: <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />,
              info: <Flame className="w-5 h-5 text-amber-400 flex-shrink-0" />,
            };

            const borderColors = {
              success: 'border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.25)]',
              error: 'border-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.2)]',
              warning: 'border-yellow-500/30',
              info: 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
            };

            const bgAccents = {
              success: 'from-amber-500/15 via-zinc-950/95 to-zinc-950',
              error: 'from-rose-500/15 via-zinc-950/95 to-zinc-950',
              warning: 'from-yellow-500/15 via-zinc-950/95 to-zinc-950',
              info: 'from-amber-500/10 via-zinc-950/95 to-zinc-950',
            };

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: -20, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-gradient-to-l ${bgAccents[toast.type]} backdrop-blur-xl border ${borderColors[toast.type]} p-4 shadow-2xl flex items-start gap-3`}
              >
                {/* Glow bar on right edge for RTL */}
                <div
                  className={`absolute right-0 top-0 bottom-0 w-1.5 ${
                    toast.type === 'success'
                      ? 'bg-gradient-to-b from-amber-400 to-amber-600'
                      : toast.type === 'error'
                      ? 'bg-rose-500'
                      : toast.type === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-amber-500'
                  }`}
                />

                <div className="mt-0.5">{icons[toast.type]}</div>

                <div className="flex-1 min-w-0 pl-2">
                  {toast.title && (
                    <h4 className="text-sm font-bold text-white tracking-wide font-cairo">
                      {toast.title}
                    </h4>
                  )}
                  {toast.message && (
                    <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed break-words font-cairo">
                      {toast.message}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Animated auto-dismiss progress bar */}
                {toast.duration > 0 && (
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: toast.duration / 1000, ease: 'linear' }}
                    className={`absolute bottom-0 right-0 h-0.5 ${
                      toast.type === 'success'
                        ? 'bg-amber-400/80'
                        : toast.type === 'error'
                        ? 'bg-rose-500/80'
                        : toast.type === 'warning'
                        ? 'bg-yellow-500/80'
                        : 'bg-amber-400/80'
                    }`}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
