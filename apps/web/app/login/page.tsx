import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GitHubSignInButton } from "./github-signin-button";
import {
  CodeRainBg,
  MiniTerminal,
  GlitchText,
  HudRing,
  AnimatedStat,
} from "./login-animation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, ShieldAlert } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">
      {/* Animated background */}
      <CodeRainBg />

      {/* Vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, #09090b 80%)",
        }}
      />

      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] opacity-[0.015]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
        }}
      />

      {/* Back button */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-20 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition sm:top-6 sm:left-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Home
      </Link>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md px-4 py-8 space-y-6">
        {/* Card */}
        <div className="relative rounded-2xl border border-border/30 bg-background/80 backdrop-blur-xl p-6 sm:p-8 space-y-6 overflow-hidden">
          {/* HUD decoration */}
          <HudRing />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 h-8 w-8 border-t-2 border-l-2 border-primary/20 rounded-tl-2xl" />
          <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-primary/20 rounded-br-2xl" />

          {/* Header */}
          <div className="text-center space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-[10px] font-mono text-primary uppercase tracking-widest">
                System Access
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              <GlitchText>glitchgrab</GlitchText>
            </h1>

            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              You bypassed the landing page like a true dev.
              Respect. But here&apos;s the thing —
            </p>
          </div>

          {/* Terminal preview */}
          <MiniTerminal />

          {/* Warning */}
          <div className="flex items-start gap-3 rounded-lg border border-yellow-500/15 bg-yellow-500/5 p-3">
            <ShieldAlert className="h-4 w-4 text-yellow-500/70 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-yellow-500/80">Early access — things will break</p>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                We&apos;re still shipping features. iOS pending Apple review.
                You can go in, but the full experience drops soon.
                Join the waitlist and we&apos;ll ping you.
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Link href="/#waitlist" className="block">
              <Button size="lg" className="w-full gap-2 text-sm font-semibold">
                Join the Waitlist
              </Button>
            </Link>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background/80 px-3 text-[9px] text-muted-foreground/50 font-mono uppercase tracking-[0.2em]">
                  or skip the line
                </span>
              </div>
            </div>

            <div className="opacity-60 hover:opacity-100 transition-opacity duration-300">
              <GitHubSignInButton />
            </div>
          </div>

          {/* Fine print */}
          <p className="text-center text-[9px] text-muted-foreground/40 font-mono">
            repo access for issue creation only &middot; code is never read or stored
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-8 px-4">
          <AnimatedStat label="bugs caught" end={2847} />
          <div className="h-6 w-px bg-border/20" />
          <AnimatedStat label="issues created" end={1203} />
          <div className="h-6 w-px bg-border/20" />
          <AnimatedStat label="time saved" end={96} suffix="h" />
        </div>

        {/* Email */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/40">
          <Mail className="h-3 w-3" />
          <span>
            Ideas? Roast us?{" "}
            <a
              href="mailto:bhosalenaresh73@gmail.com"
              className="text-primary/60 hover:text-primary hover:underline transition"
            >
              bhosalenaresh73@gmail.com
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
