"use client";

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type {
  GlitchgrabProviderProps,
  UseGlitchgrabReturn,
  ReportPayload,
  ReportResult,
  ReportType,
} from "./types";
import { GlitchgrabErrorBoundary } from "./error-boundary";
import { ReportDialog } from "./report-dialog";
import { sanitizeUrl, captureContext, sendReport, captureDeviceInfo } from "./utils";
import {
  initBreadcrumbs,
  addBreadcrumb as addBreadcrumbInternal,
  getBreadcrumbs,
} from "./breadcrumbs";
import { warnMisconfigured } from "./warn-toast";

const DEFAULT_BASE_URL = "https://www.glitchgrab.dev";

const MISCONFIG_MESSAGE =
  "Bug reporting isn't configured — GlitchgrabProvider is missing a token.";

interface InternalContextValue extends UseGlitchgrabReturn {
  /** Internal flag — true when provider has a token and is fully wired. */
  ready: boolean;
}

const DISABLED_CONTEXT: InternalContextValue = {
  ready: false,
  token: "",
  baseUrl: DEFAULT_BASE_URL,
  reportBug: async () => {
    warnMisconfigured("reportBug", MISCONFIG_MESSAGE);
    return null;
  },
  report: async () => {
    warnMisconfigured("report", MISCONFIG_MESSAGE);
    return null;
  },
  addBreadcrumb: () => {
    // breadcrumbs without a token are a no-op, but safe — no warn needed
  },
  openReportDialog: () => {
    warnMisconfigured("openReportDialog", MISCONFIG_MESSAGE);
  },
};

const GlitchgrabContext = createContext<InternalContextValue | null>(null);

/**
 * Hook to access Glitchgrab in your components.
 *
 * Safe to call anywhere — does not throw. If the provider is missing or
 * misconfigured (no token), the hook returns stub methods that log a
 * visible warning when called.
 *
 * @example
 * ```tsx
 * const { reportBug, report, addBreadcrumb } = useGlitchgrab();
 * reportBug("Login button crashes on mobile");
 * ```
 */
export function useGlitchgrab(): UseGlitchgrabReturn {
  const ctx = useContext(GlitchgrabContext);
  return ctx ?? DISABLED_CONTEXT;
}

/**
 * Returns true if the Glitchgrab SDK is configured and ready to use.
 * Useful for conditionally rendering a report button only when the SDK works.
 *
 * @example
 * ```tsx
 * const ready = isGlitchgrabReady();
 * return ready ? <button onClick={openReportDialog}>Report</button> : null;
 * ```
 */
export function isGlitchgrabReady(): boolean {
  const ctx = useContext(GlitchgrabContext);
  return ctx?.ready === true;
}

