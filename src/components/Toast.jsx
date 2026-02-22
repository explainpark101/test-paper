import React, { useEffect, useState } from 'react';

/**
 * Single toast item. Must include aria-live="polite" for screen readers.
 * variant: 'default' | 'error' (error = red/danger style)
 */
function ToastItem({ id, message, onDismiss, duration = 3000, variant = 'default' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(show);
  }, []);

  useEffect(() => {
    if (duration <= 0) return;
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(id), 200);
    }, duration);
    return () => clearTimeout(t);
  }, [id, duration, onDismiss]);

  const isError = variant === 'error';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`min-w-[200px] max-w-[360px] px-4 py-3 rounded-xl shadow-lg text-sm transition-all duration-200 ${
        isError
          ? 'border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-200'
          : 'border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100'
      } ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
    >
      {message}
    </div>
  );
}

/**
 * Container for toasts. Renders at bottom-right. Each toast has aria-live="polite".
 */
export default function Toast({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none"
      aria-label="알림"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem
            id={t.id}
            message={t.message}
            onDismiss={onDismiss}
            duration={t.duration ?? 3000}
            variant={t.variant ?? 'default'}
          />
        </div>
      ))}
    </div>
  );
}
