import { describe, expect, it } from "vitest";

import { canAccessPath, requiredRoleForPath } from "./routeAccess";

describe("requiredRoleForPath", () => {
  it("maps each workspace prefix to its role", () => {
    expect(requiredRoleForPath("/admin")).toBe("ADMIN");
    expect(requiredRoleForPath("/admin/finance/topups")).toBe("ADMIN");
    expect(requiredRoleForPath("/organizer/tournaments")).toBe("ORGANIZER");
    expect(requiredRoleForPath("/owner/horses/12")).toBe("HORSE_OWNER");
    expect(requiredRoleForPath("/jockey/contracts")).toBe("JOCKEY");
    expect(requiredRoleForPath("/referee/races/3/officiate")).toBe("REFEREE");
  });

  it("treats login-only routes as unrestricted", () => {
    expect(requiredRoleForPath("/")).toBeNull();
    expect(requiredRoleForPath("/wallet")).toBeNull();
    expect(requiredRoleForPath("/spectator/predictions")).toBeNull();
    expect(requiredRoleForPath("/profile")).toBeNull();
  });

  it("exempts /organizer/register, which any signed-in user may open", () => {
    expect(requiredRoleForPath("/organizer/register")).toBeNull();
  });

  it("matches on whole segments, not raw string prefixes", () => {
    expect(requiredRoleForPath("/ownerships")).toBeNull();
    expect(requiredRoleForPath("/administration")).toBeNull();
  });

  it("ignores query and hash", () => {
    expect(requiredRoleForPath("/owner/dashboard?tab=entries#history")).toBe("HORSE_OWNER");
    expect(requiredRoleForPath("/admin/")).toBe("ADMIN");
  });
});

describe("canAccessPath", () => {
  it("lets a role into its own workspace", () => {
    expect(canAccessPath("/admin/users", ["ADMIN", "SPECTATOR"])).toBe(true);
    expect(canAccessPath("/owner/horses", ["HORSE_OWNER"])).toBe(true);
  });

  it("keeps an account out of a workspace it lacks the role for", () => {
    expect(canAccessPath("/admin/users", ["SPECTATOR"])).toBe(false);
    expect(canAccessPath("/referee/dashboard", ["HORSE_OWNER", "JOCKEY"])).toBe(false);
  });

  it("allows unrestricted routes for any account", () => {
    expect(canAccessPath("/spectator/predictions", ["SPECTATOR"])).toBe(true);
    expect(canAccessPath("/wallet", [])).toBe(true);
  });

  it("compares roles case-insensitively", () => {
    expect(canAccessPath("/admin", ["admin"])).toBe(true);
  });
});
