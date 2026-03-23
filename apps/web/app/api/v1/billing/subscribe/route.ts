export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRazorpay, PRO_BYOK_AMOUNT, PRO_BYOK_CURRENCY } from "@/lib/razorpay";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if already subscribed
    const existing = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (existing?.plan !== "FREE" && existing?.status === "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Already on Pro plan" },
        { status: 400 }
      );
    }

    const razorpay = getRazorpay();

    // Create a Razorpay order for subscription
    const order = await razorpay.orders.create({
      amount: PRO_BYOK_AMOUNT,
      currency: PRO_BYOK_CURRENCY,
      receipt: `sub_${session.user.id}_${Date.now()}`,
      notes: {
        userId: session.user.id,
        plan: "PRO_BYOK",
        email: session.user.email ?? "",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
