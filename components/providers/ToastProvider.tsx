"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastKind = "success" | "error";
type ToastItem = { id: number; message: string; kind: ToastKind };

const ToastContext = createContext<{ showToast: (message: string, kind?: ToastKind) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now();
    setToasts((items) => [...items, { id, message, kind }]);
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[80] grid w-[calc(100%-2rem)] max-w-sm gap-2" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = toast.kind === "success" ? CheckCircle2 : AlertCircle;
          return (
            <div key={toast.id} className="flex items-center gap-3 rounded-lg border border-sinner-gold/25 bg-black/90 px-4 py-3 text-sm text-white shadow-card backdrop-blur-xl">
              <Icon size={18} className={toast.kind === "success" ? "text-emerald-300" : "text-red-300"} />
              <span className="min-w-0 flex-1">{toast.message}</span>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification" className="text-sinner-mist hover:text-white">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

