import api from './api.js';
export const trackByTrackingNumber=trackingNumber=>api.get(`/tracking/${encodeURIComponent(trackingNumber.trim())}`).then(r=>r.data.data);
export const getOrderTracking=orderId=>api.get(`/orders/${orderId}/tracking`).then(r=>r.data.data);
export const getCustomerTracking=orderId=>api.get(`/tracking/customer/${orderId}`).then(r=>r.data.data);
