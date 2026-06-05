import { beforeEach, describe, expect, it } from "vitest";
import { clearClientSession, getClientSession, setClientSession } from "./authSession";

describe("authSession", () => {
  beforeEach(() => {
    clearClientSession({ notify: false });
  });

  it("keeps the access token in memory instead of localStorage", () => {
    setClientSession("access-token", "Official User", "official@example.com");

    expect(getClientSession()).toEqual({
      accessToken: "access-token",
      fullName: "Official User",
      email: "official@example.com",
    });
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("fullName")).toBe("Official User");
    expect(localStorage.getItem("email")).toBe("official@example.com");
  });

  it("removes legacy stored access tokens when setting or clearing a session", () => {
    localStorage.setItem("accessToken", "legacy-token");

    setClientSession("new-access-token", null, null);
    expect(localStorage.getItem("accessToken")).toBeNull();

    localStorage.setItem("accessToken", "legacy-token");
    clearClientSession({ notify: false });
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(getClientSession().accessToken).toBeNull();
  });
});
