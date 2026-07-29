import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as refereeApi from "../../api/refereeApi";
import { outOfRaceResultStatus, outOfRaceStatusLabel, RaceSummary } from "./race-day/RaceSummary";
import { RefereeOfficiatePage } from "./RefereeOfficiatePage";

vi.mock("../../api/refereeApi");

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(refereeApi, "submitRaceResultPackage").mockResolvedValue();
});

function renderPage() {
  vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
    id: 1,
    name: "Grand Derby",
    code: "R-1",
    distanceMeters: 1600,
    status: "SCHEDULED",
    scheduledAt: "2026-06-02T14:00:00+07:00",
    venue: "Turf Tower C",
  });
  vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue([
    {
      participantId: 7,
      horseName: "Golden Arrow",
      jockeyName: "Mina Park",
      jockeyWeight: 52,
      gearOk: true,
      healthOk: true,
      status: "PASSED",
    },
    {
      participantId: 5,
      horseName: "Thunderstrike",
      jockeyName: "Julian Sterling",
      jockeyWeight: 54,
      gearOk: true,
      healthOk: false,
      status: "FAILED",
    },
  ]);
  vi.spyOn(refereeApi, "savePreRaceChecks").mockResolvedValue();
  vi.spyOn(refereeApi, "startRace").mockResolvedValue("ONGOING");
  vi.spyOn(refereeApi, "finishRace").mockResolvedValue("FINISHED");

  render(
    <MemoryRouter initialEntries={["/referee/races/1/officiate"]}>
      <Routes>
        <Route element={<RefereeOfficiatePage />} path="/referee/races/:id/officiate" />
      </Routes>
    </MemoryRouter>
  );
}

