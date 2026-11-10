import mongoose from 'mongoose';

const deliveryStatuses=['Assigned','Accepted','Rejected','Picked Up','In Transit','Out for Delivery','Delivered','Failed','Cancelled'];
const Counter=mongoose.models.Counter||mongoose.model('Counter',new mongoose.Schema({_id:String,sequence:{type:Number,default:0}}));
const deliverySchema=new mongoose.Schema({
  deliveryId:{type:String,unique:true,index:true,immutable:true},
  order:{type:mongoose.Schema.Types.ObjectId,ref:'Order',required:true,unique:true,index:true,immutable:true},
  driver:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  customer:{type:mongoose.Schema.Types.ObjectId,ref:'User',default:null,index:true,immutable:true},
  status:{type:String,enum:deliveryStatuses,default:'Assigned',index:true},
  assignedAt:{type:Date,default:Date.now},acceptedAt:Date,rejectedAt:Date,pickupAt:Date,inTransitAt:Date,outForDeliveryAt:Date,deliveredAt:Date,failedAt:Date,
  rejectionReason:{type:String,default:'',trim:true},failureReason:{type:String,default:'',trim:true},deliveryNotes:{type:String,default:'',trim:true},
  proofOfDelivery:{photo:{type:String,default:''},signature:{type:String,default:''},recipientName:{type:String,default:''},deliveryNote:{type:String,default:''}},
},{timestamps:true});
deliverySchema.index({createdAt:-1});
deliverySchema.index({status:1,createdAt:-1});
deliverySchema.index({driver:1,createdAt:-1});
deliverySchema.pre('validate',async function(){if(!this.isNew||this.deliveryId)return;const year=new Date().getUTCFullYear();const counter=await Counter.findByIdAndUpdate(`deliveries:${year}`,{$inc:{sequence:1}},{new:true,upsert:true,setDefaultsOnInsert:true});this.deliveryId=`DEL-${year}-${String(counter.sequence).padStart(6,'0')}`;});
export {deliveryStatuses};export default mongoose.model('Delivery',deliverySchema);
