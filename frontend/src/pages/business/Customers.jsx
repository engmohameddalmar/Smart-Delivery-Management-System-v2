import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loading from '../../components/common/Loading.jsx';
import api from '../../services/api.js';

const blank = { name: '', email: '', phone: '', password: '', address: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/business/customers', { params: { limit: 100 } });
      setCustomers(Array.isArray(response.data.data) ? response.data.data : []);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(blank); setModalError(''); setModal(true); };
  const save = async event => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) { setModalError('Name, email, and phone are required.'); return; }
    if (String(form.password || '').length < 8) { setModalError('Password must be at least 8 characters.'); return; }
    setSaving(true);
    setModalError('');
    try {
      await api.post('/business/customers', form);
      setModal(false);
      await load();
      setError('');
    } catch (requestError) {
      setModalError(requestError.response?.data?.message || 'Unable to create customer.');
    } finally {
      setSaving(false);
    }
  };

  return <div>
    <div className="page-heading">
      <div><h1 className="text-2xl font-bold">Customers</h1><p className="page-subtitle">Customers created by your business account.</p></div>
      <Button type="button" onClick={openCreate}><Plus size={18} />Create Customer</Button>
    </div>
    {loading ? <Loading label="Loading customers…" /> : error ? <div className="mt-6"><ErrorState message={error} onRetry={load} /></div> : <div className="table-shell mt-6"><table className="min-w-[900px]"><thead><tr>{['Name', 'Email', 'Phone', 'Status', 'Created'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{customers.map(customer => <tr key={customer.id}><td className="font-semibold">{customer.name}</td><td>{customer.email}</td><td>{customer.phone}</td><td>{customer.status}</td><td>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '—'}</td></tr>)}</tbody></table>{!customers.length && <p className="p-8 text-center text-sm text-slate-500">No customers found.</p>}</div>}
    {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><form onSubmit={save} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-xl font-bold">Create Customer</h2><p className="mt-1 text-sm text-slate-500">This customer will belong to your business account.</p>{modalError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{modalError}</div>}<div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><Field label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><Field label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /><Field label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /><Field label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} span optional /></div><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setModal(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Customer'}</Button></div></form></div>}
  </div>;
}

function Field({ label, span = false, optional = false, ...props }) {
  return <label className={`grid gap-2 text-sm font-semibold text-slate-700 ${span ? 'sm:col-span-2' : ''}`}><span>{label}{optional ? ' (optional)' : ''}</span><input {...props} className="rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500" required={!optional} /></label>;
}
