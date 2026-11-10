import { useState } from 'react';
import api from '../../services/api.js';
import Button from '../common/Button.jsx';
import ConfirmationModal from '../common/ConfirmationModal.jsx';
import { recordId } from '../../utils/records.js';

const actions = { Assigned: [['accept', 'Accept Delivery'], ['reject', 'Reject Delivery']], Accepted: [['pickup', 'Mark Picked Up']], 'Picked Up': [['in-transit', 'Start Transit']], 'In Transit': [['out-for-delivery', 'Out for Delivery']], 'Out for Delivery': [['delivered', 'Mark Delivered'], ['failed', 'Mark Failed']] };

export default function DriverActions({ delivery, onSuccess }) {
  const [action, setAction] = useState(null); const [reason, setReason] = useState(''); const [notes, setNotes] = useState('');
  const [recipient, setRecipient] = useState(''); const [signature, setSignature] = useState(''); const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const available = actions[delivery.status] || [];
  if (!available.length) return null;

  const submit = async () => {
    if (['reject', 'failed'].includes(action) && !reason.trim()) return setError('A reason is required.');
    if (action === 'delivered' && !recipient.trim()) return setError('Recipient name is required.');
    setLoading(true); setError('');
    try {
      const session = await api.get('/auth/me');
      const currentUser = session.data.user;
      const assignedDriverId = recordId(delivery.driver);
      if (currentUser?.role !== 'driver' || (assignedDriverId && String(currentUser.id) !== String(assignedDriverId))) {
        setError('Your session is not the assigned driver for this delivery. Sign in again with the assigned driver account.');
        return;
      }
      let response;
      if (action === 'delivered') {
        const formData = new FormData(); formData.append('recipientName', recipient.trim()); formData.append('signature', signature.trim()); formData.append('deliveryNote', notes.trim()); if (photo) formData.append('proofPhoto', photo);
        response = await api.patch(`/deliveries/${delivery._id}/delivered`, formData);
      } else response = await api.patch(`/deliveries/${delivery._id}/${action}`, action === 'reject' ? { reason: reason.trim() } : action === 'failed' ? { failureReason: reason.trim(), deliveryNotes: notes.trim() } : {});
      setAction(null); setReason(''); setNotes(''); setRecipient(''); setSignature(''); setPhoto(null); onSuccess(response.data.data);
    } catch (requestError) {
      if (requestError.response?.status === 403) setError('This delivery is no longer assigned to your account. Reload the page and check My Deliveries.');
      else setError(requestError.response?.data?.message || 'Unable to update delivery.');
    } finally { setLoading(false); }
  };

  const requiresForm = ['reject', 'failed', 'delivered'].includes(action);
  return <div className="mt-6"><div className="grid gap-3 sm:grid-cols-2">{available.map(([key, label]) => <button key={key} onClick={() => { setAction(key); setError(''); }} className={`min-h-14 rounded-xl px-5 py-4 text-base font-bold text-white ${['reject', 'failed'].includes(key) ? 'bg-red-600' : 'bg-blue-600'}`}>{label}</button>)}</div>
    {requiresForm && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6"><h2 className="text-xl font-bold">{action === 'delivered' ? 'Proof of Delivery' : action === 'reject' ? 'Reject Delivery' : 'Mark Delivery Failed'}</h2>{error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{action === 'delivered' ? <div className="mt-5 space-y-4"><input required value={recipient} onChange={event => setRecipient(event.target.value)} className="w-full rounded-lg border p-3" placeholder="Recipient name *"/><input value={signature} onChange={event => setSignature(event.target.value)} className="w-full rounded-lg border p-3" placeholder="Signature reference"/><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setPhoto(event.target.files?.[0] || null)} className="w-full text-sm"/><textarea value={notes} onChange={event => setNotes(event.target.value)} className="w-full rounded-lg border p-3" placeholder="Delivery note"/></div> : <div className="mt-5 space-y-4"><textarea value={reason} onChange={event => setReason(event.target.value)} className="w-full rounded-lg border p-3" placeholder={`${action === 'reject' ? 'Rejection' : 'Failure'} reason *`}/>{action === 'failed' && <textarea value={notes} onChange={event => setNotes(event.target.value)} className="w-full rounded-lg border p-3" placeholder="Delivery notes"/>}</div>}<div className="mt-5 flex justify-end gap-3"><Button variant="secondary" disabled={loading} onClick={() => setAction(null)}>Cancel</Button><Button disabled={loading} onClick={submit}>{loading ? 'Updating...' : 'Confirm'}</Button></div></div></div>}
    <ConfirmationModal open={Boolean(action && !requiresForm)} title="Update delivery" message={`Are you sure you want to ${available.find(item => item[0] === action)?.[1].toLowerCase()}?`} loading={loading} onCancel={() => setAction(null)} onConfirm={submit}/>
  </div>;
}
