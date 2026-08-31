"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { BellIcon } from "@/components/ui/icon";

type ToastItem = {
  id: string;
  message: string;
};

type ToastContextValue = {
  toast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastEntry({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border border-teal-950/10 bg-white px-4 py-3 text-sm text-slate-800 shadow-lg shadow-teal-950/10 animate-[toast-in_0.2s_ease-out]"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
        <BellIcon size={16} />
      </span>
      <span>{message}</span>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
      >
        {toasts.map((item) => (
          <ToastEntry
            key={item.id}
            message={item.message}
            onDismiss={() => dismiss(item.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
