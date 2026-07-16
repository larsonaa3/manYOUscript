import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export type ToastVariant = "info" | "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 3000;

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextIdRef.current++;
    setToasts((current) => [...current, { id, message, variant }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, DEFAULT_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="myc-toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`myc-toast myc-toast--${toast.variant}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast() must be used within a <ToastProvider>");
  }
  return ctx;
}
