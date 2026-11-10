import Delivery from '../models/Delivery.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';

const activeDeliveryStatuses = ['Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Out for Delivery'];
const statusMap = (rows) => Object.fromEntries(rows.map((row) => [row._id, row.count]));

export async function getCustomerDashboard(request, response, next) {
  try {
    const customer = request.user._id;
    const [orderRows, totalSpentRows, recentOrders, recentPayments, currentDelivery] = await Promise.all([
      Order.aggregate([{ $match: { customer } }, { $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { customer, status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Order.find({ customer }).select('orderId trackingNumber orderStatus paymentStatus totalAmount createdAt').sort({ createdAt: -1 }).limit(5),
      Payment.find({ customer }).select('paymentId order amount status paymentMethod createdAt').populate('order', 'orderId').sort({ createdAt: -1 }).limit(5),
      Delivery.findOne({ customer, status: { $in: activeDeliveryStatuses } }).select('deliveryId order driver status updatedAt').populate('order', 'orderId trackingNumber').populate('driver', 'name phone').sort({ updatedAt: -1 }),
    ]);
    const counts = statusMap(orderRows);
    const totalOrders = Object.values(counts).reduce((total, count) => total + count, 0);
    const activeOrders = activeDeliveryStatuses.reduce((total, status) => total + (counts[status] || 0), 0);
    response.json({ success: true, data: { totalOrders, pendingOrders: counts.Pending || 0, activeOrders, completedOrders: counts.Delivered || 0, totalSpent: totalSpentRows[0]?.total || 0, recentOrders, recentPayments, currentDelivery } });
  } catch (error) { next(error); }
}

export async function getDriverDashboard(request, response, next) {
  try {
    const driver = request.user._id;
    const [statusRows, recentDeliveries, currentDelivery, paymentRows] = await Promise.all([
      Delivery.aggregate([{ $match: { driver } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Delivery.find({ driver }).select('deliveryId order status updatedAt').populate('order', 'orderId recipientName trackingNumber').sort({ updatedAt: -1 }).limit(5),
      Delivery.findOne({ driver, status: { $in: activeDeliveryStatuses } }).select('deliveryId order customer status updatedAt').populate('order', 'orderId trackingNumber pickupAddress deliveryAddress paymentMethod totalAmount').populate('customer', 'name phone').sort({ updatedAt: -1 }),
      Payment.aggregate([{ $lookup: { from: 'orders', localField: 'order', foreignField: '_id', as: 'orderRecord' } }, { $unwind: '$orderRecord' }, { $match: { 'orderRecord.assignedDriver': driver } }, { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    ]);
    const counts = statusMap(statusRows);
    const completed = counts.Delivered || 0;
    const failed = counts.Failed || 0;
    const attempts = completed + failed;
    response.json({ success: true, data: { assignedDeliveries: counts.Assigned || 0, activeDeliveries: activeDeliveryStatuses.reduce((total, status) => total + (counts[status] || 0), 0), completedDeliveries: completed, failedDeliveries: failed, rejectedDeliveries: counts.Rejected || 0, successRate: attempts ? Math.round((completed / attempts) * 10000) / 100 : 0, availability: currentDelivery ? 'busy' : request.user.isAvailable, recentDeliveries, currentDelivery } });
  } catch (error) { next(error); }
}
