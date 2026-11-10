import User from '../models/User.js';
import Order from '../models/Order.js';
import Delivery from '../models/Delivery.js';
import Payment from '../models/Payment.js';

export async function getDashboardStats(_request, response, next) {
  try {
    const [grouped, totalOrders, activeDeliveries, completedDeliveries, revenueRows] = await Promise.all([
      User.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, totalUsers: { $sum: 1 }, totalAdmins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } }, totalBusinesses: { $sum: { $cond: [{ $eq: ['$role', 'business'] }, 1, 0] } }, totalDrivers: { $sum: { $cond: [{ $eq: ['$role', 'driver'] }, 1, 0] } }, totalCustomers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } }, activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }, inactiveUsers: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } }, suspendedUsers: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } } } }]),
      Order.countDocuments(),
      Delivery.countDocuments({ status: { $in: ['Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Out for Delivery'] } }),
      Delivery.countDocuments({ status: 'Delivered' }),
      Payment.aggregate([{ $match: { status: 'Paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    const users = grouped[0] || { totalUsers: 0, totalAdmins: 0, totalBusinesses: 0, totalDrivers: 0, totalCustomers: 0, activeUsers: 0, inactiveUsers: 0, suspendedUsers: 0 };
    delete users._id;
    response.json({ success: true, message: 'Dashboard statistics retrieved successfully', data: { ...users, totalOrders, activeDeliveries, completedDeliveries, revenue: revenueRows[0]?.total || 0 } });
  } catch (error) { next(error); }
}

export async function getRecentUsers(_request, response, next) {
  try { const users = await User.find().sort({ createdAt: -1 }).limit(5); response.json({ success: true, message: 'Recent users retrieved successfully', data: users.map((user) => user.toSafeObject()) }); } catch (error) { next(error); }
}

export async function getOrderStats(_request,response,next){try{const grouped=await Order.aggregate([{ $group:{_id:null,totalOrders:{$sum:1},pendingOrders:{$sum:{$cond:[{$eq:['$orderStatus','Pending']},1,0]}},confirmedOrders:{$sum:{$cond:[{$eq:['$orderStatus','Confirmed']},1,0]}},cancelledOrders:{$sum:{$cond:[{$eq:['$orderStatus','Cancelled']},1,0]}}}}]);const data=grouped[0]||{totalOrders:0,pendingOrders:0,confirmedOrders:0,cancelledOrders:0};delete data._id;response.json({success:true,message:'Order statistics retrieved successfully',data});}catch(error){next(error);}}