function renderSummary(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("RefereeOfficiatePage", () => {
  it("shows timeline and checklist during pre-race, then moves scratched horses out of the live field board", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Pre-race checks" })).toBeInTheDocument();
    expect(screen.getAllByText("Scratched").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Mark race ready" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm & Enter Live Control" }));

    expect(await screen.findByRole("region", { name: "Live race workspace" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Golden Arrow" })).toBeInTheDocument();
    expect(screen.getByText("Thunderstrike")).toBeInTheDocument();
    expect(screen.getByText("DNS")).toBeInTheDocument();
  });

  it("moves a disqualified runner into Out of Race", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Mark race ready" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm & Enter Live Control" }));
    expect(await screen.findByRole("region", { name: "Live race workspace" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Disqualify Golden Arrow" }));

    expect(screen.getAllByText("Golden Arrow").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DSQ").length).toBeGreaterThan(0);
  });

  it("requires confirmation before aborting a red-flagged race", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Mark race ready" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm & Enter Live Control" }));
    expect(await screen.findByRole("region", { name: "Live race workspace" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "STOP RACE" }));
    fireEvent.click(screen.getByRole("button", { name: "STOP RACE" }));

    expect(confirm).toHaveBeenCalledWith("Abort this race? This freezes the current race state.");
    expect(screen.getByRole("button", { name: "START / RESUME" })).toBeInTheDocument();
    confirm.mockRestore();
  });

  it("proceeds to post-race after the referee records every runner finish", async () => {
    const confirm = vi.spyOn(window, "confirm");
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Mark race ready" }));
    const enterLiveButton = await screen.findByRole("button", { name: "Confirm & Enter Live Control" });
    try {
      fireEvent.click(enterLiveButton);
      expect(await screen.findByRole("region", { name: "Live race workspace" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Finish Golden Arrow" }));
      fireEvent.click(screen.getByRole("button", { name: "PROCEED TO POST-RACE" }));

      expect(confirm).not.toHaveBeenCalledWith("Finish this race and store the current draft snapshot?");
      expect(await screen.findByRole("heading", { name: "Draft finish order" })).toBeInTheDocument();
    } finally {
      confirm.mockRestore();
    }
  });

  it("carries a scratched runner into the post-race draft as DNS", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Mark race ready" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm & Enter Live Control" }));
    expect(await screen.findByRole("region", { name: "Live race workspace" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Finish Golden Arrow" }));
    fireEvent.click(screen.getByRole("button", { name: "PROCEED TO POST-RACE" }));

    expect(
      await screen.findByRole("heading", { name: "Did not start / did not finish / disqualified" })
    ).toBeInTheDocument();
    expect(screen.getByText("Thunderstrike")).toBeInTheDocument();
    expect(screen.getByText("DNS")).toBeInTheDocument();
  });

  it("points a finished race with no live draft at the result package, not the incident page", async () => {
    // This is the common case, not the exception: the in-memory draft only exists if the
    // referee finished the race in this browser session. Arriving from the races list or
    // after a reload lands here, so it must not offer the incident page as an equal path.
    vi.spyOn(refereeApi, "getAssignedRace").mockResolvedValue({
      id: 5,
      name: "Royal Ascendancy Cup 2026 - Race 3",
      code: "R-5",
      distanceMeters: 1400,
      status: "FINISHED",
    });
    vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/referee/races/5/officiate"]}>
        <Routes>
          <Route element={<RefereeOfficiatePage />} path="/referee/races/:id/officiate" />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Result package is the next step" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /continue to result package/i })).toHaveAttribute(
      "href",
      "/referee/races/5/results"
    );
    // The old label promised a report form that no longer lives on that page.
    expect(screen.queryByRole("link", { name: /add incident report/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log a race incident/i })).toHaveAttribute(
      "href",
      "/referee/races/5/report"
    );
  });

  it("captures a precise finish time between ticks instead of rounding to the tick size", async () => {
    const baseNow = 1_800_000_000_000;
    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(baseNow);

    try {
      renderPage();

      fireEvent.click(await screen.findByRole("button", { name: "Mark race ready" }));
      fireEvent.click(await screen.findByRole("button", { name: "Confirm & Enter Live Control" }));
      expect(await screen.findByRole("region", { name: "Live race workspace" })).toBeInTheDocument();

      dateNowSpy.mockReturnValue(baseNow + 350);
      fireEvent.click(screen.getByRole("button", { name: "Finish Golden Arrow" }));
      fireEvent.click(screen.getByRole("button", { name: "PROCEED TO POST-RACE" }));

      // 0.350s, not 0.500s — the clock advances by the real elapsed delta, not one whole tick.
      expect(await screen.findByText(/0\.350s \+ 0\.000s = 0\.350s/)).toBeInTheDocument();
    } finally {
      dateNowSpy.mockRestore();
    }
  });

  it("renders a finished draft snapshot summary", () => {
    renderSummary(
      <RaceSummary
        raceId={9}
        snapshot={{
          elapsedMilliseconds: 62_345,
          leaderboard: [
            {
              participantId: 7,
              horseName: "Golden Arrow",
              gateNumber: 1,
              progressPercent: 96,
              speedMultiplier: 1,
              status: "RUNNING",
            },
          ],
          outOfRace: [],
          incidents: [],
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Draft finish order" })).toBeInTheDocument();
    expect(screen.getByText("Golden Arrow")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /continue to submit results/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Appeals Board" })).not.toBeInTheDocument();
    expect(screen.getByText("62.345s + 0.000s = 62.345s")).toBeInTheDocument();
    expect(screen.getByText("P1 (was P1)")).toBeInTheDocument();
  });

  it("shows a remaining finish order section for runners beyond the top 3", () => {
    renderSummary(
      <RaceSummary
        raceId={9}
        snapshot={{
          elapsedMilliseconds: 70_000,
          leaderboard: [
            {
              participantId: 7,
              horseName: "Golden Arrow",
              gateNumber: 1,
              progressPercent: 100,
              speedMultiplier: 1,
              status: "RUNNING",
              finishMilliseconds: 62_345,
            },
            {
              participantId: 5,
              horseName: "Night Bloom",
              gateNumber: 2,
              progressPercent: 100,
              speedMultiplier: 0.98,
              status: "RUNNING",
              finishMilliseconds: 63_000,
            },
            {
              participantId: 3,
              horseName: "Silver Comet",
              gateNumber: 3,
              progressPercent: 100,
              speedMultiplier: 0.95,
              status: "RUNNING",
              finishMilliseconds: 64_000,
            },
            {
              participantId: 9,
              horseName: "Blue Ridge",
              gateNumber: 4,
              progressPercent: 100,
              speedMultiplier: 0.9,
              status: "RUNNING",
              finishMilliseconds: 65_000,
            },
          ],
          outOfRace: [],
          incidents: [],
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Remaining finish order" })).toBeInTheDocument();
    expect(screen.getByText("Blue Ridge")).toBeInTheDocument();
    expect(screen.getByLabelText("Override total time for Blue Ridge")).toBeEnabled();
    expect(screen.getByText("P4 (was P4)")).toBeInTheDocument();
  });

  it("hides the remaining finish order section when there are 3 or fewer finishers", () => {
    renderSummary(
      <RaceSummary
        raceId={9}
        snapshot={{
          elapsedMilliseconds: 62_345,
          leaderboard: [
            {
              participantId: 7,
              horseName: "Golden Arrow",
              gateNumber: 1,
              progressPercent: 96,
              speedMultiplier: 1,
              status: "RUNNING",
            },
          ],
          outOfRace: [],
          incidents: [],
        }}
      />
    );

    expect(screen.queryByRole("heading", { name: "Remaining finish order" })).not.toBeInTheDocument();
  });

  it("shows did-not-finish and disqualified runners as read-only", () => {
    renderSummary(
      <RaceSummary
        raceId={9}
        snapshot={{
          elapsedMilliseconds: 62_345,
          leaderboard: [
            {
              participantId: 7,
              horseName: "Golden Arrow",
              gateNumber: 1,
              progressPercent: 96,
              speedMultiplier: 1,
              status: "RUNNING",
              finishMilliseconds: 62_345,
            },
          ],
          outOfRace: [
            {
              participantId: 5,
              horseName: "Thunderstrike",
              gateNumber: 2,
              progressPercent: 0,
              speedMultiplier: 1,
              status: "DNS",
            },
            {
              participantId: 3,
              horseName: "Night Bloom",
              gateNumber: 3,
              progressPercent: 60,
              speedMultiplier: 1,
              status: "DSQ",
            },
          ],
          incidents: [],
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Did not start / did not finish / disqualified" })).toBeInTheDocument();
    expect(screen.getByText("Thunderstrike")).toBeInTheDocument();
    expect(screen.getByText("Night Bloom")).toBeInTheDocument();
    expect(screen.getByText("DNS")).toBeInTheDocument();
    expect(screen.getByText("DSQ")).toBeInTheDocument();
    expect(screen.queryByLabelText("Override total time for Thunderstrike")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Override total time for Night Bloom")).not.toBeInTheDocument();
  });

  it("sends the referee to the submission screen instead of submitting from the draft view", () => {
    renderSummary(
      <RaceSummary
        raceId={9}
          snapshot={{
            elapsedMilliseconds: 62_345,
            leaderboard: [
              {
                participantId: 7,
                horseName: "Golden Arrow",
                jockeyName: "Mina Park",
                gateNumber: 1,
                progressPercent: 100,
                speedMultiplier: 1,
                status: "RUNNING",
                finishMilliseconds: 62_345,
              },
            ],
            outOfRace: [],
            incidents: [],
        }}
      />
    );

    expect(screen.queryByRole("button", { name: /confirm official result/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/appeals board/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /continue to submit results/i })).toHaveAttribute(
      "href",
      "/referee/races/9/results"
    );
  });

  it("maps a scratched runner to WITHDRAWN, never to DID_NOT_FINISH", () => {
    // DNS and DNF are not interchangeable: a scratched horse never started, and
    // ResultFinishStatus.WITHDRAWN exists for exactly that case.
    expect(outOfRaceResultStatus("DNS")).toBe("WITHDRAWN");
    expect(outOfRaceResultStatus("DSQ")).toBe("DISQUALIFIED");
    expect(outOfRaceResultStatus("DNF")).toBe("DID_NOT_FINISH");
    expect(outOfRaceStatusLabel("DNS")).toBe("DNS");
    expect(outOfRaceStatusLabel("DNF")).toBe("DNF");
  });

  it("requires Update Time before applying a manual total time override", () => {
    renderSummary(
      <RaceSummary
        raceId={9}
        snapshot={{
          elapsedMilliseconds: 62_345,
          leaderboard: [
            {
              participantId: 7,
              horseName: "Golden Arrow",
              gateNumber: 1,
              progressPercent: 96,
              speedMultiplier: 1,
              status: "RUNNING",
            },
          ],
          outOfRace: [],
          incidents: [],
        }}
      />
    );

    const override = screen.getByLabelText("Override total time for Golden Arrow");
    fireEvent.change(override, { target: { value: "62.344" } });

    expect(screen.getByText("62.345s + 0.000s = 62.345s")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Update time for Golden Arrow" }));

    expect(screen.getByText("62.345s + 0.000s = 62.344s")).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("reorders draft rows only after Update Time is saved", () => {
    renderSummary(
      <RaceSummary
        raceId={9}
        snapshot={{
          elapsedMilliseconds: 62_345,
          leaderboard: [
            {
              participantId: 7,
              horseName: "Golden Arrow",
              gateNumber: 1,
              progressPercent: 96,
              speedMultiplier: 1,
              status: "RUNNING",
            },
            {
              participantId: 5,
              horseName: "Night Bloom",
              gateNumber: 2,
              progressPercent: 95,
              speedMultiplier: 0.98,
              status: "RUNNING",
            },
          ],
          outOfRace: [],
          incidents: [],
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Override total time for Night Bloom"), { target: { value: "62.000" } });

    expect(screen.getByText("P2 (was P2)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Update time for Night Bloom" }));

    expect(screen.getByText("P1 (was P2)")).toBeInTheDocument();
  });

});
