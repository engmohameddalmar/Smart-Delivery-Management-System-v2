import { useEffect, useState } from 'react';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loading from '../../components/common/Loading.jsx';
import DeliveryStatusBadge from '../../components/deliveries/DeliveryStatusBadge.jsx';
import api from '../../services/api.js';

export default function Deliveries() {
  const [data, setData] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { api.get('/business/deliveries').then(r => { setData(r.data.data || []); setError(''); }).catch(err => setError(err.response?.data?.message || 'Unable to load deliveries.')).finally(() => setLoading(false)); }, []);
  return <div><h1 className="text-2xl font-bold">Business Deliveries</h1><p className="page-subtitle">Driver assignments and delivery statuses for your orders.</p>{loading ? <Loading label="Loading deliveries…" /> : error ? <div className="mt-6"><ErrorState message={error} /></div> : <div className="table-shell mt-6"><table className="min-w-[820px]"><thead><tr>{['Delivery', 'Order', 'Customer', 'Driver', 'Status', 'Updated'].map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{data.map(delivery => <tr key={delivery._id}><td className="font-semibold">{delivery.deliveryId}</td><td>{delivery.order?.orderId}</td><td>{delivery.order?.recipientName}</td><td>{delivery.driver?.name || '—'}</td><td><DeliveryStatusBadge status={delivery.status} /></td><td>{delivery.updatedAt ? new Date(delivery.updatedAt).toLocaleString() : '—'}</td></tr>)}</tbody></table>{!data.length && <p className="p-8 text-center text-sm text-slate-500">No deliveries yet.</p>}</div>}</div>;
}
