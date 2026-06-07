import { describe, expect, it } from "vitest";

import { getDashboardRouteForRoles } from "./dashboardRoute";

describe("getDashboardRouteForRoles", () => {
  it("routes admins to the existing admin overview", () => {
    expect(getDashboardRouteForRoles(["ADMIN", "HORSE_OWNER"])).toBe("/admin");
  });

  it("routes horse owners to the owner workspace dashboard", () => {
    expect(getDashboardRouteForRoles(["HORSE_OWNER"])).toBe("/owner/dashboard");
  });

  it("routes jockeys and referees to their reserved dashboards", () => {
    expect(getDashboardRouteForRoles(["JOCKEY"])).toBe("/jockey/dashboard");
    expect(getDashboardRouteForRoles(["REFEREE"])).toBe("/referee/dashboard");
  });

  it("falls back to spectator dashboard", () => {
    expect(getDashboardRouteForRoles([])).toBe("/spectator/dashboard");
    expect(getDashboardRouteForRoles(["SPECTATOR"])).toBe("/spectator/dashboard");
  });
});
