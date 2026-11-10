import Button from '../common/Button.jsx';
import ErrorState from '../common/ErrorState.jsx';
import Input from '../common/Input.jsx';
import { recordId } from '../../utils/records.js';

export const emptyOrder = { customer: '', recipientName: '', recipientPhone: '', pickupAddress: '', deliveryAddress: '', packageDescription: '', quantity: 1, weight: 0, deliveryFee: 0, totalAmount: 0, paymentMethod: 'Online Payment', notes: '' };

export function validateOrder(form, needsCustomer = false) {
  if (needsCustomer && !form.customer) return 'Please select a customer.';
  for (const field of ['recipientName', 'recipientPhone', 'pickupAddress', 'deliveryAddress', 'packageDescription']) if (!String(form[field] || '').trim()) return 'Complete all required delivery fields.';
  if (!/^\+?[0-9\s()-]{7,20}$/.test(String(form.recipientPhone).trim())) return 'Enter a valid recipient phone number.';
  if (!Number.isFinite(Number(form.quantity)) || Number(form.quantity) <= 0) return 'Quantity must be greater than zero.';
  for (const field of ['weight', 'deliveryFee']) if (!Number.isFinite(Number(form[field])) || Number(form[field]) < 0) return 'Weight and delivery fee cannot be negative.';
  return '';
}

export default function OrderForm({ form, setForm, error, submitting, onSubmit, customers = null, submitLabel = 'Create Order' }) {
  const change = event => {
    const { name, value, type } = event.target;
    setForm(current => {
      const next = { ...current, [name]: type === 'number' ? Number(value) : value, paymentMethod: 'Online Payment' };
      if (name === 'deliveryFee') next.totalAmount = Number(value || 0);
      return next;
    });
  };
  const deliveryFee = Number(form.deliveryFee || 0);
  return <form onSubmit={onSubmit} className="space-y-6">
    {error && <ErrorState message={error} />}
    {customers !== null && <div><label className="field-label" htmlFor="customer">Customer</label><select required id="customer" name="customer" value={form.customer} onChange={change} className="w-full rounded-lg border px-4 py-3 text-sm"><option value="">Select a customer</option>{customers.map(user => { const id = recordId(user); return <option value={id} key={id}>{user.name} — {user.email}</option>; })}</select>{!customers.length && <p className="mt-2 text-sm text-amber-700">No active customers are available.</p>}</div>}
    <section><h2 className="mb-4 font-semibold">Customer Information</h2><div className="grid gap-5 md:grid-cols-2"><Input required id="recipientName" name="recipientName" label="Recipient Name" value={form.recipientName} onChange={change} /><Input required id="recipientPhone" name="recipientPhone" label="Recipient Phone" value={form.recipientPhone} onChange={change} placeholder="0612345678" /></div></section>
    <section><h2 className="mb-4 font-semibold">Delivery Information</h2><div className="grid gap-5 md:grid-cols-2"><Input required id="pickupAddress" name="pickupAddress" label="Pickup Address" value={form.pickupAddress} onChange={change} /><Input required id="deliveryAddress" name="deliveryAddress" label="Delivery Address" value={form.deliveryAddress} onChange={change} /></div></section>
    <section><h2 className="mb-4 font-semibold">Package Information</h2><label className="field-label" htmlFor="packageDescription">Package Description</label><textarea required id="packageDescription" name="packageDescription" value={form.packageDescription} onChange={change} rows="3" className="w-full rounded-lg border p-3 text-sm" /><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><Input required id="quantity" name="quantity" label="Quantity" type="number" min="1" value={form.quantity} onChange={change} /><Input required id="weight" name="weight" label="Weight (kg)" type="number" min="0" step="0.01" value={form.weight} onChange={change} /><Input required id="deliveryFee" name="deliveryFee" label="Delivery Fee" type="number" min="0" step="0.01" value={form.deliveryFee} onChange={change} /><Input id="totalAmount" name="totalAmount" label="Total Delivery Amount" type="number" value={deliveryFee} readOnly /></div></section>
    <section className="rounded-2xl border bg-slate-50 p-5"><h2 className="font-semibold">Payment Information</h2><dl className="mt-4 grid gap-4 sm:grid-cols-3"><Info label="Payment Method" value="Online Payment" /><Info label="Delivery Fee" value={`$${deliveryFee.toFixed(2)}`} /><Info label="Total" value={`$${deliveryFee.toFixed(2)}`} /></dl><p className="mt-3 text-sm text-slate-500">You will pay only for the delivery service after creating the order.</p></section>
    <div><label className="field-label" htmlFor="notes">Notes</label><textarea id="notes" name="notes" value={form.notes} onChange={change} rows="3" className="w-full rounded-lg border p-3 text-sm" /></div>
    <Button disabled={submitting || (customers !== null && !customers.length)} type="submit">{submitting ? 'Saving...' : submitLabel}</Button>
  </form>;
}

function Info({ label, value }) { return <div><dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt><dd className="mt-1 text-sm font-bold">{value}</dd></div>; }
