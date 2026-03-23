export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and AI configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user?.image ?? undefined}
                alt={user?.name ?? "User"}
              />
              <AvatarFallback className="text-lg">
                {user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Signed in via GitHub
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI provider settings coming soon. You&apos;ll be able to choose
            between platform-provided AI or bring your own key (Claude or
            OpenAI).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
