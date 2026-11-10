import { Search, Truck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loading from '../../components/common/Loading.jsx';
import CurrentDeliveryStatus from '../../components/tracking/CurrentDeliveryStatus.jsx';
import TrackingProgress from '../../components/tracking/TrackingProgress.jsx';
import TrackingTimeline from '../../components/tracking/TrackingTimeline.jsx';
import { trackByTrackingNumber } from '../../services/trackingService.js';
import PageHero from './PageHero.jsx';

export default function TrackDelivery() {
  const [searchParams] = useSearchParams();
  const initialTracking = searchParams.get('tracking')?.trim().toUpperCase() || '';
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const track = useCallback(async (value) => { if (!value.trim()) { setError('Enter your tracking number.'); return; } setLoading(true); setError(''); setData(null); try { setData(await trackByTrackingNumber(value)); } catch (requestError) { if (!requestError.response) setError('Unable to connect to tracking service.'); else if (requestError.response.status === 404) setError('Tracking number not found.'); else setError(requestError.response?.data?.message || 'Unable to track this delivery.'); } finally { setLoading(false); } }, []);
  useEffect(() => { if (initialTracking) track(initialTracking); }, [initialTracking, track]);
  const submit = (event) => { event.preventDefault(); track(trackingNumber); };
  return <><PageHero eyebrow="Track Delivery" title="Follow your delivery" description="Enter your tracking number to see real-time workflow updates from our delivery system." /><section className="page-wrap py-12"><Card className="mx-auto max-w-3xl p-6 sm:p-8"><form onSubmit={submit} className="flex flex-col items-end gap-3 sm:flex-row"><div className="w-full"><label className="field-label" htmlFor="tracking">Tracking Number</label><input id="tracking" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value.toUpperCase())} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm uppercase outline-none focus:border-indigo-500" placeholder="Enter your tracking number" /></div><Button disabled={loading} type="submit" className="w-full sm:w-auto"><Search className="mr-2" size={18} />{loading ? 'Tracking…' : 'Track Delivery'}</Button></form>{error && <div className="mt-6"><ErrorState message={error} onRetry={() => track(trackingNumber)} /></div>}{loading && <Loading label="Tracking your delivery…" />}</Card>{data && <TrackingResult data={data} />}</section></>;
}

function TrackingResult({ data }) { const order = data.order || {}; const recipient = order.recipient || {}; return <div className="mx-auto mt-8 max-w-5xl space-y-6"><CurrentDeliveryStatus status={data.currentStatus} lastUpdated={data.lastUpdated} /><Card className="p-6"><h2 className="mb-6 font-bold">Delivery Progress</h2><TrackingProgress status={data.currentStatus} events={data.events || []} /></Card><div className="grid gap-6 lg:grid-cols-3"><Card className="p-6 lg:col-span-2"><h2 className="font-bold">Delivery Information</h2><dl className="mt-5 grid gap-5 sm:grid-cols-2">{[['Tracking Number', order.trackingNumber], ['Order ID', order.orderId], ['Recipient', recipient.name], ['Delivery Address', order.deliveryLocation], ['Pickup Location', order.pickupLocation], ['Order Created', order.createdAt ? new Date(order.createdAt).toLocaleString() : '—']].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium">{value || '—'}</dd></div>)}</dl></Card><Card className="p-6"><h2 className="flex items-center gap-2 font-bold"><Truck className="text-indigo-600" />Driver</h2>{data.delivery?.driver ? <div className="mt-5"><p className="font-semibold">{data.delivery.driver.name || 'Assigned driver'}</p><p className="text-sm text-slate-500">{data.delivery.driver.phone || 'Phone unavailable'}</p></div> : <p className="mt-5 text-sm text-slate-500">Driver has not been assigned yet.</p>}</Card></div><Card className="p-6"><h2 className="mb-6 font-bold">Delivery Timeline</h2><TrackingTimeline events={data.events || []} /></Card></div>; }
