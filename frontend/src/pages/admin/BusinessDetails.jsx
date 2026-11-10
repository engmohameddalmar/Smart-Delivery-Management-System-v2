import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '../../components/common/Badge.jsx';
import Card from '../../components/common/Card.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loading from '../../components/common/Loading.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import api from '../../services/api.js';

export default function BusinessDetails() {
  const { id } = useParams(); const [business, setBusiness] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { api.get(`/admin/businesses/${id}`).then(r => setBusiness(r.data.data)).catch(err => setError(err.response?.data?.message || 'Unable to load business.')).finally(() => setLoading(false)); }, [id]);
  if (loading) return <Loading label="Loading business…" />;
  if (error) return <ErrorState message={error} />;
  return <div><Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600" to="/admin/businesses"><ArrowLeft size={17} />Back to businesses</Link><div className="page-heading"><div><h1 className="text-2xl font-bold">{business.name}</h1><p className="page-subtitle">{business.ownerName} · {business.email}</p></div><Badge tone={business.status === 'active' ? 'success' : 'warning'}>{business.status}</Badge></div><div className="mt-6 grid gap-6 lg:grid-cols-3"><Card className="p-6"><p className="text-sm text-slate-500">Orders</p><p className="mt-2 text-3xl font-extrabold">{business.orderCount || 0}</p></Card><Card className="p-6 lg:col-span-2"><h2 className="font-bold">Business Information</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2">{[['Owner', business.ownerName], ['Email', business.email], ['Phone', business.phone], ['Address', business.address], ['Created', business.createdAt ? new Date(business.createdAt).toLocaleString() : '—'], ['Login Role', business.user?.role || 'business']].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}</dl></Card></div><Card className="mt-6 overflow-hidden"><div className="border-b p-5"><h2 className="font-bold">Recent Orders</h2></div><table className="min-w-[760px]"><thead><tr>{['Order', 'Customer', 'Amount', 'Status', 'Created'].map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{(business.recentOrders || []).map(order => <tr key={order._id}><td className="font-semibold">{order.orderId}</td><td>{order.customerName || order.recipientName}</td><td>${Number(order.totalAmount || 0).toFixed(2)}</td><td><OrderStatusBadge status={order.orderStatus} /></td><td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</td></tr>)}</tbody></table>{!business.recentOrders?.length && <p className="p-8 text-center text-sm text-slate-500">No orders yet.</p>}</Card></div>;
}
