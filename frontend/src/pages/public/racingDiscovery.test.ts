import { describe, expect, it } from "vitest";

import {
  groupAgendaRaces,
  groupRacesByTimeSlot,
  parseRaceDiscoveryQuery,
  selectChampionshipInFocus,
  selectNextToPost,
} from "./racingDiscovery";

const race = (id: number, raceDateTime: string, status = "SCHEDULED") => ({
  id,
  name: `Race ${id}`,
  code: `R-${id}`,
  tournamentId: 1,
  tournamentName: "Summer Cup",
  raceDateTime,
  location: "Belmont",
  distanceMeters: 1200,
  maxParticipants: 12,
  participantCount: 8,
  status,
  predictionOpen: status === "SCHEDULED",
  predictionCloseTime: raceDateTime,
  resultOfficial: status === "RESULT_CONFIRMED",
});

describe("public racing discovery helpers", () => {
  it("selects an ongoing championship with a next race before open registration", () => {
    const focus = selectChampionshipInFocus([
      {
        id: 1,
        name: "Open Cup",
        status: "OPEN_REGISTRATION",
        registrationEndAt: "2026-06-13T18:00:00",
        raceCount: 0,
        participantCount: 0,
      },
      {
        id: 2,
        name: "Live Cup",
        status: "ONGOING",
        raceCount: 1,
        participantCount: 8,
        nextRace: { id: 22, name: "Round 3", raceDateTime: "2026-06-14T14:00:00", status: "SCHEDULED" },
      },
    ]);

    expect(focus?.name).toBe("Live Cup");
  });

  it("selects the nearest upcoming race and falls back to the latest result", () => {
    expect(
      selectNextToPost(
        [race(2, "2026-06-13T14:00:00"), race(1, "2026-06-12T14:00:00")],
        [race(3, "2026-06-10T14:00:00", "RESULT_CONFIRMED")],
      )?.id,
    ).toBe(1);

    expect(selectNextToPost([], [race(3, "2026-06-10T14:00:00", "RESULT_CONFIRMED")])?.id).toBe(3);
  });

  it("groups agenda races by live, today, tomorrow, this week, and later", () => {
    const groups = groupAgendaRaces(
      [
        race(1, "2026-06-12T10:00:00", "ONGOING"),
        race(2, "2026-06-12T14:00:00"),
        race(3, "2026-06-13T14:00:00"),
        race(4, "2026-06-15T14:00:00"),
        race(5, "2026-06-25T14:00:00"),
      ],
      new Date("2026-06-12T09:00:00"),
    );

    expect(groups.map((group) => group.label)).toEqual([
      "Live Now",
      "Today",
      "Tomorrow",
      "This Week",
      "Later This Month",
    ]);
  });

  it("groups a dense race day into readable time slots", () => {
    const groups = groupRacesByTimeSlot([
      race(1, "2026-06-12T09:00:00"),
      race(2, "2026-06-12T14:00:00"),
      race(3, "2026-06-12T19:00:00"),
    ]);

    expect(groups.map((group) => group.label)).toEqual(["Morning", "Afternoon", "Evening"]);
  });

  it("uses URL parameters as the source of truth with safe defaults", () => {
    expect(parseRaceDiscoveryQuery(new URLSearchParams("scope=RESULTS&view=calendar&page=2&month=2026-07"))).toEqual(
      expect.objectContaining({
        scope: "RESULTS",
        view: "calendar",
        page: 2,
        month: "2026-07",
      }),
    );
    expect(parseRaceDiscoveryQuery(new URLSearchParams("scope=bad&view=bad&page=-2"))).toEqual(
      expect.objectContaining({ scope: "UPCOMING", view: "agenda", page: 0 }),
    );
  });
});
