import mongoose from 'mongoose';
import Business from '../models/Business.js';
import Delivery from '../models/Delivery.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { createNotification, notifyAdmins } from '../utils/createNotification.js';
import { createTrackingEvent } from '../utils/createTrackingEvent.js';
import { ensurePendingPaymentForOrder } from './paymentController.js';

const invalidId = id => !mongoose.Types.ObjectId.isValid(id);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const orderPopulate = [
  { path: 'business', select: 'name email phone status address' },
  { path: 'customer', select: 'name email phone avatar status' },
  { path: 'assignedDriver', select: 'name phone avatar status isAvailable' },
];

function pageOptions(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function businessPayload(body, partial = false) {
  const values = {
    name: body.name?.trim(),
    ownerName: body.ownerName?.trim(),
    email: body.email?.trim().toLowerCase(),
    phone: body.phone?.trim(),
    address: body.address?.trim(),
    status: body.status,
  };
  const required = ['name', 'ownerName', 'email', 'phone', 'address'];
  if (!partial) {
    const missing = required.find(key => !values[key]);
    if (missing) return { error: `${missing} is required` };
  }
  if (values.email && !emailPattern.test(values.email)) return { error: 'Invalid email address' };
  if (values.status && !['active', 'inactive', 'suspended'].includes(values.status)) return { error: 'Invalid status' };
  return { values: Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== '')) };
}

async function ordersCountByBusiness(userIds) {
  const counts = await Order.aggregate([{ $match: { business: { $in: userIds } } }, { $group: { _id: '$business', count: { $sum: 1 } } }]);
  return new Map(counts.map(item => [String(item._id), item.count]));
}

function publicBusiness(business, count = 0) {
  const doc = business.toObject ? business.toObject() : business;
  return { ...doc, orderCount: count, id: doc._id };
}

