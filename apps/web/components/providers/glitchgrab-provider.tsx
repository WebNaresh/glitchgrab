"use client";

import { GlitchgrabProvider } from "glitchgrab";

export function GlitchgrabSDKProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlitchgrabProvider token={process.env.NEXT_PUBLIC_GLITCHGRAB_TOKEN ?? ""}>
      {children}
    </GlitchgrabProvider>
  );
}
