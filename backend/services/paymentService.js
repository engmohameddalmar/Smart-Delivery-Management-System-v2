export function hasConfiguredGateway() {
  return Boolean(process.env.PAYMENT_GATEWAY_PROVIDER && process.env.PAYMENT_GATEWAY_SECRET);
}

export async function createOnlinePaymentSession({ payment, order }) {
  if (!hasConfiguredGateway()) {
    return { configured: false, message: 'Online payment gateway is not configured yet.' };
  }
  return {
    configured: true,
    paymentUrl: null,
    provider: process.env.PAYMENT_GATEWAY_PROVIDER,
    reference: payment.paymentReference,
    orderId: order.orderId,
    amount: payment.amount,
    currency: payment.currency,
  };
}

export async function verifyOnlinePayment() {
  if (!hasConfiguredGateway()) return { configured: false, verified: false, message: 'Online payment gateway is not configured yet.' };
  return { configured: true, verified: false, message: 'Gateway verification adapter is not implemented for the configured provider.' };
}
