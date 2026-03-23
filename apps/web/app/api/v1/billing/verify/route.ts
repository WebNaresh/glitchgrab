export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";

interface VerifyBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as VerifyBody;

    // Verify payment signature
    const isValid = validatePaymentVerification(
      {
        order_id: body.razorpay_order_id,
        payment_id: body.razorpay_payment_id,
      },
      body.razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET!
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Activate subscription
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan: "PRO_BYOK",
        status: "ACTIVE",
        razorpaySubscriptionId: body.razorpay_payment_id,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      create: {
        userId: session.user.id,
        plan: "PRO_BYOK",
        status: "ACTIVE",
        razorpaySubscriptionId: body.razorpay_payment_id,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
