import { describe, expect, it } from "vitest";

import { getTournamentDateValidationError } from "./tournamentDateValidation";

const now = new Date("2026-06-07T12:00:00");

describe("getTournamentDateValidationError", () => {
  it("rejects a registration start time in the past", () => {
    expect(
      getTournamentDateValidationError(
        {
          startDate: "2026-07-01",
          endDate: "2026-07-15",
          registrationStartAt: "2026-06-07T11:59",
          registrationEndAt: "2026-06-25T18:00",
        },
        now,
      ),
    ).toBe("Registration start time cannot be in the past.");
  });

  it("rejects a registration end time before its start time", () => {
    expect(
      getTournamentDateValidationError(
        {
          startDate: "2026-07-01",
          endDate: "2026-07-15",
          registrationStartAt: "2026-06-10T09:00",
          registrationEndAt: "2026-06-10T08:59",
        },
        now,
      ),
    ).toBe("Registration end time cannot be before start time.");
  });

  it("rejects a registration end time at the tournament start date", () => {
    expect(
      getTournamentDateValidationError(
        {
          startDate: "2026-07-01",
          endDate: "2026-07-15",
          registrationStartAt: "2026-06-10T09:00",
          registrationEndAt: "2026-07-01T00:00",
        },
        now,
      ),
    ).toBe("Registration end time must be before championship start date.");
  });

  it("accepts a registration window that ends before the tournament start date", () => {
    expect(
      getTournamentDateValidationError(
        {
          startDate: "2026-07-01",
          endDate: "2026-07-15",
          registrationStartAt: "2026-06-10T09:00",
          registrationEndAt: "2026-06-30T23:59",
        },
        now,
      ),
    ).toBeNull();
  });
});
