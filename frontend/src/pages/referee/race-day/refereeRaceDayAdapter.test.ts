import { describe, expect, it } from "vitest";
import { normalizeAssignedRace, normalizeParticipant } from "./refereeRaceDayAdapter";

describe("refereeRaceDayAdapter", () => {
  it("adds deterministic demo schedule values when the backend summary has no scheduling fields", () => {
    expect(
      normalizeAssignedRace(
        {
          id: 1,
          code: "R-1",
          name: "Heat 1",
          distanceMeters: 1600,
          status: "ACTIVE",
        },
        new Date("2026-06-02T09:00:00+07:00")
      )
    ).toMatchObject({
      scheduledAt: "2026-06-02T14:00:00.000+07:00",
      venue: "Turf Tower C",
    });
  });

  it("maps failed verification to scratched with an audit reason", () => {
    expect(
      normalizeParticipant({
        participantId: 5,
        horseName: "Thunderstrike",
        jockeyName: "Julian",
        jockeyWeight: 54,
        gearOk: true,
        healthOk: false,
        status: "FAILED",
      })
    ).toMatchObject({
      status: "SCRATCHED",
      scratchedReason: "Failed health check",
    });
  });
});
