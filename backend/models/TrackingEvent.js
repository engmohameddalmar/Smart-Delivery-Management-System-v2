import mongoose from 'mongoose';
const trackingEventSchema=new mongoose.Schema({order:{type:mongoose.Schema.Types.ObjectId,ref:'Order',required:true,index:true},delivery:{type:mongoose.Schema.Types.ObjectId,ref:'Delivery',default:null,index:true},status:{type:String,required:true},message:{type:String,required:true,trim:true},updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},timestamp:{type:Date,default:Date.now,index:true}},{versionKey:false});
trackingEventSchema.index({delivery:1,timestamp:1});
trackingEventSchema.index({status:1,timestamp:-1});
export default mongoose.model('TrackingEvent',trackingEventSchema);
