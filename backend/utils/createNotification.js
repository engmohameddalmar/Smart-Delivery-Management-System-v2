import Notification from '../models/Notification.js';import User from '../models/User.js';
export function createNotification({user,type,title,message,order=null,delivery=null,payment=null}){return Notification.create({user,type,title,message,order,delivery,payment});}
export async function notifyAdmins(details){const admins=await User.find({role:'admin',status:'active'}).select('_id');return Promise.all(admins.map(admin=>createNotification({...details,user:admin._id})));}
