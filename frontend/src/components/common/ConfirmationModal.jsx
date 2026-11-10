import { useEffect, useId, useRef } from 'react';

export default function ConfirmationModal({ open, title, message, confirmLabel = 'Confirm', danger = false, loading = false, onCancel, onConfirm }) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const handleKeyDown = (event) => { if (event.key === 'Escape' && !loading) onCancel(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}><h2 id={titleId} className="text-lg font-bold">{title}</h2><p id={descriptionId} className="mt-3 text-sm leading-6 text-slate-600">{message}</p><div className="mt-6 flex justify-end gap-3"><button ref={cancelRef} type="button" disabled={loading} onClick={onCancel} className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60">Cancel</button><button type="button" disabled={loading} onClick={onConfirm} className={`rounded-lg px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{loading ? 'Please wait…' : confirmLabel}</button></div></div></div>;
}
