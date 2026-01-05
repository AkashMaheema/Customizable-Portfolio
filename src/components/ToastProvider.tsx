"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = Omit<Toast, "id"> & { durationMs?: number };

type ToastContextValue = {
  show: (toast: ToastInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function ToastCard({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: (id: string) => void;
}) {
  const variantStyles =
    toast.variant === "success"
      ? "border-emerald-200"
      : toast.variant === "error"
      ? "border-red-200"
      : "border-zinc-200";

  const dotStyles =
    toast.variant === "success"
      ? "bg-emerald-500"
      : toast.variant === "error"
      ? "bg-red-500"
      : "bg-zinc-400";

  return (
    <div
      role="status"
      className={`w-[320px] rounded-2xl border bg-white p-4 shadow-sm ${variantStyles}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dotStyles}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-950">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-sm text-zinc-600">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={() => onClose(toast.id)}
          className="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const close = useCallback((id: string) => {
    const t = timers.current[id];
    if (t) {
      window.clearTimeout(t);
      delete timers.current[id];
    }
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    ({ durationMs, ...input }: ToastInput) => {
      const id = uid();
      const toast: Toast = { id, ...input };

      setToasts((prev) => [toast, ...prev].slice(0, 3));

      const timeout = window.setTimeout(
        () => close(id),
        typeof durationMs === "number" ? durationMs : 3200
      );
      timers.current[id] = timeout;
    },
    [close]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (title, description) =>
        show({ title, description, variant: "success" }),
      error: (title, description) =>
        show({ title, description, variant: "error" }),
      info: (title, description) =>
        show({ title, description, variant: "info" }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 grid gap-2">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={close} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
}
