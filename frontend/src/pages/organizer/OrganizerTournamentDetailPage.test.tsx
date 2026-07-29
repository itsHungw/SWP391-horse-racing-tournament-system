import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as racingApi from "../../api/racingApi";
import { RaceResultSummary } from "./OrganizerTournamentDetailPage";

vi.mock("../../api/racingApi");

describe("RaceResultSummary", () => {
  it("labels disqualified and withdrawn runners distinctly instead of both showing DNF", async () => {
    vi.spyOn(racingApi, "getOrganizerRaceResults").mockResolvedValue({
      raceId: 9,
      official: false,
      entries: [
        {
          horseName: "Golden Arrow",
          position: 1,
          finishTimeSeconds: 62.345,
          points: 25,
          resultStatus: "FINISHED",
        },
        {
          horseName: "Night Bloom",
          points: 0,
          resultStatus: "DISQUALIFIED",
        },
        {
          horseName: "Thunderstrike",
          points: 0,
          resultStatus: "WITHDRAWN",
        },
        {
          horseName: "Silver Comet",
          points: 0,
          resultStatus: "DID_NOT_FINISH",
        },
      ],
    });

    render(<RaceResultSummary raceId={9} />);

    expect(await screen.findByText("Golden Arrow")).toBeInTheDocument();
    expect(screen.getByText("DSQ")).toBeInTheDocument();
    expect(screen.getByText("DNS")).toBeInTheDocument();
    expect(screen.getByText("DNF")).toBeInTheDocument();
  });
});
