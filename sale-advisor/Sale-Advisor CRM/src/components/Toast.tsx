"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {toasts.map((t) => (
          <ToastNotification key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastNotification({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), 4000);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  const colors = {
    success: { bg: "var(--green-bg)", border: "var(--green)", color: "var(--green)" },
    error: { bg: "var(--red-bg)", border: "var(--red)", color: "var(--red)" },
    info: { bg: "var(--blue-bg)", border: "var(--blue)", color: "var(--blue)" },
  };
  const c = colors[item.type];

  return (
    <div
      onClick={() => onDismiss(item.id)}
      style={{
        padding: "12px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer",
        background: c.bg, borderLeft: `3px solid ${c.border}`, color: c.color,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)", minWidth: 240, maxWidth: 400,
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      {item.message}
    </div>
  );
}
