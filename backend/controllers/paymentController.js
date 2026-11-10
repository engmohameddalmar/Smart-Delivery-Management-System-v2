import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Payment, { paymentStatuses } from '../models/Payment.js';
import User from '../models/User.js';
import { createNotification, notifyAdmins } from '../utils/createNotification.js';
import { createTrackingEvent } from '../utils/createTrackingEvent.js';
import { createOnlinePaymentSession, verifyOnlinePayment } from '../services/paymentService.js';

const invalid = id => !mongoose.Types.ObjectId.isValid(id);
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const populate = [{ path: 'order', select: 'orderId trackingNumber assignedDriver orderStatus paymentStatus deliveryFee totalAmount business customer customerName customerPhone' }, { path: 'business', select: 'name email phone' }, { path: 'customer', select: 'name email phone' }];

function ownsPayment(user, payment) {
  if (user.role === 'admin') return true;
  if (user.role === 'customer') return String(payment.customer?._id || payment.customer) === String(user._id);
  if (user.role === 'business') return String(payment.business?._id || payment.business) === String(user._id);
  if (user.role === 'driver') return String(payment.order?.assignedDriver) === String(user._id);
  return false;
}

async function notifyPayment(payment, title, message, admins = false) {
  const orderId = payment.order?._id || payment.order;
  const recipients = [payment.customer?._id || payment.customer, payment.business?._id || payment.business].filter(Boolean).map(String);
  await Promise.all([...new Set(recipients)].map(user => createNotification({ user, type: 'payment', title, message, order: orderId, payment: payment._id })));
  if (admins) await notifyAdmins({ type: 'payment', title, message, order: orderId, payment: payment._id });
}

export async function ensurePendingPaymentForOrder(order) {
  let payment = await Payment.findOne({ order: order._id });
  if (payment) return payment;
  payment = await Payment.create({
    order: order._id,
    business: order.business || null,
    customer: order.customer || null,
    amount: Number(order.deliveryFee || 0),
    currency: 'USD',
    paymentMethod: 'Online Payment',
    method: 'online',
    status: 'Pending',
  });
  order.paymentStatus = 'Pending';
  order.paymentMethod = 'Online Payment';
  order.totalAmount = Number(order.deliveryFee || 0);
  await order.save();
  return payment;
}

export async function createPayment(req, res, next) {
  try {
    if (!req.body.orderId || invalid(req.body.orderId)) return res.status(400).json({ success: false, message: 'A valid order is required' });
    const order = await Order.findById(req.body.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (req.user.role === 'customer' && String(order.customer) !== String(req.user._id)) return res.status(404).json({ success: false, message: 'Order not found' });
    if (req.user.role === 'business' && String(order.business) !== String(req.user._id)) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.orderStatus === 'Cancelled') return res.status(400).json({ success: false, message: 'Cancelled orders cannot be paid' });
    const payment = await ensurePendingPaymentForOrder(order);
    await payment.populate(populate);
    res.status(payment.createdAt.getTime() === payment.updatedAt.getTime() ? 201 : 200).json({ success: true, message: 'Payment ready', data: payment });
  } catch (e) { if (e?.code === 11000) return res.status(409).json({ success: false, message: 'A payment already exists for this order' }); next(e); }
}

