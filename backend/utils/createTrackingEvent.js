import TrackingEvent from '../models/TrackingEvent.js';

export const trackingMessages={Pending:'Your order has been created.',Confirmed:'Your order has been confirmed.',Assigned:'A driver has been assigned to your delivery.',Accepted:'Driver has accepted the delivery.','Picked Up':'Your package has been picked up.','In Transit':'Your package is currently in transit.','Out for Delivery':'Your package is out for delivery.',Delivered:'Your package has been delivered.',Failed:'Delivery attempt failed.',Cancelled:'Your order has been cancelled.',Rejected:'Driver rejected the delivery assignment.'};

export async function createTrackingEvent({order,delivery=null,status,message=trackingMessages[status],updatedBy}){
  if(!order||!status||!message||!updatedBy)throw new Error('Tracking event data is incomplete');
  return TrackingEvent.create({order,delivery,status,message,updatedBy});
}
