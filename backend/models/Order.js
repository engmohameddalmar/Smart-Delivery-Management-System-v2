import mongoose from 'mongoose';

const statuses = ['Pending','Confirmed','Assigned','Accepted','Picked Up','In Transit','Out for Delivery','Delivered','Failed','Cancelled'];
const paymentStatuses = ['Pending','Paid','Failed','Cancelled','Refunded'];
const paymentMethods = ['Online Payment'];
const counterSchema = new mongoose.Schema({ _id: String, sequence: { type: Number, default: 0 } });
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, index: true, immutable: true },
  // Kept for compatibility with the original database's unique orderNumber index.
  orderNumber: { type: String, immutable: true },
  trackingNumber: { type: String, unique: true, index: true, immutable: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true, immutable: true },
  customerName: { type: String, default: '', trim: true },
  customerPhone: { type: String, default: '', trim: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  pickupAddress: { type: String, required: true, trim: true },
  deliveryAddress: { type: String, required: true, trim: true },
  recipientName: { type: String, required: true, trim: true },
  recipientPhone: { type: String, required: true, trim: true },
  packageDescription: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  weight: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: paymentMethods, default: 'Online Payment', required: true },
  paymentStatus: { type: String, enum: paymentStatuses, default: 'Pending', index: true },
  orderStatus: { type: String, enum: statuses, default: 'Pending', index: true },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  notes: { type: String, default: '', trim: true },
  cancellationReason: { type: String, default: '', trim: true },
}, { timestamps: true });

orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ business: 1, createdAt: -1 });
orderSchema.index({ assignedDriver: 1, createdAt: -1 });

orderSchema.pre('validate', async function generateIdentifiers() {
  if (!this.isNew) return;
  if (this.orderId && this.trackingNumber) {
    if (!this.orderNumber) this.orderNumber = this.orderId;
    return;
  }
  const year = new Date().getUTCFullYear();
  const counter = await Counter.findByIdAndUpdate(`orders:${year}`, { $inc: { sequence: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  const suffix = String(counter.sequence).padStart(6, '0');
  this.orderId = `ORD-${year}-${suffix}`;
  this.orderNumber = this.orderId;
  this.trackingNumber = `SD-${year}-${suffix}`;
});

export { paymentMethods, paymentStatuses, statuses };
export default mongoose.model('Order', orderSchema);
