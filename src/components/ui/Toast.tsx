import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { CheckCircle2, AlertCircle, Info, X } from '../icons';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Floating Toast Container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none items-center">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] shadow-2xl backdrop-blur-xl text-xs font-medium text-white max-w-sm"
            >
              <Icon
                icon={t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : Info}
                size={16}
                className={
                  t.type === 'success'
                    ? 'text-emerald-400'
                    : t.type === 'error'
                    ? 'text-red-400'
                    : 'text-indigo-400'
                }
              />
              <span className="leading-snug">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-2 text-slate-400 hover:text-white"
              >
                <Icon icon={X} size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