function GlitchgrabProviderInner({
  token,
  session,
  baseUrl,
  onError,
  onReportSent,
  breadcrumbs: enableBreadcrumbs = true,
  maxBreadcrumbs = 50,
  children,
  fallback,
  types,
  showSeverity,
}: GlitchgrabProviderProps) {
  const visitedPagesRef = useRef<string[]>([]);

  useEffect(() => {
    if (enableBreadcrumbs) {
      initBreadcrumbs(maxBreadcrumbs);
    }
  }, [enableBreadcrumbs, maxBreadcrumbs]);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const trackPage = () => {
        try {
          const sanitized = sanitizeUrl(window.location.href);
          const pages = visitedPagesRef.current;
          if (pages[pages.length - 1] !== sanitized) {
            pages.push(sanitized);
            if (pages.length > 20) {
              pages.splice(0, pages.length - 20);
            }
          }
        } catch {
          // Silently fail
        }
      };

      trackPage();
      const handlePopState = () => trackPage();
      window.addEventListener("popstate", handlePopState);

      const origPushState = history.pushState.bind(history);
      const origReplaceState = history.replaceState.bind(history);

      history.pushState = function (...args) {
        origPushState(...args);
        trackPage();
      };
      history.replaceState = function (...args) {
        origReplaceState(...args);
        trackPage();
      };

      return () => {
        window.removeEventListener("popstate", handlePopState);
        history.pushState = origPushState;
        history.replaceState = origReplaceState;
      };
    } catch {
      // Never crash
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (process.env.NODE_ENV === "development") return;

      const handleError = (event: ErrorEvent) => {
        try {
          const context = captureContext(visitedPagesRef.current);
          const payload: ReportPayload = {
            token,
            source: "SDK_AUTO",
            type: "BUG",
            errorMessage: event.message,
            errorStack: event.error?.stack,
            pageUrl: context.url,
            userAgent: context.userAgent,
            breadcrumbs: context.breadcrumbs,
            deviceInfo: context.deviceInfo ?? undefined,
            metadata: {
              timestamp: context.timestamp,
              visitedPages: JSON.stringify(context.visitedPages),
              filename: event.filename ?? "",
              lineno: String(event.lineno ?? ""),
              colno: String(event.colno ?? ""),
              ...(session?.userId ? { sessionUserId: session.userId } : {}),
              ...(session?.name ? { sessionUserName: String(session.name) } : {}),
              ...(session?.email ? { sessionUserEmail: String(session.email) } : {}),
            },
          };
          sendReport(payload, baseUrl).then((result) => {
            if (result && onReportSent) onReportSent(result);
          });
          if (onError && event.error) onError(event.error);
        } catch {
          // Silently fail
        }
      };

      const handleRejection = (event: PromiseRejectionEvent) => {
        try {
          const context = captureContext(visitedPagesRef.current);
          const reason = event.reason;
          const payload: ReportPayload = {
            token,
            source: "SDK_AUTO",
            type: "BUG",
            errorMessage: reason instanceof Error ? reason.message : String(reason),
            errorStack: reason instanceof Error ? reason.stack : undefined,
            pageUrl: context.url,
            userAgent: context.userAgent,
            breadcrumbs: context.breadcrumbs,
            deviceInfo: context.deviceInfo ?? undefined,
            metadata: {
              timestamp: context.timestamp,
              visitedPages: JSON.stringify(context.visitedPages),
              type: "unhandledrejection",
              ...(session?.userId ? { sessionUserId: session.userId } : {}),
              ...(session?.name ? { sessionUserName: String(session.name) } : {}),
              ...(session?.email ? { sessionUserEmail: String(session.email) } : {}),
            },
          };
          sendReport(payload, baseUrl).then((result) => {
            if (result && onReportSent) onReportSent(result);
          });
          if (onError && reason instanceof Error) onError(reason);
        } catch {
          // Silently fail
        }
      };

      window.addEventListener("error", handleError);
      window.addEventListener("unhandledrejection", handleRejection);

      return () => {
        window.removeEventListener("error", handleError);
        window.removeEventListener("unhandledrejection", handleRejection);
      };
    } catch {
      // Never crash
    }
  }, [token, baseUrl, onError, onReportSent]);

  const report = useCallback(
    async (
      type: ReportType,
      description: string,
      metadata?: Record<string, string>
    ): Promise<ReportResult | null> => {
      try {
        const context = captureContext(visitedPagesRef.current);
        const payload: ReportPayload = {
          token,
          source: "SDK_USER_REPORT",
          type,
          description,
          pageUrl: context.url,
          userAgent: context.userAgent,
          breadcrumbs: context.breadcrumbs,
          deviceInfo: context.deviceInfo ?? undefined,
          metadata: {
            timestamp: context.timestamp,
            visitedPages: JSON.stringify(context.visitedPages),
            ...(session?.userId ? { sessionUserId: session.userId } : {}),
            ...(session?.name ? { sessionUserName: String(session.name) } : {}),
            ...(session?.email ? { sessionUserEmail: String(session.email) } : {}),
            ...(session?.phone ? { sessionUserPhone: String(session.phone) } : {}),
            ...metadata,
          },
        };
        const result = await sendReport(payload, baseUrl);
        if (result && onReportSent) onReportSent(result);
        return result;
      } catch {
        return null;
      }
    },
    [token, baseUrl, onReportSent, session]
  );

  const reportBug = useCallback(
    (description: string, metadata?: Record<string, string>) =>
      report("BUG", description, metadata),
    [report]
  );

  const addBreadcrumb = useCallback(
    (message: string, data?: Record<string, string>) => {
      addBreadcrumbInternal("custom", message, data);
    },
    []
  );

  const openReportDialog = useCallback((options?: { description?: string; type?: ReportType }) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("glitchgrab:open-report", { detail: options }));
    }
  }, []);

  const value = useMemo<InternalContextValue>(
    () => ({
      ready: true,
      token,
      baseUrl: baseUrl ?? DEFAULT_BASE_URL,
      reportBug,
      report,
      addBreadcrumb,
      openReportDialog,
    }),
    [token, baseUrl, reportBug, report, addBreadcrumb, openReportDialog]
  );

  return (
    <GlitchgrabContext.Provider value={value}>
      <GlitchgrabErrorBoundary
        token={token}
        baseUrl={baseUrl}
        onError={onError}
        fallback={fallback}
        visitedPages={visitedPagesRef.current}
      >
        {children}
      </GlitchgrabErrorBoundary>
      <ReportDialog report={report} types={types} showSeverity={showSeverity} />
    </GlitchgrabContext.Provider>
  );
}

export function GlitchgrabProvider(props: GlitchgrabProviderProps) {
  if (!props.token) {
    return (
      <GlitchgrabContext.Provider value={DISABLED_CONTEXT}>
        {props.children}
      </GlitchgrabContext.Provider>
    );
  }

  const resolvedProps = {
    ...props,
    baseUrl: props.baseUrl || DEFAULT_BASE_URL,
  };

  try {
    return <GlitchgrabProviderInner {...resolvedProps} />;
  } catch {
    return (
      <GlitchgrabContext.Provider value={DISABLED_CONTEXT}>
        {props.children}
      </GlitchgrabContext.Provider>
    );
  }
}
