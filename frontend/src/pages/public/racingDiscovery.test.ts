import { describe, expect, it } from "vitest";

import {
  groupAgendaRaces,
  groupRacesByTimeSlot,
  parseRaceDiscoveryQuery,
  selectRacePulse,
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

  it("keeps a running championship without a published next race ahead of closed registration", () => {
    const focus = selectChampionshipInFocus([
      {
        id: 1,
        name: "Closed Registration Cup",
        status: "CLOSED_REGISTRATION",
        raceCount: 0,
        participantCount: 0,
      },
      {
        id: 2,
        name: "Running Cup",
        status: "ONGOING",
        raceCount: 8,
        participantCount: 8,
        nextRace: null,
      },
    ]);

    expect(focus?.name).toBe("Running Cup");
  });

  it("selects the nearest upcoming race and falls back to the latest result", () => {
    expect(
      selectNextToPost(
        [race(2, "2026-06-13T14:00:00"), race(1, "2026-06-12T14:00:00")],
        [race(3, "2026-06-10T14:00:00", "RESULT_CONFIRMED")],
        new Date("2026-06-11T12:00:00"),
      )?.id,
    ).toBe(1);

    expect(selectNextToPost([], [race(3, "2026-06-10T14:00:00", "RESULT_CONFIRMED")])?.id).toBe(3);
  });

  it("does not label a stale scheduled race as next to post", () => {
    expect(
      selectNextToPost(
        [race(1, "2026-07-25T14:00:00"), race(2, "2026-08-01T14:00:00")],
        [],
        new Date("2026-07-29T12:00:00"),
      )?.id,
    ).toBe(2);
  });

  it("groups agenda races by exact race day", () => {
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
      "Live now",
      "Today · Fri, Jun 12",
      "Tomorrow · Sat, Jun 13",
      "Mon, Jun 15",
      "Thu, Jun 25",
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
it("selects a live race before any latest result", () => {
  const selected = selectRacePulse(
    [race(1, "2026-07-29T14:00:00", "ONGOING")],
    [race(2, "2026-07-28T14:00:00", "PUBLISHED")],
    new Date("2026-07-29T12:00:00"),
  );

  expect(selected).toMatchObject({ mode: "LIVE", race: { id: 1 } });
});

it("selects the latest official result when no race is live", () => {
  const selected = selectRacePulse(
    [],
    [
      race(1, "2026-07-27T14:00:00", "RESULT_CONFIRMED"),
      race(2, "2026-07-28T14:00:00", "PUBLISHED"),
    ],
    new Date("2026-07-29T12:00:00"),
  );

  expect(selected).toMatchObject({ mode: "LATEST_RESULT", race: { id: 2 } });
});

it("falls back to the nearest future race when no official result exists", () => {
  const selected = selectRacePulse(
    [race(1, "2026-07-28T14:00:00"), race(2, "2026-08-01T14:00:00")],
    [],
    new Date("2026-07-29T12:00:00"),
  );

  expect(selected).toMatchObject({ mode: "NEXT_RACE", race: { id: 2 } });
});

it("returns null when there is no live, official, or future race", () => {
  expect(selectRacePulse([], [], new Date("2026-07-29T12:00:00"))).toBeNull();
});

});
