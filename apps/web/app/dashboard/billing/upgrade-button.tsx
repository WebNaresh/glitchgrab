"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string };
  theme: { color: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export function UpgradeButton({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);

    try {
      // 1. Create order
      const res = await fetch("/api/v1/billing/subscribe", {
        method: "POST",
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error ?? "Failed to create order");
        setLoading(false);
        return;
      }

      // 2. Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.head.appendChild(script);
        });
      }

      // 3. Open Razorpay checkout
      const razorpay = new window.Razorpay({
        key: data.data.keyId,
        amount: data.data.amount,
        currency: data.data.currency,
        name: "Glitchgrab",
        description: "Pro Plan (BYOK) — $5/month",
        order_id: data.data.orderId,
        handler: async (response: RazorpayResponse) => {
          // 4. Verify payment
          try {
            const verifyRes = await fetch("/api/v1/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              toast.success("Upgraded to Pro! Refreshing...");
              window.location.reload();
            } else {
              toast.error("Payment verification failed");
            }
          } catch {
            toast.error("Payment verification failed");
          }
          setLoading(false);
        },
        prefill: { name, email },
        theme: { color: "#22d3ee" },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      razorpay.open();
    } catch {
      toast.error("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleUpgrade} disabled={loading} className="gap-2">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
      {loading ? "Processing..." : "Upgrade to Pro — $5/mo"}
    </Button>
  );
}
