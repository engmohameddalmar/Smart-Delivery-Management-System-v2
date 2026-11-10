import mongoose from 'mongoose';
import Order, { paymentStatuses, statuses } from '../models/Order.js';
import User from '../models/User.js';
import { createNotification, notifyAdmins } from '../utils/createNotification.js';
import { createTrackingEvent } from '../utils/createTrackingEvent.js';
import { logActivity } from '../utils/activityLogger.js';
import { getSettingsDocument } from './settingsController.js';
import { ensurePendingPaymentForOrder } from './paymentController.js';

const phonePattern = /^\+?[0-9\s()-]{7,20}$/;
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const editable = ['pickupAddress', 'deliveryAddress', 'recipientName', 'recipientPhone', 'packageDescription', 'quantity', 'weight', 'deliveryFee', 'notes'];
const safePopulate = [{ path: 'customer', select: 'name email phone avatar status' }, { path: 'business', select: 'name email phone avatar status' }, { path: 'assignedDriver', select: 'name email phone avatar status' }];
const invalidId = id => !mongoose.Types.ObjectId.isValid(id);

function validateOrderInput(body) {
  const required = ['recipientName', 'recipientPhone', 'pickupAddress', 'deliveryAddress', 'packageDescription', 'quantity', 'weight', 'deliveryFee'];
  if (required.some(field => body[field] === undefined || body[field] === null || String(body[field]).trim() === '')) return 'All required delivery fields must be provided';
  if (!phonePattern.test(String(body.recipientPhone))) return 'Please provide a valid recipient phone number';
  if (!Number.isFinite(Number(body.quantity)) || Number(body.quantity) <= 0) return 'Quantity must be greater than zero';
  for (const field of ['weight', 'deliveryFee']) if (!Number.isFinite(Number(body[field])) || Number(body[field]) < 0) return `${field} must be zero or greater`;
  if (body.paymentMethod && body.paymentMethod !== 'Online Payment') return 'Only online payment is supported';
  return null;
}

async function resolveCustomer(request, response) {
  const customerId = request.user.role === 'customer' ? request.user._id : request.body.customer;
  if (!customerId || invalidId(customerId)) { response.status(400).json({ success: false, message: 'A valid customer is required' }); return null; }
  const customer = await User.findOne({ _id: customerId, role: 'customer', status: 'active', isDeleted: false });
  if (!customer) { response.status(400).json({ success: false, message: 'Selected customer does not exist' }); return null; }
  return customer;
}

export async function createOrder(request, response, next) {
  try {
    if (request.user.role === 'customer') {
      return response.status(403).json({ success: false, message: 'Customers cannot create orders. Businesses must create customer orders.' });
    }
    const settings = await getSettingsDocument();
    if (request.user.role === 'customer' && !settings.allowCustomerOrderCreation) return response.status(403).json({ success: false, message: 'Customer order creation is currently disabled' });
    if (!settings.onlinePaymentEnabled) return response.status(400).json({ success: false, message: 'Online payment is currently disabled' });
    const validation = validateOrderInput(request.body);
    if (validation) return response.status(400).json({ success: false, message: validation });
    const customer = await resolveCustomer(request, response);
    if (!customer) return;
    const values = Object.fromEntries(editable.map(field => [field, request.body[field]]));
    const deliveryFee = Number(values.deliveryFee || 0);
    const order = await Order.create({ ...values, totalAmount: deliveryFee, paymentMethod: 'Online Payment', customer: customer._id, orderStatus: 'Pending', paymentStatus: 'Pending' });
    const payment = await ensurePendingPaymentForOrder(order);
    await createTrackingEvent({ order: order._id, status: 'Pending', updatedBy: request.user._id });
    await createNotification({ user: customer._id, type: 'order', title: 'Order Created', message: `Your delivery order ${order.orderId} has been created. Payment is pending.`, order: order._id });
    if (request.user.role === 'customer') await notifyAdmins({ type: 'order', title: 'New Customer Delivery Order', message: `Order ${order.orderId} was created.`, order: order._id });
    await order.populate(safePopulate);
    response.status(201).json({ success: true, message: 'Order created successfully', data: order, payment });
  } catch (error) { next(error); }
}

async function buildFilter(query, customerId = null) {
  const filter = customerId ? { customer: customerId } : {};
  if (query.status) { if (!statuses.includes(query.status)) throw Object.assign(new Error('Invalid order status'), { statusCode: 400 }); filter.orderStatus = query.status; }
  if (query.paymentStatus) { if (!paymentStatuses.includes(query.paymentStatus)) throw Object.assign(new Error('Invalid payment status'), { statusCode: 400 }); filter.paymentStatus = query.paymentStatus; }
  if (query.customer) { if (invalidId(query.customer)) throw Object.assign(new Error('Invalid customer ID'), { statusCode: 400 }); filter.customer = query.customer; }
  if (query.date) { const start = new Date(`${query.date}T00:00:00.000Z`); if (Number.isNaN(start.getTime())) throw Object.assign(new Error('Invalid date'), { statusCode: 400 }); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1); filter.createdAt = { $gte: start, $lt: end }; }
  if (query.search?.trim()) {
    const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
    const customers = await User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id');
    const search = { $or: [{ orderId: regex }, { trackingNumber: regex }, { recipientName: regex }, { recipientPhone: regex }, { customerName: regex }, { customerPhone: regex }, { customer: { $in: customers.map(user => user._id) } }] };
    if (customerId) filter.$and = [search]; else Object.assign(filter, search);
  }
  return filter;
}

