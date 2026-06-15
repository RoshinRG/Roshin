import { useState, useCallback } from 'react';

/**
 * Toast notification component.
 * Exposes a `showToast` function via render-prop pattern or can be controlled via props.
 */
export function useToast() {
  const [toast, setToast] = useState({ visible: false, message: '', isError: false });

  const showToast = useCallback((message, isError = false) => {
    setToast({ visible: true, message, isError });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4000);
  }, []);

  return { toast, showToast };
}

export default function Toast({ visible, message, isError }) {
  const className = [
    'toast',
    visible ? 'toast--visible' : '',
    isError ? 'toast--error' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={className} id="toast" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
