import { MapPin, Package, Phone, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api.js';
import Card from '../common/Card.jsx';
import ErrorState from '../common/ErrorState.jsx';
import Loading from '../common/Loading.jsx';
import Toast from '../common/Toast.jsx';
import TrackingTimeline from '../tracking/TrackingTimeline.jsx';
import AssignDriverModal from './AssignDriverModal.jsx';
import DeliveryStatusBadge from './DeliveryStatusBadge.jsx';
import DriverActions from './DriverActions.jsx';

export default function DeliveryDetailsView({ role }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assign, setAssign] = useState(false);
  const [toast, setToast] = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`/deliveries/${id}`).then(response => {
      setData(response.data.data);
      setError('');
    }).catch(err => setError(err.response?.data?.message || 'Unable to load delivery.')).finally(() => setLoading(false));
  };

  useEffect(load, [id, role]);

  if (loading) return <Loading label="Loading delivery..." />;
  if (error) return <ErrorState message={error} />;
  const { delivery, timeline } = data;
  const order = delivery.order;

  return <div><Toast {...toast} onClose={() => setToast(null)} />
    <div className="flex flex-wrap justify-between gap-4"><div><DeliveryStatusBadge status={delivery.status} /><h1 className="mt-3 text-2xl font-extrabold">{delivery.deliveryId}</h1><p className="mt-1 text-sm text-slate-500">{order.orderId} · {order.trackingNumber}</p></div>{role === 'admin' && ['Assigned', 'Rejected'].includes(delivery.status) && <button onClick={() => setAssign(true)} className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">Reassign Driver</button>}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-3"><div className="space-y-6 lg:col-span-2">
      <Card className="p-6"><h2 className="flex items-center gap-2 font-bold"><Package className="text-indigo-600" />Delivery Information</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2">{[['Customer', delivery.customer?.name || order.customerName || '—'], ['Recipient', order.recipientName], ['Recipient Phone', order.recipientPhone], ['Package', order.packageDescription], ['Quantity', order.quantity], ['Weight', `${order.weight} kg`], ['Delivery Fee', `$${Number(order.deliveryFee || 0).toFixed(2)}`], ['Payment', 'Online Payment']].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}</dl></Card>
      <div className="grid gap-4 sm:grid-cols-2">{[['Pickup Address', order.pickupAddress], ['Delivery Address', order.deliveryAddress]].map(([label, value]) => <Card className="p-5" key={label}><MapPin className="text-indigo-600" /><h3 className="mt-3 text-sm font-bold">{label}</h3><p className="mt-2 text-sm text-slate-600">{value}</p></Card>)}</div>
      {role === 'driver' && <DriverActions delivery={delivery} onSuccess={() => { setToast({ message: 'Delivery updated successfully.' }); load(); }} />}
      {delivery.failureReason && <Card className="border-red-200 bg-red-50 p-5 text-red-700"><strong>Failure reason:</strong> {delivery.failureReason}{delivery.deliveryNotes && <p className="mt-2">{delivery.deliveryNotes}</p>}</Card>}
      {delivery.proofOfDelivery?.recipientName && <Card className="p-5"><h2 className="font-bold">Proof of Delivery</h2><p className="mt-3 text-sm">Received by: {delivery.proofOfDelivery.recipientName}</p>{delivery.proofOfDelivery.deliveryNote && <p className="mt-2 text-sm text-slate-500">{delivery.proofOfDelivery.deliveryNote}</p>}</Card>}
    </div><div className="space-y-6"><Card className="p-5"><h2 className="flex items-center gap-2 font-bold"><Truck className="text-indigo-600" />Assigned Driver</h2><p className="mt-4 font-semibold">{delivery.driver?.name}</p>{role !== 'customer' && <p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><Phone size={15} />{delivery.driver?.phone}</p>}</Card><Card className="p-5"><h2 className="mb-5 font-bold">Timeline</h2><TrackingTimeline events={timeline} /></Card></div></div>
    <AssignDriverModal open={assign} targetId={delivery._id} mode="reassign" onClose={() => setAssign(false)} onSuccess={() => { setAssign(false); setToast({ message: 'Driver reassigned successfully.' }); load(); }} />
  </div>;
}
