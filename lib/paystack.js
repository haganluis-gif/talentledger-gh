// Fixed audition fee. Amounts are expressed in the smallest unit of
// GHS (pesewas) as required by the Paystack API. Set server-side only,
// never from client input.
import { isProgram, PROGRAM_FEES_PESEWAS } from "./program";

export const AUDITION_FEE_PESEWAS = 5000;
export const AUDITION_FEE_CURRENCY = "GHS";

// Resolve the correct fee from the contestant's *stored* program so a
// client can never choose a cheaper amount by lying about the program.
// Unknown/missing program falls back to the gospel fee (the historical
// default), keeping legacy rows locked to the existing amount.
export function getProgramFee(program) {
  return isProgram(program) ? PROGRAM_FEES_PESEWAS[program] : AUDITION_FEE_PESEWAS;
}

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