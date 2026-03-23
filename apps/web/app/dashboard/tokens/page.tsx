export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Key } from "lucide-react";

export default async function TokensPage() {
  const session = await auth();
  const tokens = await prisma.apiToken.findMany({
    where: { repo: { userId: session?.user?.id } },
    include: { repo: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Tokens</h1>
        <p className="text-sm text-muted-foreground">
          Manage tokens for the Glitchgrab SDK. Connect a repo first to generate
          tokens.
        </p>
      </div>

      {tokens.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tokens yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Connect a repo first, then generate an API token to use with the
              SDK.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tokens.map((token: typeof tokens[number]) => (
            <Card key={token.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{token.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {token.repo.fullName}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>
                    Created{" "}
                    {token.createdAt.toLocaleDateString()}
                  </p>
                  {token.lastUsed && (
                    <p>
                      Last used{" "}
                      {token.lastUsed.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
