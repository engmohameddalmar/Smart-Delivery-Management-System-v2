import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import ErrorState from '../common/ErrorState.jsx';
import Loading from '../common/Loading.jsx';
import Toast from '../common/Toast.jsx';
import PaymentActionModal from './PaymentActionModal.jsx';
import PaymentStatusBadge from './PaymentStatusBadge.jsx';
import api from '../../services/api.js';

export default function PaymentDetailsView({ admin = false }) {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get(`/payments/${id}`)
      .then(response => {
        setPayment(response.data.data || null);
        setError('');
      })
      .catch(err => {
        setPayment(null);
        setError(err.response?.data?.message || 'Unable to load payment.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async value => {
    setSaving(true);
    try {
      await api.patch(
        `/payments/${id}/${action}`,
        action === 'failed'
          ? { failureReason: value }
          : action === 'refund'
            ? { refundAmount: Number(value) }
            : action === 'paid'
              ? { transactionId: value || undefined }
              : {}
      );
      setAction(null);
      setToast({ message: action === 'paid' ? 'Payment marked as paid. Receipt generated.' : 'Payment updated successfully.' });
      await load();
    } catch (err) {
      setToast({ tone: 'error', message: err.response?.data?.message || 'Unable to update payment.' });
      setAction(null);
    } finally {
      setSaving(false);
    }
  };

  const payNow = async () => {
    setSaving(true);
    try {
      const response = await api.post(`/payments/${id}/initiate`);
      const session = response.data.data?.session;
      if (session?.paymentUrl) window.location.href = session.paymentUrl;
      else setToast({ message: 'Online payment session is ready.', tone: 'success' });
      await load();
    } catch (err) {
      setToast({ tone: 'error', message: err.response?.data?.message || 'Online payment is not available yet.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading label="Loading payment..." />;
  if (!payment) return <ErrorState message={error || 'Payment not found.'} />;

  const amount = Number(payment.amount || 0);
  const fields = [
    ['Order', payment.order?.orderId || '—'],
    ['Business', payment.business?.name || '—'],
    ['Customer', payment.customer?.name || payment.order?.customerName || '—'],
    ['Delivery Fee', `$${amount.toFixed(2)}`],
    ['Total', `$${amount.toFixed(2)}`],
    ['Payment Method', 'Online Payment'],
    ['Transaction ID', payment.transactionId || '—'],
    ['Paid Date', payment.paidAt ? new Date(payment.paidAt).toLocaleString() : '—'],
    ['Refund Amount', `$${Number(payment.refundAmount || 0).toFixed(2)}`],
    ['Refund Date', payment.refundedAt ? new Date(payment.refundedAt).toLocaleString() : '—'],
    ['Created', new Date(payment.createdAt).toLocaleString()],
  ];

  return (
    <div>
      <Toast {...toast} onClose={() => setToast(null)} />
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <PaymentStatusBadge status={payment.status} />
          <h1 className="mt-3 text-2xl font-extrabold">Payment for Delivery</h1>
          <p className="mt-1 text-sm text-slate-500">{payment.paymentId}</p>
        </div>
        {admin ? (
          <div className="flex gap-2">
            {payment.status === 'Pending' && <button onClick={() => setAction('paid')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Mark Paid</button>}
            {payment.status === 'Pending' && <button onClick={() => setAction('failed')} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Mark Failed</button>}
            {payment.status === 'Paid' && <button onClick={() => setAction('refund')} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Refund</button>}
          </div>
        ) : (
          ['Pending', 'Failed'].includes(payment.status) && <Button disabled={saving} onClick={payNow}>Pay ${amount.toFixed(2)}</Button>
        )}
      </div>

      <Card className="mt-6 p-6">
        <dl className="grid gap-5 sm:grid-cols-2">
          {fields.filter(([label]) => admin || !['Business', 'Customer'].includes(label)).map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt>
              <dd className="mt-1 text-sm font-medium">{value || '—'}</dd>
            </div>
          ))}
        </dl>

        {payment.status === 'Paid' && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <p className="text-sm font-semibold">Paid receipt</p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="font-semibold">Payment ID:</span> {payment.paymentId}</p>
              <p><span className="font-semibold">Transaction ID:</span> {payment.transactionId || '—'}</p>
              <p><span className="font-semibold">Reference:</span> {payment.paymentReference || '—'}</p>
              <p><span className="font-semibold">Paid At:</span> {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : '—'}</p>
            </div>
          </div>
        )}

        {payment.failureReason && <p className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">Failure: {payment.failureReason}</p>}
        <div className="mt-6 flex gap-3">
          {payment.order?._id && <Link to={admin ? `/admin/orders/${payment.order._id}` : '#'}><Button variant="secondary">View Order</Button></Link>}
        </div>
      </Card>

      <PaymentActionModal action={action} payment={payment} loading={saving} onClose={() => setAction(null)} onConfirm={update} />
    </div>
  );
}
