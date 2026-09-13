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