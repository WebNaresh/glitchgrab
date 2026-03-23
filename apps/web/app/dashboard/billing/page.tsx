export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { getUserPlan } from "@/lib/billing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { UpgradeButton } from "./upgrade-button";

export default async function BillingPage() {
  const session = await auth();
  const plan = await getUserPlan(session!.user!.id!);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">
                  {plan.plan === "FREE" ? "Free Plan" : "Pro Plan (BYOK)"}
                </h2>
                <Badge variant={plan.isActive ? "default" : "secondary"}>
                  {plan.isActive ? "Active" : "Expired"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.plan === "FREE"
                  ? "1 repo, 30 issues/month, bring your own AI key"
                  : "Unlimited repos, unlimited issues, bring your own AI key"}
              </p>
              {plan.expiresAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  {plan.plan !== "FREE"
                    ? `Renews ${plan.expiresAt.toLocaleDateString()}`
                    : `Expired ${plan.expiresAt.toLocaleDateString()}`}
                </p>
              )}
            </div>
            {plan.plan === "FREE" && (
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">$5</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Card */}
      {plan.plan === "FREE" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Upgrade to Pro</h3>
            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              {[
                "Unlimited repos",
                "Unlimited issues",
                "AI dedup & smart updates",
                "Screenshot analysis",
                "Priority support",
                "SDK auto-capture",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <UpgradeButton
              email={session?.user?.email ?? ""}
              name={session?.user?.name ?? ""}
            />
          </CardContent>
        </Card>
      )}

      {/* Pro — Already subscribed */}
      {plan.plan !== "FREE" && (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="font-semibold">You&apos;re on Pro!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enjoy unlimited repos and issues.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
