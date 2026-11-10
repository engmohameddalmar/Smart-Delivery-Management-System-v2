import { Eye } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loading from '../../components/common/Loading.jsx';
import Toast from '../../components/common/Toast.jsx';
import PaymentActionModal from '../../components/payments/PaymentActionModal.jsx';
import PaymentStatusBadge from '../../components/payments/PaymentStatusBadge.jsx';
import api from '../../services/api.js';

export default function Payments() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', query: '', status: '', date: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/payments', { params: { page, limit: 10, search: filters.query || undefined, status: filters.status || undefined, date: filters.date || undefined } })
      .then(r => { setData(r.data.data || []); setPagination(r.data.pagination || {}); setError(''); })
      .catch(err => setError(err.response?.data?.message || 'Unable to load payments.'))
      .finally(() => setLoading(false));
  }, [page, filters.query, filters.status, filters.date]);

  useEffect(load, [load]);

  const submitAction = async value => {
    setSaving(true);
    try {
      const body = action.type === 'failed'
        ? { failureReason: value }
        : action.type === 'refund'
          ? { refundAmount: Number(value) }
          : action.type === 'paid'
            ? { transactionId: value || undefined }
            : {};
      await api.patch(`/payments/${action.payment._id}/${action.type}`, body);
      setToast({ message: action.type === 'paid' ? 'Payment marked as paid. Receipt generated.' : 'Payment updated successfully.' });
      setAction(null);
      load();
    } catch (err) {
      setToast({ tone: 'error', message: err.response?.data?.message || 'Unable to update payment.' });
      setAction(null);
    } finally {
      setSaving(false);
    }
  };

  return <div>
    <Toast {...toast} onClose={() => setToast(null)} />
    <h1 className="text-2xl font-extrabold">Payments</h1>
    <p className="mt-1 text-sm text-slate-500">Delivery-service online payments only.</p>
    <form onSubmit={e => { e.preventDefault(); setPage(1); setFilters(f => ({ ...f, query: f.search.trim() })); }} className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 lg:grid-cols-4">
      <input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} className="rounded-lg border px-3 py-2.5 text-sm lg:col-span-2" placeholder="Payment, order, transaction, customer, business" />
      <select value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }} className="rounded-lg border px-3 text-sm"><option value="">All statuses</option>{['Pending', 'Paid', 'Failed', 'Cancelled', 'Refunded'].map(x => <option key={x}>{x}</option>)}</select>
      <input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} className="rounded-lg border px-3 text-sm" />
      <Button type="submit">Search</Button>
    </form>

    {loading ? <Loading label="Loading payments…" /> : error ? <div className="mt-6"><ErrorState message={error} /></div> : <div className="mt-6 overflow-hidden rounded-2xl border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Payment ID', 'Order ID', 'Business', 'Customer', 'Amount', 'Method', 'Status', 'Transaction ID', 'Paid At', 'Created', 'Actions'].map(x => <th className="px-4 py-3" key={x}>{x}</th>)}</tr></thead><tbody>{data.map(p => <tr className="border-t" key={p._id}><td className="px-4 py-4 font-semibold">{p.paymentId}</td><td className="px-4 py-4">{p.order?.orderId}</td><td className="px-4 py-4">{p.business?.name || '—'}</td><td className="px-4 py-4">{p.customer?.name || p.order?.customerName || '—'}</td><td className="px-4 py-4 font-semibold">${Number(p.amount || 0).toFixed(2)}</td><td className="px-4 py-4">Online</td><td className="px-4 py-4"><PaymentStatusBadge status={p.status} /></td><td className="px-4 py-4 text-slate-500">{p.transactionId || '—'}</td><td className="px-4 py-4">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</td><td className="px-4 py-4">{new Date(p.createdAt).toLocaleDateString()}</td><td className="px-4 py-4"><div className="flex gap-2"><Link to={`/admin/payments/${p._id}`} className="text-indigo-600"><Eye size={18} /></Link>{p.status === 'Pending' && <button onClick={() => setAction({ type: 'paid', payment: p })} className="text-xs font-semibold text-emerald-700">Mark Paid</button>}{p.status === 'Pending' && <button onClick={() => setAction({ type: 'failed', payment: p })} className="text-xs font-semibold text-red-600">Fail</button>}{p.status === 'Paid' && <button onClick={() => setAction({ type: 'refund', payment: p })} className="text-xs font-semibold text-indigo-600">Refund</button>}</div></td></tr>)}</tbody></table></div><div className="flex justify-between border-t p-4 text-sm text-slate-500"><span>{pagination.total || 0} results · Page {pagination.page || page} of {Math.max(pagination.pages || 0, 1)}</span><div className="flex gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button><Button variant="secondary" disabled={page >= (pagination.pages || 0)} onClick={() => setPage(p => p + 1)}>Next</Button></div></div></div>}

    <PaymentActionModal action={action?.type} payment={action?.payment} loading={saving} onClose={() => setAction(null)} onConfirm={submitAction} />
  </div>;
}
