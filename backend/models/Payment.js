import mongoose from 'mongoose';

const methods = ['Online Payment'];
const statuses = ['Pending', 'Paid', 'Failed', 'Cancelled', 'Refunded'];
const Counter = mongoose.models.Counter || mongoose.model('Counter', new mongoose.Schema({ _id: String, sequence: { type: Number, default: 0 } }));

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true, index: true, immutable: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, index: true, immutable: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true, immutable: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true, immutable: true },
  amount: { type: Number, required: true, min: 0, immutable: true },
  currency: { type: String, default: 'USD', trim: true, uppercase: true, immutable: true },
  paymentMethod: { type: String, enum: methods, default: 'Online Payment', required: true, index: true, immutable: true },
  method: { type: String, enum: ['online'], default: 'online', required: true, index: true, immutable: true },
  status: { type: String, enum: statuses, default: 'Pending', index: true },
  transactionId: { type: String, default: null, trim: true },
  transactionReference: { type: String, default: null, trim: true, index: true },
  paymentReference: { type: String, default: null, trim: true, index: true },
  paidAt: Date,
  failureReason: { type: String, default: '', trim: true },
  refundAmount: { type: Number, default: 0, min: 0 },
  refundReference: { type: String, default: '', trim: true },
  refundedAt: Date,
  notes: { type: String, default: '', trim: true },
}, { timestamps: true });

paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paymentMethod: 1, createdAt: -1 });
paymentSchema.pre('validate', async function generatePaymentId() {
  if (!this.isNew || this.paymentId) return;
  const year = new Date().getUTCFullYear();
  const counter = await Counter.findByIdAndUpdate(`payments:${year}`, { $inc: { sequence: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  const suffix = String(counter.sequence).padStart(6, '0');
  this.paymentId = `PAY-${year}-${suffix}`;
  this.paymentReference = `PAYREF-${year}-${suffix}`;
  this.transactionReference = null;
});

export { methods as paymentMethods, statuses as paymentStatuses };
export default mongoose.model('Payment', paymentSchema);
