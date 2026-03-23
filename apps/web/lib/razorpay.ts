import Razorpay from "razorpay";

export function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys not configured");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// Pro BYOK plan: $5/mo
export const PRO_BYOK_AMOUNT = 500; // in cents (USD)
export const PRO_BYOK_CURRENCY = "USD";
