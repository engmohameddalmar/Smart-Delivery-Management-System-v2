import { Eye, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import ConfirmationModal from '../../components/common/ConfirmationModal.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Input from '../../components/common/Input.jsx';
import Loading from '../../components/common/Loading.jsx';
import Toast from '../../components/common/Toast.jsx';
import api from '../../services/api.js';

const blank = { name: '', ownerName: '', email: '', phone: '', address: '', password: '', status: 'active' };
const tones = { active: 'success', inactive: 'neutral', suspended: 'warning' };

export default function Businesses() {
  const [businesses, setBusinesses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [action, setAction] = useState(null);
  const [modalError, setModalError] = useState('');
  const [mutating, setMutating] = useState(false);
  const [toast, setToast] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/businesses', { params: { page, limit: 10, search: query || undefined, status: status || undefined } })
      .then(r => { setBusinesses(r.data.data || []); setPagination(r.data.pagination || {}); setError(''); })
      .catch(err => setError(err.response?.data?.message || 'Unable to load businesses.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [page, query, status]);

  const submitSearch = event => { event.preventDefault(); setPage(1); setQuery(search); };
  const save = async event => {
    event.preventDefault();
    if (!modal?.form?.name?.trim() || !modal?.form?.ownerName?.trim() || !modal?.form?.email?.trim() || !modal?.form?.phone?.trim() || !modal?.form?.address?.trim()) {
      setModalError('Business name, owner name, email, phone, and address are required.');
      return;
    }
    if (!modal.business && !modal?.form?.password?.trim()) {
      setModalError('Password is required.');
      return;
    }
    setMutating(true);
    setModalError('');
    try {
      if (modal.business) await api.put(`/admin/businesses/${modal.business._id}`, modal.form);
      else await api.post('/admin/businesses', modal.form);
      setToast({ message: modal.business ? 'Business updated successfully.' : 'Business created successfully.' });
      setModal(null);
      await load();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Unable to save business.');
      setToast({ tone: 'error', message: err.response?.data?.message || 'Unable to save business.' });
    } finally {
      setMutating(false);
    }
  };

  const confirm = async () => {
    setMutating(true);
    try {
      if (action.type === 'status') await api.patch(`/admin/businesses/${action.business._id}/status`, { status: action.next });
      if (action.type === 'reset') await api.patch(`/admin/businesses/${action.business._id}/reset-password`, { password: action.password });
      if (action.type === 'delete') await api.delete(`/admin/businesses/${action.business._id}`);
      setToast({ message: 'Business action completed successfully.' });
      setAction(null);
      await load();
    } catch (err) {
      setToast({ tone: 'error', message: err.response?.data?.message || 'Action failed.' });
    } finally {
      setMutating(false);
    }
  };

  return <div>
    <Toast {...toast} onClose={() => setToast(null)} />
    <div className="page-heading">
      <div>
        <h1 className="text-2xl font-bold">Businesses</h1>
        <p className="page-subtitle">Create and manage business accounts that can submit their own orders.</p>
      </div>
      <Button onClick={() => { setModalError(''); setModal({ form: blank }); }}><Plus size={18} />Add Business</Button>
    </div>
    <form onSubmit={submitSearch} className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto]">
      <input value={search} onChange={e => setSearch(e.target.value)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Search business, owner, email, or phone" />
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 text-sm">
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="suspended">Suspended</option>
      </select>
      <Button type="submit">Search</Button>
    </form>
    {loading ? <Loading label="Loading businesses…" /> : error ? <div className="mt-6"><ErrorState message={error} onRetry={load} /></div> : <div className="table-shell mt-6"><table className="min-w-[980px]"><thead><tr>{['Business Name', 'Owner', 'Email', 'Phone', 'Status', 'Orders', 'Created', 'Actions'].map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{businesses.map(business => <tr key={business._id}><td className="font-semibold">{business.name}</td><td>{business.ownerName}</td><td>{business.email}</td><td>{business.phone}</td><td><Badge tone={tones[business.status]}>{business.status}</Badge></td><td>{business.orderCount || 0}</td><td>{business.createdAt ? new Date(business.createdAt).toLocaleDateString() : '—'}</td><td><div className="flex items-center gap-1"><Link title="View" className="rounded-md p-2 text-blue-600 hover:bg-blue-50" to={`/admin/businesses/${business._id}`}><Eye size={17} /></Link><button title="Edit" className="rounded-md p-2 text-slate-600 hover:bg-slate-100" onClick={() => setModal({ business, form: { name: business.name, ownerName: business.ownerName, email: business.email, phone: business.phone, address: business.address, status: business.status, password: '' } })}><Pencil size={17} /></button>{business.status !== 'active' ? <button className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50" onClick={() => setAction({ type: 'status', business, next: 'active' })}>Activate</button> : <button className="rounded-md px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50" onClick={() => setAction({ type: 'status', business, next: 'inactive' })}>Deactivate</button>}<button title="Reset password" className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50" onClick={() => { const password = window.prompt(`Enter a new password for ${business.name}`); if (password) setAction({ type: 'reset', business, password }); }}><RotateCcw size={17} /></button><button title="Delete" className="rounded-md p-2 text-red-600 hover:bg-red-50" onClick={() => setAction({ type: 'delete', business })}><Trash2 size={17} /></button></div></td></tr>)}</tbody></table>{!businesses.length && <p className="p-8 text-center text-sm text-slate-500">No businesses found.</p>}<div className="flex flex-wrap justify-between gap-3 border-t p-4 text-sm text-slate-500"><span>{pagination.total || 0} results · Page {pagination.page || page} of {Math.max(pagination.pages || 0, 1)}</span><div className="flex gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(x => x - 1)}>Previous</Button><Button variant="secondary" disabled={page >= (pagination.pages || 0)} onClick={() => setPage(x => x + 1)}>Next</Button></div></div></div>}
    {modal && <BusinessModal modal={modal} setModal={setModal} save={save} mutating={mutating} modalError={modalError} setModalError={setModalError} />}
    {action && <ConfirmationModal open title={action.type === 'delete' ? 'Deactivate business' : action.type === 'reset' ? 'Reset password' : 'Change status'} message={action.type === 'reset' ? `Reset ${action.business.name}'s password?` : action.type === 'delete' ? `Deactivate ${action.business.name}? Existing orders will remain.` : `Change ${action.business.name} to ${action.next}?`} confirmLabel={action.type === 'delete' ? 'Deactivate' : 'Confirm'} danger={action.type === 'delete'} loading={mutating} onCancel={() => setAction(null)} onConfirm={confirm} />}
  </div>;
}

function BusinessModal({ modal, setModal, save, mutating, modalError, setModalError }) {
  const set = key => event => setModal(current => ({ ...current, form: { ...current.form, [key]: event.target.value } }));
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><form onSubmit={save} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-xl font-bold">{modal.business ? 'Edit Business' : 'Add Business'}</h2>{modalError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{modalError}</div>}<div className="mt-5 grid gap-4 sm:grid-cols-2"><Input label="Business Name" value={modal.form.name} onChange={set('name')} /><Input label="Owner Name" value={modal.form.ownerName} onChange={set('ownerName')} /><Input label="Email" type="email" value={modal.form.email} onChange={set('email')} /><Input label="Phone" value={modal.form.phone} onChange={set('phone')} /><Input label="Address" value={modal.form.address} onChange={set('address')} span />{!modal.business && <Input label="Password" type="password" value={modal.form.password} onChange={set('password')} />}{modal.business && <Input label="New Password (optional)" type="password" value={modal.form.password || ''} onChange={set('password')} placeholder="Leave blank to keep existing password" required={false} />}<label className="grid gap-2 text-sm font-semibold text-slate-700"><span>Status</span><select value={modal.form.status} onChange={set('status')} className="rounded-lg border border-slate-300 px-4 py-3 font-normal"><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select></label></div><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => { setModalError(''); setModal(null); }}>Cancel</Button><Button type="submit" disabled={mutating}>{mutating ? 'Saving…' : 'Save Business'}</Button></div></form></div>;
}
