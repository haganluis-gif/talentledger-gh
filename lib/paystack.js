// Fixed audition fee. Amounts are expressed in the smallest unit of
// GHS (pesewas) as required by the Paystack API. Set server-side only,
// never from client input.
export const AUDITION_FEE_PESEWAS = 5000;
export const AUDITION_FEE_CURRENCY = "GHS";

export function isPaystackConfigured() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  return Boolean(
    secretKey &&
      !secretKey.includes("placeholder") &&
      /^sk_(test|live)_[a-zA-Z0-9_]{5,}$/.test(secretKey)
  );
}

export function getPaystackSecretKey() {
  return isPaystackConfigured() ? process.env.PAYSTACK_SECRET_KEY : null;
}