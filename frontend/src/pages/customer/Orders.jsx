import { Eye } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loading from '../../components/common/Loading.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import api from '../../services/api.js';
import { money, recordId } from '../../utils/records.js';

export default function Orders() {
  const [orders, setOrders] = useState([]); const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [query, setQuery] = useState(''); const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders', { params: { page, limit: 10, search: query || undefined, status: status || undefined } });
      setOrders(Array.isArray(response.data.data) ? response.data.data : []); setPagination(response.data.pagination || { page, pages: 0, total: 0 }); setError('');
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load your orders.'); }
    finally { setLoading(false); }
  }, [page, query, status]);
  useEffect(() => { load(); }, [load]);

  return <div><div className="page-heading"><div><h1 className="text-2xl font-bold">My Orders</h1><p className="page-subtitle">View your orders and current statuses.</p></div></div>
    <form onSubmit={event => { event.preventDefault(); setPage(1); setQuery(search.trim()); }} className="mt-6 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-[1fr_auto_auto]"><input value={search} onChange={event => setSearch(event.target.value)} className="rounded-lg border px-4 py-2.5 text-sm" placeholder="Search order, tracking, or recipient"/><select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className="rounded-lg border px-3 text-sm"><option value="">All statuses</option>{['Pending', 'Confirmed', 'Assigned', 'In Transit', 'Delivered', 'Failed', 'Cancelled'].map(value => <option key={value}>{value}</option>)}</select><Button type="submit">Search</Button></form>
    {loading ? <Loading label="Loading orders..."/> : error ? <div className="mt-6"><ErrorState message={error} onRetry={load}/></div> : <div className="table-shell mt-6"><table className="min-w-[850px]"><thead><tr>{['Order ID', 'Tracking Number', 'Recipient', 'Amount', 'Payment', 'Status', 'Created', 'Actions'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{orders.map(order => { const id = recordId(order); const orderStatus = order.orderStatus || order.status || 'Pending'; const paymentStatus = order.paymentStatus || 'Pending'; return <tr key={id || order.orderId || order.orderNumber}><td className="font-semibold">{order.orderId || order.orderNumber || '—'}</td><td>{order.trackingNumber || '—'}</td><td>{order.recipientName || '—'}</td><td className="font-semibold">{money(order.totalAmount ?? order.amount ?? order.deliveryFee)}</td><td><Badge tone={String(paymentStatus).toLowerCase() === 'paid' ? 'success' : 'warning'}>{paymentStatus}</Badge></td><td><OrderStatusBadge status={orderStatus}/></td><td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</td><td><Link title="View" className="text-blue-600" to={`/customer/orders/${id}`}><Eye size={18}/></Link></td></tr>; })}</tbody></table>{!orders.length && <p className="p-8 text-center text-sm text-slate-500">You have no matching orders.</p>}<div className="flex flex-wrap justify-between gap-3 border-t p-4 text-sm text-slate-500"><span>{pagination.total || 0} results · Page {pagination.page || page} of {Math.max(pagination.pages || 0, 1)}</span><div className="flex gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>Previous</Button><Button variant="secondary" disabled={page >= (pagination.pages || 0)} onClick={() => setPage(current => current + 1)}>Next</Button></div></div></div>}
  </div>;
}