async function listOrders(request, response, customerId = null) {
  const page = Math.max(Number.parseInt(request.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(request.query.limit, 10) || 10, 1), 100);
  const filter = await buildFilter(request.query, customerId);
  const sortFields = ['createdAt', 'updatedAt', 'totalAmount', 'deliveryFee', 'orderId', 'orderStatus', 'paymentStatus'];
  const sortBy = sortFields.includes(request.query.sortBy) ? request.query.sortBy : 'createdAt';
  const order = request.query.order === 'asc' ? 1 : -1;
  const [data, total] = await Promise.all([Order.find(filter).populate(safePopulate).sort({ [sortBy]: order }).skip((page - 1) * limit).limit(limit), Order.countDocuments(filter)]);
  response.json({ success: true, message: 'Orders retrieved successfully', data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function getOrders(request, response, next) { try { await listOrders(request, response, request.user.role === 'customer' ? request.user._id : null); } catch (error) { if (error.statusCode) return response.status(error.statusCode).json({ success: false, message: error.message }); next(error); } }
export async function getCustomerOrders(request, response, next) { try { await listOrders(request, response, request.user._id); } catch (error) { if (error.statusCode) return response.status(error.statusCode).json({ success: false, message: error.message }); next(error); } }

export async function getOrderById(request, response, next) {
  try {
    if (invalidId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid order ID' });
    const filter = { _id: request.params.id };
    if (request.user.role === 'customer') filter.customer = request.user._id;
    const order = await Order.findOne(filter).populate(safePopulate);
    if (!order) return response.status(404).json({ success: false, message: 'Order not found' });
    response.json({ success: true, message: 'Order retrieved successfully', data: order });
  } catch (error) { next(error); }
}

export async function updateOrder(request, response, next) {
  try {
    if (invalidId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid order ID' });
    const validation = validateOrderInput(request.body);
    if (validation) return response.status(400).json({ success: false, message: validation });
    const order = await Order.findById(request.params.id);
    if (!order) return response.status(404).json({ success: false, message: 'Order not found' });
    for (const field of editable) order[field] = request.body[field] ?? (field === 'notes' ? '' : order[field]);
    order.totalAmount = Number(order.deliveryFee || 0);
    order.paymentMethod = 'Online Payment';
    await order.save();
    await ensurePendingPaymentForOrder(order);
    await order.populate(safePopulate);
    response.json({ success: true, message: 'Order updated successfully', data: order });
  } catch (error) { next(error); }
}

export async function confirmOrder(request, response, next) {
  try {
    if (invalidId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid order ID' });
    const order = await Order.findOne({ _id: request.params.id, orderStatus: 'Pending' });
    if (!order) { const exists = await Order.exists({ _id: request.params.id }); return response.status(exists ? 400 : 404).json({ success: false, message: exists ? 'Only pending orders can be confirmed' : 'Order not found' }); }
    if (order.paymentStatus !== 'Paid') return response.status(409).json({ success: false, message: 'Order cannot be confirmed until online payment is paid' });
    order.orderStatus = 'Confirmed';
    await order.save();
    await createTrackingEvent({ order: order._id, status: 'Confirmed', updatedBy: request.user._id });
    if (order.customer) await createNotification({ user: order.customer, type: 'order', title: 'Order Confirmed', message: 'Your delivery order has been confirmed.', order: order._id });
    if (order.business) await createNotification({ user: order.business, type: 'order', title: 'Order Confirmed', message: 'Your business delivery order has been confirmed.', order: order._id });
    response.json({ success: true, message: 'Order confirmed successfully', data: order });
  } catch (error) { next(error); }
}

export async function cancelOrder(request, response, next) {
  try {
    if (invalidId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid order ID' });
    if (!request.body.reason?.trim()) return response.status(400).json({ success: false, message: 'Cancellation reason is required' });
    const order = await Order.findOneAndUpdate({ _id: request.params.id, orderStatus: { $in: ['Pending', 'Confirmed'] } }, { $set: { orderStatus: 'Cancelled', cancellationReason: request.body.reason.trim(), paymentStatus: 'Cancelled' } }, { new: true });
    if (!order) { const exists = await Order.exists({ _id: request.params.id }); return response.status(exists ? 400 : 404).json({ success: false, message: exists ? 'Order cannot be cancelled in its current status' : 'Order not found' }); }
    await createTrackingEvent({ order: order._id, status: 'Cancelled', updatedBy: request.user._id });
    if (order.customer) await createNotification({ user: order.customer, type: 'order', title: 'Order Cancelled', message: 'Your delivery order has been cancelled.', order: order._id });
    if (order.business) await createNotification({ user: order.business, type: 'order', title: 'Order Cancelled', message: 'Your business delivery order has been cancelled.', order: order._id });
    await logActivity(request, { action: 'order.cancelled', entityType: 'Order', entityId: order._id, description: `Cancelled order ${order.orderId}` });
    response.json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (error) { next(error); }
}
