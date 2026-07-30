import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearClientSession, setClientSession } from "../../../utils/authSession";
import { useRulesFirstRun } from "./useRulesFirstRun";

function login(email: string) {
  setClientSession("token", "Test Spectator", email);
}

describe("useRulesFirstRun", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearClientSession({ notify: false });
    login("first@example.com");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the guide on a spectator's first visit", () => {
    const { result } = renderHook(() => useRulesFirstRun());

    expect(result.current.rulesOpen).toBe(true);
  });

  it("stays closed on later mounts, so switching bet mode does not re-open it", () => {
    const first = renderHook(() => useRulesFirstRun());
    expect(first.result.current.rulesOpen).toBe(true);
    first.unmount();

    // Switching Exact Position <-> Winning Streak unmounts one slip and mounts
    // the other; the guide must not treat that as a new first visit.
    const second = renderHook(() => useRulesFirstRun());
    expect(second.result.current.rulesOpen).toBe(false);

    const afterReload = renderHook(() => useRulesFirstRun());
    expect(afterReload.result.current.rulesOpen).toBe(false);
  });

  it("opens again for a different account on the same browser", () => {
    renderHook(() => useRulesFirstRun()).unmount();

    // clearClientSession() only drops the auth keys, so the guide's flag
    // outlives logout. It must not count as "seen" for the next spectator.
    clearClientSession({ notify: false });
    login("second@example.com");

    const { result } = renderHook(() => useRulesFirstRun());
    expect(result.current.rulesOpen).toBe(true);
  });

  it("does not re-open when the same account logs back in", () => {
    renderHook(() => useRulesFirstRun()).unmount();

    clearClientSession({ notify: false });
    login("first@example.com");

    const { result } = renderHook(() => useRulesFirstRun());
    expect(result.current.rulesOpen).toBe(false);
  });

  it("still opens on demand once the guide has been seen", () => {
    renderHook(() => useRulesFirstRun()).unmount();

    const { result } = renderHook(() => useRulesFirstRun());
    expect(result.current.rulesOpen).toBe(false);

    act(() => result.current.openRules());
    expect(result.current.rulesOpen).toBe(true);

    act(() => result.current.closeRules());
    expect(result.current.rulesOpen).toBe(false);
  });

  it("does not auto-open without a signed-in account", () => {
    clearClientSession({ notify: false });

    const { result } = renderHook(() => useRulesFirstRun());

    expect(result.current.rulesOpen).toBe(false);
  });

  it("does not auto-open when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    const { result } = renderHook(() => useRulesFirstRun());

    // Failing closed: better to never auto-open than to auto-open every mount
    // because the "seen" flag can never be persisted.
    expect(result.current.rulesOpen).toBe(false);
  });
});
