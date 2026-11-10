import { useState } from 'react';
import Button from '../common/Button.jsx';

export default function PaymentActionModal({ action, payment, loading, onClose, onConfirm }) {
  const [value, setValue] = useState('');
  if (!action) return null;
  const needsInput = action === 'failed' || action === 'refund';
  const title = action === 'paid' ? 'Mark Payment Paid' : action === 'failed' ? 'Mark Payment Failed' : 'Refund Payment';
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 text-sm text-slate-500">Payment {payment.paymentId} · ${Number(payment.amount || 0).toFixed(2)}</p>{action === 'paid' && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><p className="font-semibold">This will generate a paid receipt.</p><p className="mt-1">The payment status will change to Paid and the transaction details will be saved.</p></div>}{needsInput && <input type={action === 'refund' ? 'number' : 'text'} min="0.01" max={payment.amount} step="0.01" value={value} onChange={e => setValue(e.target.value)} className="mt-5 w-full rounded-lg border p-3 text-sm" placeholder={action === 'refund' ? 'Refund amount' : 'Failure reason'} /> }<div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={loading || (needsInput && !String(value).trim())} onClick={() => onConfirm(value)}>{loading ? 'Updating…' : 'Confirm'}</Button></div></div></div>;
}