export async function getBusinesses(req, res, next) {
  try {
    const { page, limit, skip } = pageOptions(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search?.trim()) {
      const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
      filter.$or = [{ name: regex }, { ownerName: regex }, { email: regex }, { phone: regex }];
    }
    const [businesses, total] = await Promise.all([
      Business.find(filter).populate('user', 'name email phone status role createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Business.countDocuments(filter),
    ]);
    const countMap = await ordersCountByBusiness(businesses.map(item => item.user?._id || item.user).filter(Boolean));
    res.json({ success: true, data: businesses.map(item => publicBusiness(item, countMap.get(String(item.user?._id || item.user)) || 0)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function createBusiness(req, res, next) {
  let user;
  try {
    const { values, error } = businessPayload(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    const password = req.body.password?.trim();
    if (!password) return res.status(400).json({ success: false, message: 'Password is required' });
    if (String(password).length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    if (await User.exists({ email: values.email, isDeleted: false })) return res.status(409).json({ success: false, message: 'A business with that email already exists' });
    user = await User.create({ name: values.ownerName, email: values.email, phone: values.phone, address: values.address, password, role: 'business', status: values.status || 'active', isAvailable: 'offline' });
    const business = await Business.create({ ...values, user: user._id, status: values.status || 'active' });
    await business.populate('user', 'name email phone status role createdAt');
    res.status(201).json({ success: true, message: 'Business account created successfully', data: publicBusiness(business, 0) });
  } catch (error) {
    if (user?._id) await User.findByIdAndDelete(user._id).catch(() => {});
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'A business with that value already exists' });
    next(error);
  }
}

export async function getBusinessById(req, res, next) {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid business ID' });
    const business = await Business.findById(req.params.id).populate('user', 'name email phone status role createdAt updatedAt');
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
    const [count, recentOrders] = await Promise.all([
      Order.countDocuments({ business: business.user._id }),
      Order.find({ business: business.user._id }).populate(orderPopulate).sort({ createdAt: -1 }).limit(8),
    ]);
    res.json({ success: true, data: { ...publicBusiness(business, count), recentOrders } });
  } catch (error) { next(error); }
}

export async function updateBusiness(req, res, next) {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid business ID' });
    const { values, error } = businessPayload(req.body, true);
    if (error) return res.status(400).json({ success: false, message: error });
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
    Object.assign(business, values);
    await business.save();
    const userSet = {};
    if (values.ownerName) userSet.name = values.ownerName;
    if (values.email) userSet.email = values.email;
    if (values.phone) userSet.phone = values.phone;
    if (values.address) userSet.address = values.address;
    if (values.status) userSet.status = values.status;
    if (Object.keys(userSet).length) await User.findByIdAndUpdate(business.user, { $set: userSet }, { runValidators: true });
    await business.populate('user', 'name email phone status role createdAt');
    res.json({ success: true, message: 'Business updated successfully', data: publicBusiness(business) });
  } catch (error) { if (error?.code === 11000) return res.status(409).json({ success: false, message: 'A record with that value already exists' }); next(error); }
}

export async function updateBusinessStatus(req, res, next) {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid business ID' });
    const { status } = req.body;
    if (!['active', 'inactive', 'suspended'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const business = await Business.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
    await User.findByIdAndUpdate(business.user, { $set: { status } });
    await business.populate('user', 'name email phone status role createdAt');
    res.json({ success: true, message: 'Business status updated successfully', data: publicBusiness(business) });
  } catch (error) { next(error); }
}

export async function resetBusinessPassword(req, res, next) {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid business ID' });
    const password = req.body.password;
    if (!password || String(password).length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
    const user = await User.findById(business.user);
    user.password = password;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    res.json({ success: true, message: 'Business password reset successfully' });
  } catch (error) { next(error); }
}

export async function deleteBusiness(req, res, next) {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid business ID' });
    const business = await Business.findByIdAndUpdate(req.params.id, { $set: { status: 'inactive' } }, { new: true });
    if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
    await User.findByIdAndUpdate(business.user, { $set: { status: 'inactive', isDeleted: true, deletedAt: new Date() } });
    res.json({ success: true, message: 'Business deactivated successfully' });
  } catch (error) { next(error); }
}

async function currentBusinessProfile(userId) {
  return Business.findOne({ user: userId, status: 'active' });
}

export async function getBusinessDashboard(req, res, next) {
  try {
    const business = await currentBusinessProfile(req.user._id);
    if (!business) return res.status(403).json({ success: false, message: 'Business account is inactive or not configured' });
    const [statusCounts, paymentCounts, recentOrders, deliveries] = await Promise.all([
      Order.aggregate([{ $match: { business: req.user._id } }, { $group: { _id: '$orderStatus', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }]),
      Payment.aggregate([{ $match: { business: req.user._id } }, { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }]),
      Order.find({ business: req.user._id }).populate(orderPopulate).sort({ createdAt: -1 }).limit(8),
      Delivery.countDocuments({ order: { $in: await Order.find({ business: req.user._id }).distinct('_id') } }),
    ]);
    const counts = Object.fromEntries(statusCounts.map(item => [item._id, item.count]));
    const payments = Object.fromEntries(paymentCounts.map(item => [item._id, item]));
    const revenue = statusCounts.reduce((sum, item) => sum + (item.revenue || 0), 0);
    res.json({ success: true, data: { business, totalOrders: Object.values(counts).reduce((a, b) => a + b, 0), pendingOrders: counts.Pending || 0, pendingPayments: payments.Pending?.count || 0, paidOrders: payments.Paid?.count || 0, activeOrders: ['Confirmed', 'Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Out for Delivery'].reduce((sum, status) => sum + (counts[status] || 0), 0), completedOrders: counts.Delivered || 0, completedDeliveries: counts.Delivered || 0, cancelledOrders: counts.Cancelled || 0, totalDeliveryFees: revenue, paidDeliveryFees: payments.Paid?.amount || 0, pendingDeliveryFees: payments.Pending?.amount || 0, totalRevenue: revenue, totalDeliveries: deliveries, recentOrders } });
  } catch (error) { next(error); }
}

async function buildBusinessOrderFilter(req, history = false) {
  const filter = { business: req.user._id };
  if (req.query.status) filter.orderStatus = req.query.status;
  if (history) filter.orderStatus = { $in: ['Delivered', 'Failed', 'Cancelled'] };
  if (req.query.search?.trim()) {
    const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ orderId: regex }, { trackingNumber: regex }, { recipientName: regex }, { recipientPhone: regex }, { customerName: regex }, { customerPhone: regex }];
  }
  return filter;
}

export async function getBusinessOrders(req, res, next) {
  try {
    const { page, limit, skip } = pageOptions(req.query);
    const filter = await buildBusinessOrderFilter(req, req.query.history === 'true');
    const [data, total] = await Promise.all([Order.find(filter).populate(orderPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit), Order.countDocuments(filter)]);
    res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getBusinessOrderById(req, res, next) {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid order ID' });
    const order = await Order.findOne({ _id: req.params.id, business: req.user._id }).populate(orderPopulate);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const delivery = await Delivery.findOne({ order: order._id }).populate('driver', 'name phone avatar status isAvailable');
    res.json({ success: true, data: { order, delivery } });
  } catch (error) { next(error); }
}

export async function createBusinessOrder(req, res, next) {
  try {
    const business = await currentBusinessProfile(req.user._id);
    if (!business) return res.status(403).json({ success: false, message: 'Business account is inactive or not configured' });
    const customerId = req.body.customerId?.trim();
    const customerRecord = customerId ? await User.findOne({ _id: customerId, role: 'customer', business: req.user._id, status: 'active', isDeleted: false }) : null;
    if (customerId && !customerRecord) return res.status(404).json({ success: false, message: 'Customer not found in your business account' });
    const customerName = customerRecord?.name || req.body.customerName?.trim() || req.body.recipientName?.trim();
    const customerPhone = customerRecord?.phone || req.body.customerPhone?.trim() || req.body.recipientPhone?.trim();
    const deliveryAddress = req.body.deliveryAddress?.trim();
    const packageDescription = req.body.orderItems?.trim() || req.body.packageDescription?.trim();
    const quantity = Number(req.body.quantity || 1);
    const deliveryFee = Number(req.body.deliveryFee || req.body.totalAmount || req.body.amount || 0);
    if (!customerName || !customerPhone || !deliveryAddress || !packageDescription) return res.status(400).json({ success: false, message: 'Customer name, phone, delivery address, and order items are required' });
    if (!Number.isFinite(quantity) || quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) return res.status(400).json({ success: false, message: 'Delivery fee must be zero or greater' });
    if (req.body.paymentMethod && req.body.paymentMethod !== 'Online Payment') return res.status(400).json({ success: false, message: 'Only online payment is supported' });
    const order = await Order.create({
      business: req.user._id,
      customer: customerRecord?._id || null,
      customerName,
      customerPhone,
      pickupAddress: req.body.pickupAddress?.trim() || business.address,
      deliveryAddress,
      recipientName: customerName,
      recipientPhone: customerPhone,
      packageDescription,
      quantity,
      weight: Number(req.body.weight || 1),
      deliveryFee,
      totalAmount: deliveryFee,
      paymentMethod: 'Online Payment',
      notes: req.body.notes?.trim() || '',
      orderStatus: 'Pending',
      paymentStatus: 'Pending',
    });
    const payment = await ensurePendingPaymentForOrder(order);
    await createTrackingEvent({ order: order._id, status: 'Pending', updatedBy: req.user._id });
    await createNotification({ user: req.user._id, type: 'order', title: 'Order Created', message: `Order ${order.orderId} has been created.`, order: order._id });
    await notifyAdmins({ type: 'order', title: 'New Business Order', message: `${business.name} created order ${order.orderId}.`, order: order._id });
    await order.populate(orderPopulate);
    res.status(201).json({ success: true, message: 'Order created successfully', data: order, payment });
  } catch (error) { next(error); }
}

export async function getBusinessDeliveries(req, res, next) {
  try {
    const { page, limit, skip } = pageOptions(req.query);
    const orderIds = await Order.find({ business: req.user._id }).distinct('_id');
    const filter = { order: { $in: orderIds } };
    if (req.query.status) filter.status = req.query.status;
    const [data, total] = await Promise.all([
      Delivery.find(filter).populate([{ path: 'order', select: 'orderId trackingNumber recipientName recipientPhone deliveryAddress orderStatus paymentStatus totalAmount' }, { path: 'driver', select: 'name phone avatar status isAvailable' }]).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Delivery.countDocuments(filter),
    ]);
    res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getBusinessCustomers(req, res, next) {
  try {
    const { page, limit, skip } = pageOptions(req.query);
    const filter = { role: 'customer', business: req.user._id, isDeleted: false };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search?.trim()) {
      const regex = new RegExp(escapeRegex(req.query.search.trim()), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }
    const [data, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: data.map(user => user.toSafeObject()), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function createBusinessCustomer(req, res, next) {
  try {
    const business = await currentBusinessProfile(req.user._id);
    if (!business) return res.status(403).json({ success: false, message: 'Business account is inactive or not configured' });
    const { name, email, phone, password, address, status } = req.body;
    if (!name?.trim() || !email?.trim() || !phone?.trim()) return res.status(400).json({ success: false, message: 'Name, email, and phone are required' });
    if (!emailPattern.test(email)) return res.status(400).json({ success: false, message: 'Invalid email address' });
    if (!password?.trim()) return res.status(400).json({ success: false, message: 'Password is required' });
    if (String(password).length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail, isDeleted: false })) return res.status(409).json({ success: false, message: 'An account with that email already exists' });
    const customer = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: password.trim(),
      address: typeof address === 'string' ? address.trim() : '',
      role: 'customer',
      business: req.user._id,
      status: ['active', 'inactive', 'suspended'].includes(status) ? status : 'active',
    });
    res.status(201).json({ success: true, message: 'Customer created successfully', data: customer.toSafeObject() });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'An account with that email already exists' });
    next(error);
  }
}
