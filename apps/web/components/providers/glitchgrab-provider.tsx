"use client";

import { useState, useEffect, type ReactNode } from "react";
import type { GlitchgrabProviderProps, ReportButtonProps } from "glitchgrab";

const GLITCHGRAB_TOKEN = process.env.NEXT_PUBLIC_GLITCHGRAB_TOKEN ?? "";

type SDKModule = {
  GlitchgrabProvider: React.ComponentType<GlitchgrabProviderProps>;
  ReportButton: React.ComponentType<ReportButtonProps>;
};

export function GlitchgrabSDKProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [sdk, setSdk] = useState<SDKModule | null>(null);

  useEffect(() => {
    if (!GLITCHGRAB_TOKEN) return;
    import("glitchgrab").then(setSdk);
  }, []);

  if (!GLITCHGRAB_TOKEN || !sdk) return <>{children}</>;

  return (
    <sdk.GlitchgrabProvider
      token={GLITCHGRAB_TOKEN}
      baseUrl={typeof window !== "undefined" ? window.location.origin : ""}
    >
      {children}
      <sdk.ReportButton position="bottom-right" />
    </sdk.GlitchgrabProvider>
  );
}
