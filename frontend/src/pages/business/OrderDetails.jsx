import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loading from '../../components/common/Loading.jsx';
import DeliveryStatusBadge from '../../components/deliveries/DeliveryStatusBadge.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import api from '../../services/api.js';

const money = value => `$${Number(value || 0).toFixed(2)}`;

export default function OrderDetails() {
  const { id } = useParams(); const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { api.get(`/business/orders/${id}`).then(r => setData(r.data.data)).catch(err => setError(err.response?.data?.message || 'Unable to load order.')).finally(() => setLoading(false)); }, [id]);
  if (loading) return <Loading label="Loading order…" />;
  if (error) return <ErrorState message={error} />;
  const order = data.order; const delivery = data.delivery;
  return <div><Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600" to="/business/orders"><ArrowLeft size={17} />Back to orders</Link><div className="page-heading"><div><h1 className="text-2xl font-bold">{order.orderId}</h1><p className="page-subtitle">Tracking: {order.trackingNumber}</p></div><OrderStatusBadge status={order.orderStatus} /></div><div className="mt-6 grid gap-6 lg:grid-cols-3"><Card className="p-6 lg:col-span-2"><h2 className="font-bold">Order Information</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2">{[['Customer', order.customerName || order.recipientName], ['Phone', order.customerPhone || order.recipientPhone], ['Delivery Address', order.deliveryAddress], ['Items', order.packageDescription], ['Quantity', order.quantity], ['Amount', money(order.totalAmount)], ['Payment Method', order.paymentMethod], ['Payment Status', order.paymentStatus]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium">{value || '—'}</dd></div>)}</dl>{order.notes && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{order.notes}</p>}</Card><Card className="p-6"><h2 className="font-bold">Delivery</h2>{delivery ? <div className="mt-5 space-y-4 text-sm"><DeliveryStatusBadge status={delivery.status} /><p><span className="text-slate-500">Driver:</span> <strong>{delivery.driver?.name || '—'}</strong></p><p><span className="text-slate-500">Phone:</span> {delivery.driver?.phone || '—'}</p></div> : <p className="mt-5 text-sm text-slate-500">No driver assigned yet.</p>}</Card></div></div>;
}
