import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  ownerName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active', index: true },
}, { timestamps: true });

businessSchema.index({ name: 'text', ownerName: 'text', email: 'text', phone: 'text' });

export default mongoose.model('Business', businessSchema);
