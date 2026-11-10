import { Eye, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import ConfirmationModal from '../common/ConfirmationModal.jsx';
import ErrorState from '../common/ErrorState.jsx';
import Loading from '../common/Loading.jsx';
import Toast from '../common/Toast.jsx';
import api from '../../services/api.js';

const statusTones = { active: 'success', inactive: 'neutral', suspended: 'danger' };

export default function UserManagement({ title = 'Users', fixedRole = '', detailsBase = '/admin/users', allowDelete = true, allowCreate = false, createRole = fixedRole || 'customer' }) {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState(fixedRole);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState(null);
  const [createModal, setCreateModal] = useState(null);
  const [mutating, setMutating] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/users', { params: { page, limit: 10, search: query || undefined, role: fixedRole || role || undefined, status: status || undefined } });
      setUsers(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, query, role, status, fixedRole]);

  useEffect(() => { load(); }, [load]);

  const searchUsers = e => { e.preventDefault(); setPage(1); setQuery(search.trim()); };
  const askStatus = (user, next) => setAction({ type: 'status', user, next });
  const askDelete = user => setAction({ type: 'delete', user });

  const confirm = async () => {
    setMutating(true);
    try {
      if (action.type === 'delete') await api.delete(`/users/${action.user.id}`);
      else await api.patch(`/users/${action.user.id}/status`, { status: action.next });
      setAction(null);
      await load();
      setToast({ tone: 'success', message: 'Action completed successfully.' });
    } catch (err) {
      setToast({ tone: 'error', message: err.response?.data?.message || 'The requested action could not be completed.' });
    } finally {
      setMutating(false);
    }
  };

  const openCreate = () => setCreateModal({ name: '', email: '', phone: '', password: '', address: '', status: 'active' });
  const confirmCreate = async e => {
    e.preventDefault();
    setMutating(true);
    try {
      await api.post('/users', { ...createModal, role: createRole });
      setCreateModal(null);
      await load();
      setToast({ tone: 'success', message: `${title.slice(0, -1)} created successfully.` });
    } catch (err) {
      setToast({ tone: 'error', message: err.response?.data?.message || 'Unable to create user.' });
    } finally {
      setMutating(false);
    }
  };

  return <div>
    <Toast {...toast} onClose={() => setToast(null)} />
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">Manage account details, roles, and access status.</p>
      </div>
      {allowCreate && <Button onClick={openCreate}><Plus size={18} />Create {createRole === 'driver' ? 'Driver' : createRole === 'business' ? 'Business' : 'User'}</Button>}
    </div>
    <form onSubmit={searchUsers} className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto_auto]">
      <input value={search} onChange={e => setSearch(e.target.value)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500" placeholder="Search name, email, or phone" />
      {!fixedRole && <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 text-sm"><option value="">All roles</option><option value="admin">Admin</option><option value="driver">Driver</option><option value="customer">Customer</option></select>}
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select>
      <Button type="submit">Search</Button>
    </form>
    {loading ? <Loading label={`Loading ${title.toLowerCase()}…`} /> : error ? <div className="mt-6"><ErrorState message={error} /></div> : <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Name', 'Email', 'Phone', ...(fixedRole ? [] : ['Role']), 'Status', 'Created', 'Actions'].map(x => <th className="px-5 py-3" key={x}>{x}</th>)}</tr></thead><tbody>{users.map(user => <tr className="border-t" key={user.id}><td className="px-5 py-4 font-semibold">{user.name}</td><td className="px-5 py-4 text-slate-600">{user.email}</td><td className="px-5 py-4 text-slate-600">{user.phone}</td>{!fixedRole && <td className="px-5 py-4 capitalize">{user.role}</td>}<td className="px-5 py-4"><Badge tone={statusTones[user.status]}>{user.status}</Badge></td><td className="px-5 py-4 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td><td className="px-5 py-4"><div className="flex items-center gap-1"><Link title="View" className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50" to={`${detailsBase}/${user.id}`}><Eye size={17} /></Link><Link title="Edit" className="rounded-md p-2 text-slate-600 hover:bg-slate-100" to={`/admin/users/${user.id}/edit`}><Pencil size={17} /></Link>{user.status !== 'active' && <button title="Activate" className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50" onClick={() => askStatus(user, 'active')}><ShieldCheck size={17} /></button>}{user.status === 'active' && <><button className="rounded-md px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50" onClick={() => askStatus(user, 'inactive')}>Deactivate</button><button className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50" onClick={() => askStatus(user, 'suspended')}>Suspend</button></>}{allowDelete && <button title="Delete" className="rounded-md p-2 text-red-600 hover:bg-red-50" onClick={() => askDelete(user)}><Trash2 size={17} /></button>}</div></td></tr>)}</tbody></table></div>{!users.length && <p className="p-8 text-center text-sm text-slate-500">No matching users found.</p>}<div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-sm"><span className="text-slate-500">{pagination.total || 0} total results · Page {pagination.page || page} of {Math.max(pagination.pages || 0, 1)}</span><div className="flex gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</Button><Button variant="secondary" disabled={page >= (pagination.pages || 0)} onClick={() => setPage(value => value + 1)}>Next</Button></div></div></div>}
    <ConfirmationModal open={Boolean(action)} title={action?.type === 'delete' ? 'Delete user' : 'Change user status'} message={action?.type === 'delete' ? 'Are you sure you want to delete this user?' : `Are you sure you want to ${action?.next === 'active' ? 'activate' : action?.next} this user?`} confirmLabel={action?.type === 'delete' ? 'Delete' : 'Confirm'} danger={action?.type === 'delete' || action?.next === 'suspended'} loading={mutating} onCancel={() => setAction(null)} onConfirm={confirm} />
    {createModal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><form onSubmit={confirmCreate} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-xl font-bold">Create {createRole === 'driver' ? 'Driver' : createRole === 'business' ? 'Business' : 'User'}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><input className="rounded-lg border px-4 py-3" placeholder="Name" value={createModal.name} onChange={e => setCreateModal({ ...createModal, name: e.target.value })} /><input className="rounded-lg border px-4 py-3" placeholder="Email" type="email" value={createModal.email} onChange={e => setCreateModal({ ...createModal, email: e.target.value })} /><input className="rounded-lg border px-4 py-3" placeholder="Phone" value={createModal.phone} onChange={e => setCreateModal({ ...createModal, phone: e.target.value })} /><input className="rounded-lg border px-4 py-3" placeholder="Password" type="password" value={createModal.password} onChange={e => setCreateModal({ ...createModal, password: e.target.value })} /><input className="rounded-lg border px-4 py-3 sm:col-span-2" placeholder="Address" value={createModal.address} onChange={e => setCreateModal({ ...createModal, address: e.target.value })} /></div><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" type="button" onClick={() => setCreateModal(null)}>Cancel</Button><Button type="submit" disabled={mutating}>{mutating ? 'Saving…' : 'Create'}</Button></div></form></div>}
  </div>;
}
