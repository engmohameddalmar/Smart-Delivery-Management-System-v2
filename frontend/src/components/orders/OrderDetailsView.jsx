import { MapPin, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import ConfirmationModal from '../common/ConfirmationModal.jsx';
import ErrorState from '../common/ErrorState.jsx';
import Loading from '../common/Loading.jsx';
import Toast from '../common/Toast.jsx';
import CancelOrderModal from './CancelOrderModal.jsx';
import OrderStatusBadge from './OrderStatusBadge.jsx';
import api from '../../services/api.js';
import { money } from '../../utils/records.js';

export default function OrderDetailsView({ admin = false }) {
  const { id } = useParams(); const location = useLocation();
  const [order, setOrder] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [action, setAction] = useState(null); const [mutating, setMutating] = useState(false); const [toast, setToast] = useState(location.state?.message ? { message: location.state.message } : null);
  const load = async () => { setLoading(true); try { const response = await api.get(`/orders/${id}`); setOrder(response.data.data); setError(''); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load order.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [id]);
  const confirm = async reason => { setMutating(true); try { if (action === 'confirm') await api.patch(`/orders/${id}/confirm`); else await api.patch(`/orders/${id}/cancel`, { reason }); setToast({ message: `Order ${action === 'confirm' ? 'confirmed' : 'cancelled'} successfully.` }); setAction(null); await load(); } catch (requestError) { setToast({ tone: 'error', message: requestError.response?.data?.message || 'Unable to update order.' }); setAction(null); } finally { setMutating(false); } };
  if (loading) return <Loading label="Loading order..."/>;
  if (error || !order) return <ErrorState message={error || 'Unable to load order.'} onRetry={load}/>;

  const status = order.orderStatus || order.status || 'Pending';
  const paymentStatus = order.paymentStatus || 'Pending';
  const fields = [['Recipient', order.recipientName], ['Recipient Phone', order.recipientPhone], ['Package', order.packageDescription || order.packageType], ['Quantity', order.quantity], ['Weight', order.weight == null ? '—' : `${order.weight} kg`], ['Delivery Fee', money(order.deliveryFee)], ['Total Amount', money(order.totalAmount ?? order.amount ?? order.deliveryFee)], ['Payment Method', order.paymentMethod], ['Created', order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'], ['Updated', order.updatedAt ? new Date(order.updatedAt).toLocaleString() : '—']];

  return <div><Toast {...toast} onClose={() => setToast(null)}/><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><OrderStatusBadge status={status}/><Badge tone={String(paymentStatus).toLowerCase() === 'paid' ? 'success' : 'warning'}>{paymentStatus}</Badge></div><h1 className="mt-3 text-2xl font-bold">{order.orderId || order.orderNumber || 'Order'}</h1><p className="mt-1 text-sm text-slate-500">Tracking: {order.trackingNumber || '—'}</p></div>{admin && <div className="flex gap-2"><Link to={`/admin/orders/${id}/edit`}><Button variant="secondary">Edit</Button></Link>{status === 'Pending' && <Button onClick={() => setAction('confirm')}>Confirm</Button>}{['Pending', 'Confirmed'].includes(status) && <Button variant="danger" onClick={() => setAction('cancel')}>Cancel</Button>}</div>}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-3"><Card className="p-6 lg:col-span-2"><h2 className="flex items-center gap-2 font-semibold"><Package className="text-blue-600"/>Order Information</h2>{admin && <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm"><span className="text-slate-500">Customer: </span><span className="font-semibold">{order.customer?.name || '—'}</span>{order.customer?.email && <span className="ml-2 text-slate-500">{order.customer.email}</span>}</div>}<dl className="mt-6 grid gap-5 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium">{value ?? '—'}</dd></div>)}</dl>{order.notes && <div className="mt-6 border-t pt-5"><p className="text-xs font-semibold uppercase text-slate-400">Notes</p><p className="mt-2 text-sm">{order.notes}</p></div>}{order.cancellationReason && <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"><strong>Cancellation reason:</strong> {order.cancellationReason}</div>}</Card><div className="space-y-4">{[['Pickup Address', order.pickupAddress], ['Delivery Address', order.deliveryAddress]].map(([label, value]) => <Card className="p-5" key={label}><MapPin className="text-blue-600"/><p className="mt-3 text-xs font-semibold uppercase text-slate-400">{label}</p><p className="mt-2 text-sm leading-6">{value || '—'}</p></Card>)}</div></div>
    <ConfirmationModal open={action === 'confirm'} title="Confirm order" message="Are you sure you want to confirm this order?" confirmLabel="Confirm Order" loading={mutating} onCancel={() => setAction(null)} onConfirm={() => confirm()}/><CancelOrderModal open={action === 'cancel'} loading={mutating} onCancel={() => setAction(null)} onConfirm={confirm}/>
  </div>;
}
