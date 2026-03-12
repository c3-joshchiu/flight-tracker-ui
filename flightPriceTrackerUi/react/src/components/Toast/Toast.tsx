import { useCallback, useState } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let nextId = 0;

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return { toasts, show };
}

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-in rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${
            t.type === 'success'
              ? 'border border-toast-success-border bg-toast-success-bg text-toast-success-text'
              : 'border border-destructive/30 bg-red-50 text-destructive'
          }`}
        >
          <span className="mr-2">{t.type === 'success' ? '\u2713' : '\u2715'}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
