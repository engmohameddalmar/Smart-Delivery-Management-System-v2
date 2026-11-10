import { AlertTriangle, CheckCircle2, MapPin, PackageCheck, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loading from '../../components/common/Loading.jsx';
import DeliveryStatusBadge from '../../components/deliveries/DeliveryStatusBadge.jsx';
import StatCard from '../../components/dashboard/StatCard.jsx';
import api from '../../services/api.js';
import { money, recordId } from '../../utils/records.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(''); try { const response = await api.get('/driver/dashboard'); setData(response.data.data); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load driver dashboard.'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  if (loading && !data) return <Loading label="Loading driver dashboard..." />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  const cards = [['Assigned Deliveries', data.assignedDeliveries ?? 0, PackageCheck], ['Completed', data.completedDeliveries ?? 0, CheckCircle2], ['Failed', data.failedDeliveries ?? 0, AlertTriangle], ['Success Rate', `${Number(data.successRate ?? 0).toFixed(1)}%`, CheckCircle2]];
  const current = data.currentDelivery;
  return <div><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-extrabold">Driver Dashboard</h1><p className="mt-1 text-sm text-slate-500">Your assigned work, availability, and performance.</p></div><button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-60"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} />Refresh</button></div>{error && <div className="mt-4"><ErrorState message={error} onRetry={load} /></div>}<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([title, value, Icon]) => <StatCard key={title} title={title} value={value} icon={Icon} trend="Live" description="driver data" />)}</div><div className="mt-7 grid gap-6 xl:grid-cols-2"><Card className="p-6"><div className="flex items-center justify-between"><h2 className="font-bold">Current Delivery</h2>{current && <DeliveryStatusBadge status={current.status} />}</div>{current ? <div className="mt-5 space-y-4 text-sm"><div><p className="text-xs font-semibold uppercase text-slate-400">Order</p><p className="mt-1 font-bold">{current.order?.orderId || '—'} · {current.order?.trackingNumber || '—'}</p></div><div className="grid gap-4 sm:grid-cols-2"><Info label="Customer" value={current.customer?.name} /><Info label="Phone" value={current.customer?.phone} /><Info label="Pickup" value={current.order?.pickupAddress} /><Info label="Delivery" value={current.order?.deliveryAddress} /><Info label="Payment" value={current.order?.paymentMethod} /><Info label="Amount" value={money(current.order?.deliveryFee ?? current.order?.totalAmount)} /></div><Link to={`/driver/deliveries/${recordId(current)}`} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white"><MapPin size={17} />Open Delivery</Link></div> : <p className="grid min-h-56 place-items-center text-sm text-slate-500">No active delivery.</p>}</Card><Card className="overflow-hidden"><div className="flex justify-between border-b p-5"><h2 className="font-bold">Recent Deliveries</h2><Link to="/driver/deliveries" className="text-sm font-semibold text-indigo-600">View all</Link></div>{(data.recentDeliveries || []).map((delivery) => { const id = recordId(delivery); return <Link to={id ? `/driver/deliveries/${id}` : '/driver/deliveries'} key={id || delivery.deliveryId} className="flex flex-wrap items-center justify-between gap-3 border-b p-5 last:border-0"><div><p className="font-semibold">{delivery.deliveryId || '—'}</p><p className="mt-1 text-xs text-slate-500">{delivery.order?.orderId || '—'} · {delivery.order?.recipientName || 'Recipient unavailable'}</p></div><DeliveryStatusBadge status={delivery.status} /></Link>; })}{!data.recentDeliveries?.length && <p className="p-8 text-center text-sm text-slate-500">No deliveries assigned.</p>}</Card></div></div>;
}

function Info({ label, value }) { return <div><p className="text-xs font-semibold uppercase text-slate-400">{label}</p><p className="mt-1 font-medium">{value || '—'}</p></div>; }
