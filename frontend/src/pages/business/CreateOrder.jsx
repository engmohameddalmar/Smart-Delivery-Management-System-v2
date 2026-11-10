import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import api from '../../services/api.js';

const initial = { customerId: '', customerName: '', customerPhone: '', deliveryAddress: '', orderItems: '', quantity: 1, deliveryFee: 0, totalAmount: 0, notes: '', paymentMethod: 'Online Payment' };

export default function CreateOrder() {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/business/customers', { params: { limit: 200 } })
      .then(response => setCustomers(Array.isArray(response.data.data) ? response.data.data : []))
      .catch(() => setCustomers([]));
  }, []);

  const selectedCustomer = useMemo(() => customers.find(customer => customer.id === form.customerId), [customers, form.customerId]);

  useEffect(() => {
    if (!selectedCustomer) return;
    setForm(current => ({
      ...current,
      customerName: selectedCustomer.name || current.customerName,
      customerPhone: selectedCustomer.phone || current.customerPhone,
    }));
  }, [selectedCustomer]);

  const set = key => event => setForm(current => ({ ...current, [key]: event.target.value, ...(key === 'deliveryFee' ? { totalAmount: Number(event.target.value || 0) } : {}), paymentMethod: 'Online Payment' }));

  const submit = async event => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await api.post('/business/orders', form);
      const id = response.data.data?._id || response.data.data?.id;
      navigate(`/business/orders/${id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create order.');
    } finally {
      setSubmitting(false);
    }
  };

  const fee = Number(form.deliveryFee || 0);

  return <div><div><h1 className="text-2xl font-bold">Create Business Order</h1><p className="page-subtitle">This delivery-service order will be securely attached to your business account.</p></div><Card className="mt-6 p-6"><form onSubmit={submit} className="grid gap-5 md:grid-cols-2">{error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 md:col-span-2">{error}</div>}<label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2"><span>Select Customer</span><select value={form.customerId} onChange={set('customerId')} className="rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500"><option value="">Choose a business customer</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name} · {customer.phone}</option>)}</select></label><Field label="Customer Name" value={form.customerName} onChange={set('customerName')} /><Field label="Customer Phone" value={form.customerPhone} onChange={set('customerPhone')} /><Field label="Delivery Address" value={form.deliveryAddress} onChange={set('deliveryAddress')} span /><Field label="Package Description" value={form.orderItems} onChange={set('orderItems')} span textarea /><Field label="Quantity" type="number" min="1" value={form.quantity} onChange={set('quantity')} /><Field label="Delivery Fee" type="number" min="0" step="0.01" value={form.deliveryFee} onChange={set('deliveryFee')} /><div className="rounded-xl border bg-slate-50 p-4 md:col-span-2"><p className="text-sm font-semibold">Payment Method: Online Payment</p><p className="mt-2 text-2xl font-extrabold">Total Delivery Amount: ${fee.toFixed(2)}</p><p className="mt-1 text-sm text-slate-500">Only the delivery service fee is charged. No product pricing is used.</p></div><Field label="Notes" value={form.notes} onChange={set('notes')} textarea span /><div className="flex justify-end gap-3 md:col-span-2"><Button variant="secondary" onClick={() => navigate('/business/orders')}>Cancel</Button><Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create Order'}</Button></div></form></Card></div>;
}

function Field({ label, span = false, textarea = false, ...props }) {
  const Input = textarea ? 'textarea' : 'input';
  return <label className={`grid gap-2 text-sm font-semibold text-slate-700 ${span ? 'md:col-span-2' : ''}`}><span>{label}</span><Input {...props} className="rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500" rows={textarea ? 4 : undefined} required={!['Notes'].includes(label)} /></label>;
}
