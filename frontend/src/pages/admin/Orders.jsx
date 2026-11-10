import { Eye, Pencil } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import ConfirmationModal from '../../components/common/ConfirmationModal.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loading from '../../components/common/Loading.jsx';
import Toast from '../../components/common/Toast.jsx';
import CancelOrderModal from '../../components/orders/CancelOrderModal.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import api from '../../services/api.js';
import { money, recordId } from '../../utils/records.js';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', query: '', status: '', paymentStatus: '', customer: '', date: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState(null);
  const [mutating, setMutating] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders', { params: { page, limit: 10, search: filters.query || undefined, status: filters.status || undefined, paymentStatus: filters.paymentStatus || undefined, customer: filters.customer || undefined, date: filters.date || undefined } });
      setOrders(Array.isArray(response.data.data) ? response.data.data : []);
      setPagination(response.data.pagination || { page, pages: 0, total: 0 });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load orders.');
    } finally { setLoading(false); }
  }, [page, filters.query, filters.status, filters.paymentStatus, filters.customer, filters.date]);

  useEffect(() => {
    load();
    api.get('/users', { params: { role: 'customer', limit: 100 } }).then(response => setCustomers(Array.isArray(response.data.data) ? response.data.data : [])).catch(() => {});
  }, [load]);

  const setFilter = (key, value) => { setFilters(current => ({ ...current, [key]: value })); setPage(1); };
  const confirm = async reason => {
    setMutating(true);
    try {
      if (action.type === 'confirm') await api.patch(`/orders/${action.order.id}/confirm`);
      else await api.patch(`/orders/${action.order.id}/cancel`, { reason });
      setToast({ message: `Order ${action.type === 'confirm' ? 'confirmed' : 'cancelled'} successfully.` });
      setAction(null); await load();
    } catch (err) {
      setToast({ tone: 'error', message: err.response?.data?.message || 'Unable to update order.' }); setAction(null);
    } finally { setMutating(false); }
  };

  return <div>
    <Toast {...toast} onClose={() => setToast(null)}/>
    <div className="page-heading"><div><h1 className="text-2xl font-bold">Orders</h1><p className="page-subtitle">Search, review, and manage delivery orders.</p></div></div>
    <form onSubmit={event => { event.preventDefault(); setFilter('query', filters.search.trim()); }} className="mt-6 grid gap-3 rounded-xl border bg-white p-4 shadow-sm lg:grid-cols-6">
      <input className="rounded-lg border px-3 py-2.5 text-sm lg:col-span-2" value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} placeholder="Order, tracking, customer, recipient"/>
      <select value={filters.status} onChange={event => setFilter('status', event.target.value)} className="rounded-lg border px-3 text-sm"><option value="">All statuses</option>{['Pending', 'Confirmed', 'Assigned', 'In Transit', 'Delivered', 'Failed', 'Cancelled'].map(status => <option key={status}>{status}</option>)}</select>
      <select value={filters.paymentStatus} onChange={event => setFilter('paymentStatus', event.target.value)} className="rounded-lg border px-3 text-sm"><option value="">All payments</option>{['Pending', 'Paid', 'Failed', 'Refunded'].map(status => <option key={status}>{status}</option>)}</select>
      <select value={filters.customer} onChange={event => setFilter('customer', event.target.value)} className="rounded-lg border px-3 text-sm"><option value="">All customers</option>{customers.map(customer => { const id = recordId(customer); return <option value={id} key={id}>{customer.name}</option>; })}</select>
      <input type="date" value={filters.date} onChange={event => setFilter('date', event.target.value)} className="rounded-lg border px-3 text-sm"/>
      <Button type="submit">Search</Button>
    </form>
    {loading ? <Loading label="Loading orders..."/> : error ? <div className="mt-6"><ErrorState message={error} onRetry={load}/></div> : <div className="table-shell mt-6"><table className="min-w-[1050px]"><thead><tr>{['Order ID', 'Tracking Number', 'Customer', 'Recipient', 'Amount', 'Payment', 'Status', 'Created', 'Actions'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{orders.map(order => <OrderRow key={recordId(order) || order.orderId || order.orderNumber} order={order} setAction={setAction}/>)}</tbody></table>{!orders.length && <p className="p-8 text-center text-sm text-slate-500">No matching orders found.</p>}<div className="flex flex-wrap justify-between gap-3 border-t p-4 text-sm text-slate-500"><span>{pagination.total || 0} results · Page {pagination.page || page} of {Math.max(pagination.pages || 0, 1)}</span><div className="flex gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>Previous</Button><Button variant="secondary" disabled={page >= (pagination.pages || 0)} onClick={() => setPage(current => current + 1)}>Next</Button></div></div></div>}
    <ConfirmationModal open={action?.type === 'confirm'} title="Confirm order" message="Are you sure you want to confirm this order?" confirmLabel="Confirm Order" loading={mutating} onCancel={() => setAction(null)} onConfirm={() => confirm()}/>
    <CancelOrderModal open={action?.type === 'cancel'} loading={mutating} onCancel={() => setAction(null)} onConfirm={confirm}/>
  </div>;
}

function OrderRow({ order, setAction }) {
  const id = recordId(order);
  const status = order.orderStatus || order.status || 'Pending';
  const paymentStatus = order.paymentStatus || 'Pending';
  const actionOrder = { ...order, id };
  return <tr><td className="font-semibold">{order.orderId || order.orderNumber || '—'}</td><td>{order.trackingNumber || '—'}</td><td>{order.customer?.name || '—'}</td><td>{order.recipientName || '—'}</td><td className="font-semibold">{money(order.totalAmount ?? order.amount ?? order.deliveryFee)}</td><td><Badge tone={String(paymentStatus).toLowerCase() === 'paid' ? 'success' : 'warning'}>{paymentStatus}</Badge></td><td><OrderStatusBadge status={status}/></td><td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</td><td><div className="flex gap-1"><Link title="View" className="p-2 text-blue-600" to={`/admin/orders/${id}`}><Eye size={17}/></Link><Link title="Edit" className="p-2 text-slate-600" to={`/admin/orders/${id}/edit`}><Pencil size={17}/></Link>{status === 'Pending' && <button onClick={() => setAction({ type: 'confirm', order: actionOrder })} className="px-2 text-xs font-semibold text-blue-600">Confirm</button>}{['Pending', 'Confirmed'].includes(status) && <button onClick={() => setAction({ type: 'cancel', order: actionOrder })} className="px-2 text-xs font-semibold text-red-600">Cancel</button>}</div></td></tr>;
}
