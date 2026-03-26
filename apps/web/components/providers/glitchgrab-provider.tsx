"use client";

import { useState, useEffect, type ReactNode } from "react";

const GLITCHGRAB_TOKEN = process.env.NEXT_PUBLIC_GLITCHGRAB_TOKEN ?? "";

export function GlitchgrabSDKProvider({
  children,
}: {
  children: ReactNode;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [SDK, setSDK] = useState<{ Provider: any; Button: any } | null>(null);

  useEffect(() => {
    if (!GLITCHGRAB_TOKEN) return;
    import("glitchgrab").then((mod) => {
      setSDK({ Provider: mod.GlitchgrabProvider, Button: mod.ReportButton });
    });
  }, []);

  if (!GLITCHGRAB_TOKEN || !SDK) {
    return <>{children}</>;
  }

  return (
    <SDK.Provider
      token={GLITCHGRAB_TOKEN}
      baseUrl={typeof window !== "undefined" ? window.location.origin : ""}
    >
      {children}
      <SDK.Button position="bottom-right" />
    </SDK.Provider>
  );
}