async function buildFilter(q, user = null) {
  const filter = {};
  if (user?.role === 'customer') filter.customer = user._id;
  if (user?.role === 'business') filter.business = user._id;
  if (q.status) { if (!paymentStatuses.includes(q.status)) throw Object.assign(new Error('Invalid payment status'), { statusCode: 400 }); filter.status = q.status; }
  if (q.paymentMethod && q.paymentMethod !== 'Online Payment') throw Object.assign(new Error('Only online payment is supported'), { statusCode: 400 });
  if (q.customer) { if (invalid(q.customer)) throw Object.assign(new Error('Invalid customer ID'), { statusCode: 400 }); filter.customer = q.customer; }
  if (q.business) { if (invalid(q.business)) throw Object.assign(new Error('Invalid business ID'), { statusCode: 400 }); filter.business = q.business; }
  if (q.date) { const start = new Date(`${q.date}T00:00:00.000Z`); if (Number.isNaN(start.getTime())) throw Object.assign(new Error('Invalid date'), { statusCode: 400 }); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1); filter.createdAt = { $gte: start, $lt: end }; }
  if (q.search?.trim()) {
    const regex = new RegExp(escapeRegex(q.search.trim()), 'i');
    const [orders, users] = await Promise.all([Order.find({ orderId: regex }).select('_id'), User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id')]);
    filter.$or = [{ paymentId: regex }, { transactionReference: regex }, { paymentReference: regex }, { order: { $in: orders.map(x => x._id) } }, { customer: { $in: users.map(x => x._id) } }, { business: { $in: users.map(x => x._id) } }];
  }
  return filter;
}

async function list(req, res, user = null) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1), limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100), filter = await buildFilter(req.query, user);
  const [data, total] = await Promise.all([Payment.find(filter).populate(populate).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Payment.countDocuments(filter)]);
  res.json({ success: true, message: 'Payments retrieved successfully', data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function getPayments(req, res, next) { try { await list(req, res); } catch (e) { if (e.statusCode) return res.status(e.statusCode).json({ success: false, message: e.message }); next(e); } }
export async function getMyPayments(req, res, next) { try { await list(req, res, req.user); } catch (e) { if (e.statusCode) return res.status(e.statusCode).json({ success: false, message: e.message }); next(e); } }

export async function getPaymentById(req, res, next) {
  try {
    if (invalid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    const payment = await Payment.findById(req.params.id).populate(populate);
    if (!payment || !ownsPayment(req.user, payment)) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, message: 'Payment retrieved successfully', data: payment });
  } catch (e) { next(e); }
}

export async function getPaymentByOrder(req, res, next) {
  try {
    if (invalid(req.params.orderId)) return res.status(400).json({ success: false, message: 'Invalid order ID' });
    const payment = await Payment.findOne({ order: req.params.orderId }).populate(populate);
    if (!payment || !ownsPayment(req.user, payment)) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, message: 'Payment retrieved successfully', data: payment });
  } catch (e) { next(e); }
}

export async function initiateOnlinePayment(req, res, next) {
  try {
    if (invalid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    const payment = await Payment.findById(req.params.id).populate(populate);
    if (!payment || !ownsPayment(req.user, payment)) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status !== 'Pending' && payment.status !== 'Failed') return res.status(409).json({ success: false, message: 'Only pending or failed payments can be paid' });
    if (payment.status === 'Failed') { payment.status = 'Pending'; payment.failureReason = ''; await payment.save(); }
    const session = await createOnlinePaymentSession({ payment, order: payment.order });
    if (!session.configured) return res.status(501).json({ success: false, message: session.message, data: { payment } });
    res.json({ success: true, message: 'Online payment session created', data: { payment, session } });
  } catch (e) { next(e); }
}

