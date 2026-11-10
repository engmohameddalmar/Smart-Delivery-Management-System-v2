import { useEffect, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loading from '../../components/common/Loading.jsx';
import Toast from '../../components/common/Toast.jsx';
import { getSettings, updateSettings } from '../../services/settingsService.js';

const textFields = [['businessName', 'Business Name'], ['businessEmail', 'Business Email'], ['businessPhone', 'Business Phone'], ['businessAddress', 'Business Address'], ['supportPhone', 'Support Phone'], ['supportEmail', 'Support Email'], ['logo', 'Logo URL']];
const feeFields = [['defaultDeliveryFee', 'Default Delivery Fee'], ['minimumDeliveryFee', 'Minimum Delivery Fee'], ['maximumDeliveryFee', 'Maximum Delivery Fee']];
const toggles = [['onlinePaymentEnabled', 'Online Payment'], ['maintenanceMode', 'Maintenance Mode']];

export default function Settings() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  useEffect(() => { getSettings().then(setForm).catch(e => setError(e.response?.data?.message || 'Unable to load settings.')); }, []);
  const save = async e => { e.preventDefault(); try { setForm(await updateSettings(form)); setToast({ message: 'Settings updated successfully.' }); setError(''); } catch (e) { setError(e.response?.data?.message || 'Unable to update settings.'); } };
  if (!form && !error) return <Loading label="Loading settings..." />;
  if (!form) return <ErrorState message={error} />;
  return <form onSubmit={save}><Toast {...toast} onClose={() => setToast(null)} /><div className="flex justify-between gap-4"><div><h1 className="text-2xl font-extrabold">System Settings</h1><p className="mt-1 text-sm text-slate-500">Business, delivery, payment, and system configuration.</p></div><Button type="submit">Save Settings</Button></div>{error && <div className="mt-4"><ErrorState message={error} /></div>}<div className="mt-6 grid gap-6 xl:grid-cols-2"><Card className="p-6"><h2 className="font-bold">Business Information</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{textFields.map(([key, label]) => <label className={`text-sm font-semibold ${key.includes('Address') ? 'sm:col-span-2' : ''}`} key={key}>{label}<input value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-2 w-full rounded-lg border px-3 py-2" /></label>)}</div></Card><Card className="p-6"><h2 className="font-bold">Delivery Settings</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{feeFields.map(([key, label]) => <label className="text-sm font-semibold" key={key}>{label}<input type="number" min="0" step="0.01" value={form[key]} onChange={e => setForm({ ...form, [key]: Number(e.target.value) })} className="mt-2 w-full rounded-lg border px-3 py-2" /></label>)}{[['currency', 'Currency'], ['timezone', 'Timezone']].map(([key, label]) => <label className="text-sm font-semibold" key={key}>{label}<input value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-2 w-full rounded-lg border px-3 py-2" /></label>)}</div></Card><Card className="p-6 xl:col-span-2"><h2 className="font-bold">Payment & System</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{toggles.map(([key, label]) => <label className="flex items-center justify-between rounded-xl border p-4 text-sm font-semibold" key={key}>{label}<input type="checkbox" checked={!!form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} className="h-5 w-5 accent-indigo-600" /></label>)}</div></Card></div></form>;
}
