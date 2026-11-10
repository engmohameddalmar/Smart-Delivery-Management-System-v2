import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
  email: { type: String, required: [true, 'Email is required'], unique: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  phone: { type: String, required: [true, 'Phone is required'], trim: true },
  role: { type: String, enum: ['admin', 'business', 'driver', 'customer'], default: 'customer' },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  avatar: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  isAvailable: { type: String, enum: ['available', 'busy', 'offline'], default: 'available' },
  currentDelivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', default: null },
  address: { type: String, default: '', trim: true, maxlength: 250 },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  tokenVersion: { type: Number, default: 0, select: false },
}, { timestamps: true });

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const { _id, name, email, phone, role, business, avatar, address, status, isAvailable, currentDelivery, createdAt, updatedAt } = this;
  return { id: _id, name, email, phone, role, business, avatar, address, status, isAvailable, currentDelivery, createdAt, updatedAt };
};

export default mongoose.model('User', userSchema);
