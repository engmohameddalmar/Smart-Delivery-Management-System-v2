import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import {logActivity} from '../utils/activityLogger.js';

const roles = ['admin', 'business', 'driver', 'customer'];
const statuses = ['active', 'inactive', 'suspended'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function invalidId(id) { return !mongoose.Types.ObjectId.isValid(id); }
async function activeAdminCount() { return User.countDocuments({ role: 'admin', status: 'active' }); }

export async function getUsers(request, response, next) {
  try {
    const page = Math.max(Number.parseInt(request.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(request.query.limit, 10) || 10, 1), 100);
    const filter = {isDeleted:false};
    if (request.query.role) { if (!roles.includes(request.query.role)) return response.status(400).json({ success: false, message: 'Invalid role filter' }); filter.role = request.query.role; }
    if (request.query.status) { if (!statuses.includes(request.query.status)) return response.status(400).json({ success: false, message: 'Invalid status filter' }); filter.status = request.query.status; }
    if (request.query.availability) { if (!['available', 'busy', 'offline'].includes(request.query.availability)) return response.status(400).json({ success: false, message: 'Invalid availability filter' }); filter.isAvailable = request.query.availability; }
    if (request.query.search?.trim()) { const search = new RegExp(escapeRegex(request.query.search.trim()), 'i'); filter.$or = [{ name: search }, { email: search }, { phone: search }]; }
    const sortFields = ['name', 'email', 'role', 'status', 'createdAt', 'updatedAt'];
    const sortBy = sortFields.includes(request.query.sortBy) ? request.query.sortBy : 'createdAt';
    const sortOrder = request.query.order === 'asc' ? 1 : -1;
    const [data, total] = await Promise.all([User.find(filter).sort({ [sortBy]: sortOrder }).skip((page - 1) * limit).limit(limit), User.countDocuments(filter)]);
    response.json({ success: true, message: 'Users retrieved successfully', data: data.map((user) => user.toSafeObject()), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getUserById(request, response, next) {
  try { if (invalidId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid user ID' }); const user = await User.findOne({_id:request.params.id,isDeleted:false}); if (!user) return response.status(404).json({ success: false, message: 'User not found' }); response.json({ success: true, message: 'User retrieved successfully', data: user.toSafeObject() }); } catch (error) { next(error); }
}

export async function updateUser(request, response, next) {
  try {
    if (invalidId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid user ID' });
    const user = await User.findById(request.params.id); if (!user) return response.status(404).json({ success: false, message: 'User not found' });
    const { name, email, phone, avatar, address, role } = request.body;
    if (!name?.trim() || !email?.trim() || !phone?.trim()) return response.status(400).json({ success: false, message: 'Name, email, and phone are required' });
    if (!emailPattern.test(email)) return response.status(400).json({ success: false, message: 'Please provide a valid email address' });
    if (!roles.includes(role)) return response.status(400).json({ success: false, message: 'Invalid role' });
    if(user._id.equals(request.user._id)&&role!=='admin')return response.status(400).json({success:false,message:'You cannot remove your own admin access'});
    if (user.role === 'admin' && user.status === 'active' && role !== 'admin' && await activeAdminCount() <= 1) return response.status(400).json({ success: false, message: 'The last active admin cannot lose the admin role' });
    const duplicate = await User.exists({ email: email.trim().toLowerCase(), _id: { $ne: user._id } });
    if (duplicate) return response.status(400).json({ success: false, message: 'An account with this email already exists' });
    Object.assign(user, { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), avatar: typeof avatar === 'string' ? avatar.trim() : user.avatar, address:typeof address==='string'?address.trim():user.address, role });
    await user.save();await logActivity(request,{action:'user.updated',entityType:'User',entityId:user._id,description:`Updated user ${user.name}`}); response.json({ success: true, message: 'User updated successfully', data: user.toSafeObject() });
  } catch (error) { if (error?.code === 11000) return response.status(400).json({ success: false, message: 'An account with this email already exists' }); next(error); }
}

export async function updateUserStatus(request, response, next) {
  try {
    if (invalidId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid user ID' });
    const { status } = request.body; if (!statuses.includes(status)) return response.status(400).json({ success: false, message: 'Invalid status' });
    const user = await User.findById(request.params.id); if (!user) return response.status(404).json({ success: false, message: 'User not found' });
    if (user._id.equals(request.user._id) && status !== 'active') return response.status(400).json({ success: false, message: 'You cannot deactivate or suspend your own account' });
    if (user.role === 'admin' && user.status === 'active' && status !== 'active' && await activeAdminCount() <= 1) return response.status(400).json({ success: false, message: 'The last active admin cannot be deactivated' });
    user.status = status; await user.save();await logActivity(request,{action:`user.${status}`,entityType:'User',entityId:user._id,description:`${user.name} changed to ${status}`}); response.json({ success: true, message: `User ${status === 'active' ? 'activated' : status} successfully`, data: user.toSafeObject() });
  } catch (error) { next(error); }
}

export async function deleteUser(request, response, next) {
  try {
    if (invalidId(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid user ID' });
    if (request.user._id.equals(request.params.id)) return response.status(400).json({ success: false, message: 'You cannot delete your own account' });
    const user = await User.findById(request.params.id); if (!user) return response.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin' && user.status === 'active' && await activeAdminCount() <= 1) return response.status(400).json({ success: false, message: 'The last active admin cannot be deleted' });
    user.isDeleted=true;user.deletedAt=new Date();user.status='inactive';user.email=`deleted-${user._id}-${user.email}`;await user.save();await logActivity(request,{action:'user.deleted',entityType:'User',entityId:user._id,description:`Soft-deleted user ${user.name}`}); response.json({ success: true, message: 'User archived successfully' });
  } catch (error) { next(error); }
}

export async function changeUserRole(request,response,next){try{if(invalidId(request.params.id))return response.status(400).json({success:false,message:'Invalid user ID'});const {role}=request.body;if(!roles.includes(role))return response.status(400).json({success:false,message:'Invalid role'});const user=await User.findOne({_id:request.params.id,isDeleted:false});if(!user)return response.status(404).json({success:false,message:'User not found'});if(user._id.equals(request.user._id)&&role!=='admin')return response.status(400).json({success:false,message:'You cannot remove your own admin access'});if(user.role==='admin'&&user.status==='active'&&role!=='admin'&&await activeAdminCount()<=1)return response.status(400).json({success:false,message:'The last active admin cannot lose the admin role'});const previous=user.role;user.role=role;if(role!=='driver'){user.isAvailable='offline';user.currentDelivery=null}else if(previous!=='driver')user.isAvailable='available';await user.save();await logActivity(request,{action:'user.role_changed',entityType:'User',entityId:user._id,description:`Changed ${user.name} role from ${previous} to ${role}`});response.json({success:true,message:'User role updated successfully',data:user.toSafeObject()});}catch(e){next(e)}}
export async function getMyProfile(request,response){response.json({success:true,data:request.user.toSafeObject()})}
export async function updateMyProfile(request,response,next){try{const {name,phone,address,avatar}=request.body;if(!name?.trim()||!phone?.trim())return response.status(400).json({success:false,message:'Name and phone are required'});request.user.name=name.trim();request.user.phone=phone.trim();request.user.address=typeof address==='string'?address.trim():request.user.address;if(typeof avatar==='string')request.user.avatar=avatar.trim();await request.user.save();response.json({success:true,message:'Profile updated successfully',data:request.user.toSafeObject()});}catch(e){next(e)}}
export async function uploadMyAvatar(request,response,next){try{if(!request.file)return response.status(400).json({success:false,message:'Avatar image is required'});request.user.avatar=request.file.path.replaceAll('\\','/');await request.user.save();response.json({success:true,message:'Avatar updated successfully',data:request.user.toSafeObject()});}catch(e){next(e)}}
export async function changeMyPassword(request,response,next){try{const {currentPassword,newPassword,confirmPassword}=request.body;if(!currentPassword||!newPassword||!confirmPassword)return response.status(400).json({success:false,message:'All password fields are required'});if(newPassword.length<6)return response.status(400).json({success:false,message:'New password must be at least 6 characters'});if(newPassword!==confirmPassword)return response.status(400).json({success:false,message:'New passwords do not match'});const user=await User.findById(request.user._id).select('+password +tokenVersion');if(!await bcrypt.compare(currentPassword,user.password))return response.status(400).json({success:false,message:'Current password is incorrect'});user.password=newPassword;user.tokenVersion=(user.tokenVersion||0)+1;await user.save();response.json({success:true,message:'Password changed. Please sign in again.'});}catch(e){next(e)}}
export async function updateMyAvailability(request,response,next){try{if(request.user.role!=='driver')return response.status(403).json({success:false,message:'Only drivers can update availability'});const {availability}=request.body;if(!['available','offline'].includes(availability))return response.status(400).json({success:false,message:'Drivers may select only available or offline'});if(request.user.currentDelivery)return response.status(409).json({success:false,message:'Availability is controlled automatically during an active delivery'});request.user.isAvailable=availability;await request.user.save();response.json({success:true,message:'Availability updated',data:request.user.toSafeObject()});}catch(e){next(e)}}
export async function resetUserPassword(request,response,next){try{if(invalidId(request.params.id))return response.status(400).json({success:false,message:'Invalid user ID'});const {newPassword}=request.body;if(!newPassword||newPassword.length<6)return response.status(400).json({success:false,message:'New password must be at least 6 characters'});const user=await User.findOne({_id:request.params.id,isDeleted:false}).select('+tokenVersion');if(!user)return response.status(404).json({success:false,message:'User not found'});user.password=newPassword;user.tokenVersion=(user.tokenVersion||0)+1;await user.save();await logActivity(request,{action:'user.password_reset',entityType:'User',entityId:user._id,description:`Reset password for ${user.name}`});response.json({success:true,message:'Password reset successfully'});}catch(e){next(e)}}

export async function createUser(request, response, next) {
  try {
    const { name, email, phone, password, role, address, status } = request.body;
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password?.trim()) {
      return response.status(400).json({ success: false, message: 'Name, email, phone, and password are required' });
    }
    if (!emailPattern.test(email)) return response.status(400).json({ success: false, message: 'Please provide a valid email address' });
    if (!roles.includes(role)) return response.status(400).json({ success: false, message: 'Invalid role' });
    if (String(password).length < 8) return response.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    if (await User.exists({ email: email.trim().toLowerCase(), isDeleted: false })) return response.status(400).json({ success: false, message: 'An account with this email already exists' });
    const user = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password, role, address: typeof address === 'string' ? address.trim() : '', status: ['active', 'inactive', 'suspended'].includes(status) ? status : 'active', isAvailable: role === 'driver' ? 'available' : 'offline' });
    await logActivity(request, { action: 'user.created', entityType: 'User', entityId: user._id, description: `Created ${role} ${user.name}` });
    response.status(201).json({ success: true, message: 'User created successfully', data: user.toSafeObject() });
  } catch (error) { if (error?.code === 11000) return response.status(400).json({ success: false, message: 'An account with this email already exists' }); next(error); }
}