export async function verifyPayment(req, res, next) {
  try {
    if (invalid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    const result = await verifyOnlinePayment({ payment, body: req.body });
    if (!result.configured) return res.status(501).json({ success: false, message: result.message });
    if (!result.verified) return res.status(400).json({ success: false, message: result.message || 'Payment verification failed' });
    payment.status = 'Paid'; payment.transactionId = result.transactionId; payment.transactionReference = result.transactionReference; payment.paidAt = new Date();
    await payment.save();
    await Order.findByIdAndUpdate(payment.order, { $set: { paymentStatus: 'Paid' } });
    await createTrackingEvent({ order: payment.order, status: 'Paid', message: 'Online delivery payment has been completed.', updatedBy: req.user?._id });
    await notifyPayment(payment, 'Delivery Payment Successful', 'Your delivery payment was successful.', true);
    await payment.populate(populate);
    res.json({ success: true, message: 'Payment verified successfully', data: payment });
  } catch (e) { next(e); }
}

export async function markPaymentFailed(req, res, next) {
  try {
    if (!req.body.failureReason?.trim()) return res.status(400).json({ success: false, message: 'Failure reason is required' });
    if (invalid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    const payment = await Payment.findOneAndUpdate({ _id: req.params.id, status: 'Pending' }, { $set: { status: 'Failed', failureReason: req.body.failureReason.trim() } }, { new: true });
    if (!payment) { const exists = await Payment.exists({ _id: req.params.id }); return res.status(exists ? 409 : 404).json({ success: false, message: exists ? 'Payment is not pending' : 'Payment not found' }); }
    await Order.findByIdAndUpdate(payment.order, { $set: { paymentStatus: 'Failed' } });
    await createTrackingEvent({ order: payment.order, status: 'Failed', message: 'Online payment failed.', updatedBy: req.user._id });
    await notifyPayment(payment, 'Delivery Payment Failed', 'Your delivery payment failed. Please try again.', true);
    await payment.populate(populate);
    res.json({ success: true, message: 'Payment marked as failed', data: payment });
  } catch (e) { next(e); }
}

export async function markPaymentPaid(req, res, next) {
  try {
    if (invalid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    const payment = await Payment.findOne({ _id: req.params.id, status: { $in: ['Pending', 'Failed'] } }).populate(populate);
    if (!payment) {
      const exists = await Payment.exists({ _id: req.params.id });
      return res.status(exists ? 409 : 404).json({ success: false, message: exists ? 'Payment is not eligible to be marked as paid' : 'Payment not found' });
    }
    const transactionId = req.body.transactionId?.trim() || `MANUAL-${Date.now()}`;
    const paymentReference = req.body.paymentReference?.trim() || payment.paymentReference || payment.paymentId;
    payment.status = 'Paid';
    payment.transactionId = transactionId;
    payment.transactionReference = req.body.transactionReference?.trim() || transactionId;
    payment.paymentReference = paymentReference;
    payment.paidAt = new Date();
    payment.failureReason = '';
    await payment.save();
    await Order.findByIdAndUpdate(payment.order, { $set: { paymentStatus: 'Paid' } });
    await createTrackingEvent({ order: payment.order, status: 'Paid', message: 'Payment has been confirmed by admin.', updatedBy: req.user._id });
    await notifyPayment(payment, 'Delivery Payment Confirmed', 'Your delivery payment was confirmed by the admin.', true);
    await payment.populate(populate);
    res.json({ success: true, message: 'Payment marked as paid', data: payment });
  } catch (e) { next(e); }
}

export async function cancelPayment(req, res, next) {
  try {
    if (invalid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    const payment = await Payment.findOneAndUpdate({ _id: req.params.id, status: { $in: ['Pending', 'Failed'] } }, { $set: { status: 'Cancelled' } }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Pending payment not found' });
    await Order.findByIdAndUpdate(payment.order, { $set: { paymentStatus: 'Cancelled' } });
    await payment.populate(populate);
    res.json({ success: true, message: 'Payment cancelled', data: payment });
  } catch (e) { next(e); }
}

export async function refundPayment(req, res, next) {
  try {
    const amount = Number(req.body.refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, message: 'A valid refund amount is required' });
    if (invalid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    const existing = await Payment.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (existing.status !== 'Paid') return res.status(409).json({ success: false, message: 'Only paid payments can be refunded' });
    if (amount > existing.amount) return res.status(400).json({ success: false, message: 'Refund amount cannot exceed the paid amount' });
    existing.status = 'Refunded'; existing.refundAmount = amount; existing.refundReference = req.body.refundReference?.trim() || ''; existing.refundedAt = new Date();
    await existing.save();
    await Order.findByIdAndUpdate(existing.order, { $set: { paymentStatus: 'Refunded' } });
    await createTrackingEvent({ order: existing.order, status: 'Refunded', message: 'Delivery payment has been refunded.', updatedBy: req.user._id });
    await notifyPayment(existing, 'Delivery Payment Refunded', 'Your delivery payment has been refunded.', true);
    await existing.populate(populate);
    res.json({ success: true, message: 'Payment refunded successfully', data: existing });
  } catch (e) { next(e); }
}

export async function getPaymentStats(_req, res, next) {
  try {
    const rows = await Payment.aggregate([{ $group: { _id: null, totalPayments: { $sum: 1 }, paidPayments: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] } }, pendingPayments: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } }, failedPayments: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } }, cancelledPayments: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } }, refundedPayments: { $sum: { $cond: [{ $eq: ['$status', 'Refunded'] }, 1, 0] } }, totalDeliveryRevenue: { $sum: '$amount' }, paidDeliveryFees: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0] } }, pendingDeliveryFees: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, '$amount', 0] } }, refundedDeliveryFees: { $sum: { $cond: [{ $eq: ['$status', 'Refunded'] }, '$refundAmount', 0] } } } }]);
    const data = rows[0] || { totalPayments: 0, paidPayments: 0, pendingPayments: 0, failedPayments: 0, cancelledPayments: 0, refundedPayments: 0, totalDeliveryRevenue: 0, paidDeliveryFees: 0, pendingDeliveryFees: 0, refundedDeliveryFees: 0 };
    delete data._id; res.json({ success: true, data });
  } catch (e) { next(e); }
}

export async function getDriverPaymentSummary(_req, res) {
  res.json({ success: true, data: { paymentMethod: 'Online Payment', message: 'Drivers do not collect delivery payments.' } });
}
