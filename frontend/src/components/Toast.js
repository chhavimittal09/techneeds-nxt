'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from './Icons';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 ${
              t.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/30 text-white'
                : t.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/30 text-white'
                : 'bg-slate-900/95 border-indigo-500/30 text-white'
            }`}
          >
            <div className="shrink-0">
              {t.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400" />}
              {t.type === 'error' && <AlertCircle size={18} className="text-rose-400" />}
              {t.type === 'info' && <Info size={18} className="text-indigo-400" />}
            </div>
            <p className="text-xs font-medium flex-1">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { toast: (msg) => console.log(msg) };
  }
  return context;
}
