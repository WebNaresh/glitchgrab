"use client";

import { useState, useCallback } from "react";
import { Bug, Loader2, X } from "lucide-react";
import { useGlitchgrab } from "glitchgrab";
import { toast } from "sonner";

export function ReportBugButton({ variant = "nav" }: { variant?: "nav" | "sidebar" }) {
  const [capturing, setCapturing] = useState(false);
  const [open, setOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { reportBug } = useGlitchgrab();

  const handleClick = useCallback(async () => {
    setCapturing(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(document.body, {
        scale: 0.5,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
      setScreenshot(canvas.toDataURL("image/jpeg", 0.6));
    } catch {
      // screenshot failed — open without it
    }
    setCapturing(false);
    setOpen(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!description.trim() || submitting) return;
    setSubmitting(true);
    reportBug(description.trim(), screenshot ? { screenshot } : undefined);
    toast.success("Bug report sent!");
    setSubmitting(false);
    setDescription("");
    setScreenshot(null);
    setOpen(false);
  }, [description, submitting, reportBug, screenshot]);

  if (variant === "sidebar") {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={capturing}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {capturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
          {capturing ? "Capturing..." : "Report Bug"}
        </button>
        {open && <ReportModal screenshot={screenshot} description={description} setDescription={setDescription} submitting={submitting} onSubmit={handleSubmit} onClose={() => { setOpen(false); setScreenshot(null); setDescription(""); }} onRemoveScreenshot={() => setScreenshot(null)} />}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={capturing}
        className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground transition"
      >
        {capturing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bug className="h-5 w-5" />}
        <span>{capturing ? "..." : "Report"}</span>
      </button>
      {open && <ReportModal screenshot={screenshot} description={description} setDescription={setDescription} submitting={submitting} onSubmit={handleSubmit} onClose={() => { setOpen(false); setScreenshot(null); setDescription(""); }} onRemoveScreenshot={() => setScreenshot(null)} />}
    </>
  );
}

function ReportModal({
  screenshot,
  description,
  setDescription,
  submitting,
  onSubmit,
  onClose,
  onRemoveScreenshot,
}: {
  screenshot: string | null;
  description: string;
  setDescription: (v: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
  onRemoveScreenshot: () => void;
}) {
  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-85 rounded-xl bg-card border border-border shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold">Report a Bug</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Screenshot preview */}
          {screenshot && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshot}
                alt="Page screenshot"
                className="w-full rounded-lg border border-border max-h-35 object-cover object-top"
              />
              <button
                onClick={onRemoveScreenshot}
                className="absolute top-1.5 right-1.5 rounded-full bg-black/60 text-white p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-1.5 left-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                Screenshot attached
              </span>
            </div>
          )}

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what went wrong..."
            className="w-full min-h-20 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />

          <button
            onClick={onSubmit}
            disabled={!description.trim() || submitting}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {submitting ? "Sending..." : "Send Report"}
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 text-center">
          <span className="text-[11px] text-muted-foreground">Powered by Glitchgrab</span>
        </div>
      </div>
    </div>
  );
}
