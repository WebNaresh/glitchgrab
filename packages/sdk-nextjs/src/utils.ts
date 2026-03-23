import type { ReportPayload, CapturedContext } from "./types";

const SENSITIVE_PARAMS = [
  "token",
  "key",
  "secret",
  "password",
  "passwd",
  "auth",
  "authorization",
  "session",
  "sessionid",
  "session_id",
  "api_key",
  "apikey",
  "access_token",
  "refresh_token",
  "client_secret",
  "code",
  "state",
  "nonce",
  "credential",
  "private",
];

/**
 * Strip sensitive query parameters from a URL.
 * Returns the URL with sensitive params replaced by [REDACTED].
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const params = new URLSearchParams(parsed.search);
    let modified = false;

    for (const key of Array.from(params.keys())) {
      const lower = key.toLowerCase();
      if (SENSITIVE_PARAMS.some((s) => lower.includes(s))) {
        params.set(key, "[REDACTED]");
        modified = true;
      }
    }

    if (modified) {
      parsed.search = params.toString();
    }

    return parsed.toString();
  } catch {
    // If URL parsing fails, return a safe fallback
    return url.split("?")[0] ?? url;
  }
}

/**
 * Capture current browser context for error reporting.
 */
export function captureContext(visitedPages: string[]): CapturedContext {
  try {
    return {
      url: sanitizeUrl(
        typeof window !== "undefined" ? window.location.href : ""
      ),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      timestamp: new Date().toISOString(),
      visitedPages: visitedPages.map(sanitizeUrl),
    };
  } catch {
    return {
      url: "",
      userAgent: "",
      timestamp: new Date().toISOString(),
      visitedPages: [],
    };
  }
}

const DEFAULT_BASE_URL = "https://glitchgrab.dev";
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

/**
 * Send a report to the Glitchgrab API.
 * Uses fetch with keepalive, falls back to sendBeacon.
 * Never throws — all errors are silently caught.
 */
export async function sendReport(
  payload: ReportPayload,
  baseUrl?: string
): Promise<void> {
  try {
    const url = `${baseUrl ?? DEFAULT_BASE_URL}/api/v1/sdk/report`;
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${payload.token}`,
    };

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body,
          keepalive: true,
        });

        if (response.ok) return;

        // Don't retry on client errors (4xx) except 429
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return;
        }
      } catch {
        // fetch failed — will retry or fall back to sendBeacon
      }

      // Wait before retrying (exponential backoff)
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_BASE_MS * Math.pow(2, attempt))
        );
      }
    }

    // Final fallback: sendBeacon (fire-and-forget, no auth header possible)
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      try {
        navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      } catch {
        // Silently fail
      }
    }
  } catch {
    // Never throw from this function
  }
}
