import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, renderHook } from "@testing-library/react";
import { GlitchgrabProvider, useGlitchgrab, isGlitchgrabReady } from "../provider";
import { __resetWarnToast } from "../warn-toast";

describe("Glitchgrab misconfigured behavior", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetWarnToast();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    document.body.innerHTML = "";
  });

  it("useGlitchgrab() does not throw when called outside a provider", () => {
    const { result } = renderHook(() => useGlitchgrab());
    expect(result.current).toBeDefined();
    expect(result.current.token).toBe("");
    expect(typeof result.current.openReportDialog).toBe("function");
  });

  it("useGlitchgrab() does not throw when provider has no token", () => {
    function Probe() {
      const gg = useGlitchgrab();
      return <span data-testid="token">{gg.token || "empty"}</span>;
    }
    render(
      <GlitchgrabProvider token="">
        <Probe />
      </GlitchgrabProvider>
    );
    expect(screen.getByTestId("token").textContent).toBe("empty");
  });

  it("isGlitchgrabReady() returns false with no provider", () => {
    const { result } = renderHook(() => isGlitchgrabReady());
    expect(result.current).toBe(false);
  });

  it("isGlitchgrabReady() returns false when token is missing", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlitchgrabProvider token="">{children}</GlitchgrabProvider>
    );
    const { result } = renderHook(() => isGlitchgrabReady(), { wrapper });
    expect(result.current).toBe(false);
  });

  it("isGlitchgrabReady() returns true when token is set", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlitchgrabProvider token="gg_test_token">{children}</GlitchgrabProvider>
    );
    const { result } = renderHook(() => isGlitchgrabReady(), { wrapper });
    expect(result.current).toBe(true);
  });

  it("openReportDialog() warns to console when misconfigured", () => {
    function Trigger() {
      const { openReportDialog } = useGlitchgrab();
      return <button onClick={() => openReportDialog()}>open</button>;
    }
    render(
      <GlitchgrabProvider token="">
        <Trigger />
      </GlitchgrabProvider>
    );
    act(() => {
      screen.getByRole("button", { name: "open" }).click();
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("isn't configured")
    );
  });

  it("openReportDialog() renders a visible toast when misconfigured", () => {
    function Trigger() {
      const { openReportDialog } = useGlitchgrab();
      return <button onClick={() => openReportDialog()}>open</button>;
    }
    render(
      <GlitchgrabProvider token="">
        <Trigger />
      </GlitchgrabProvider>
    );
    act(() => {
      screen.getByRole("button", { name: "open" }).click();
    });
    const toast = document.getElementById("glitchgrab-misconfig-toast");
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain("Glitchgrab not configured");
  });

  it("console.warn is deduped across repeated calls", () => {
    function Trigger() {
      const { openReportDialog } = useGlitchgrab();
      return <button onClick={() => openReportDialog()}>open</button>;
    }
    render(
      <GlitchgrabProvider token="">
        <Trigger />
      </GlitchgrabProvider>
    );
    const btn = screen.getByRole("button", { name: "open" });
    act(() => {
      btn.click();
      btn.click();
      btn.click();
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("report() resolves to null and warns when misconfigured", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GlitchgrabProvider token="">{children}</GlitchgrabProvider>
    );
    const { result } = renderHook(() => useGlitchgrab(), { wrapper });
    const res = await result.current.report("BUG", "test");
    expect(res).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
});
