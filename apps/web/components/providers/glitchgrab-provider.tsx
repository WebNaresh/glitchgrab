"use client";

import { GlitchgrabProvider, ReportButton } from "glitchgrab";

export function GlitchgrabSDKProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlitchgrabProvider token={process.env.NEXT_PUBLIC_GLITCHGRAB_TOKEN ?? ""}>
      {children}
      <ReportButton />
    </GlitchgrabProvider>
  );
}
