import { CheckCircle2, Clock, DollarSign, Package, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loading from '../../components/common/Loading.jsx';
import StatCard from '../../components/dashboard/StatCard.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import api from '../../services/api.js';

const money = value => `$${Number(value || 0).toFixed(2)}`;
const idOf = record => record?._id || record?.id;

export default function Dashboard() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = () => { setLoading(true); api.get('/business/dashboard').then(r => { setData(r.data.data); setError(''); }).catch(err => setError(err.response?.data?.message || 'Unable to load business dashboard.')).finally(() => setLoading(false)); };
  useEffect(load, []);
  if (loading && !data) return <Loading label="Loading business dashboard…" />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  const cards = [['Total Orders', data.totalOrders, Package], ['Pending', data.pendingOrders, Clock], ['Active', data.activeOrders, Truck], ['Completed', data.completedOrders, CheckCircle2], ['Revenue', money(data.totalRevenue), DollarSign]];
  return <div><div className="page-heading"><div><h1 className="text-2xl font-bold">Business Dashboard</h1><p className="page-subtitle">Orders, deliveries, and revenue for {data.business?.name || 'your business'}.</p></div><Link to="/business/orders/create" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Create Order</Link></div><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([title, value, Icon]) => <StatCard key={title} title={title} value={value ?? 0} icon={Icon} trend="Live" description="business data" />)}</div><Card className="mt-6 overflow-hidden"><div className="flex items-center justify-between border-b p-5"><h2 className="font-bold">Recent Orders</h2><Link className="text-sm font-semibold text-blue-600" to="/business/orders">View all</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Order', 'Customer', 'Phone', 'Amount', 'Status', 'Created', ''].map(x => <th className="px-4 py-3" key={x}>{x}</th>)}</tr></thead><tbody>{(data.recentOrders || []).map(order => <tr className="border-t" key={idOf(order)}><td className="px-4 py-4 font-semibold">{order.orderId}</td><td className="px-4">{order.customerName || order.recipientName}</td><td className="px-4">{order.customerPhone || order.recipientPhone}</td><td className="px-4">{money(order.totalAmount)}</td><td className="px-4"><OrderStatusBadge status={order.orderStatus} /></td><td className="px-4">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</td><td className="px-4"><Link className="font-semibold text-blue-600" to={`/business/orders/${idOf(order)}`}>View</Link></td></tr>)}</tbody></table></div>{!data.recentOrders?.length && <p className="p-8 text-center text-sm text-slate-500">No business orders yet.</p>}</Card></div>;
}
