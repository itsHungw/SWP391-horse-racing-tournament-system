import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as refereeApi from "../../api/refereeApi";
import { RaceSummary } from "./race-day/RaceSummary";
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
      expect(await screen.findByRole("heading", { name: "Official finish order" })).toBeInTheDocument();
    } finally {
      confirm.mockRestore();
    }
  });

  it("includes a scratched runner in the submitted result package", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Mark race ready" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm & Enter Live Control" }));
    expect(await screen.findByRole("region", { name: "Live race workspace" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Finish Golden Arrow" }));
    fireEvent.click(screen.getByRole("button", { name: "PROCEED TO POST-RACE" }));

    fireEvent.click(await screen.findByRole("button", { name: "Update finish order" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm official result" }));

    const submitSpy = vi.mocked(refereeApi.submitRaceResultPackage);
    expect(submitSpy).toHaveBeenCalled();
    const payload = submitSpy.mock.calls[0][1];
    expect(payload.results.map((entry) => entry.participantId)).toContain(5);
  });

  it("renders a finished draft snapshot summary", () => {
    render(
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

    expect(screen.getByRole("heading", { name: "Official finish order" })).toBeInTheDocument();
    expect(screen.getByText("Golden Arrow")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update finish order" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Confirm official result" })).toBeDisabled();
    expect(screen.queryByRole("heading", { name: "Appeals Board" })).not.toBeInTheDocument();
    expect(screen.getByText("62.345s + 0.000s = 62.345s")).toBeInTheDocument();
    expect(screen.getByText("P1 (was P1)")).toBeInTheDocument();
  });

  it("requires Update Time before applying a manual total time override", () => {
    render(
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
    render(
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

  it("keeps official publish locked until appeals are resolved or rejected", () => {
    render(
      <RaceSummary
        raceId={9}
        appeals={[
          {
            id: "appeal-1",
            teamName: "Stable Team A",
            allegation: "Horse #7 shifted lane in final stretch",
            status: "PENDING",
          },
        ]}
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

    expect(screen.queryByRole("heading", { name: "Appeals Board" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Update finish order" }));

    expect(screen.getByRole("button", { name: "Confirm official result" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Accept appeal from Stable Team A" }));
    fireEvent.change(screen.getByLabelText("Penalty seconds for Stable Team A"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save accepted appeal for Stable Team A" }));

    expect(screen.getByText("Resolved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm official result" })).toBeEnabled();
  });

  it("requires a rejection reason before dismissing an appeal", () => {
    render(
      <RaceSummary
        raceId={9}
        appeals={[
          {
            id: "appeal-1",
            teamName: "Stable Team A",
            allegation: "Horse #7 shifted lane in final stretch",
            status: "PENDING",
          },
        ]}
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

    fireEvent.click(screen.getByRole("button", { name: "Update finish order" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject appeal from Stable Team A" }));
    expect(screen.getByRole("button", { name: "Save rejected appeal for Stable Team A" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Rejection reason for Stable Team A"), {
      target: { value: "No lane violation on replay" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save rejected appeal for Stable Team A" }));

    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm official result" })).toBeEnabled();
  });

  it("locks the race summary after publishing official results", async () => {
    render(
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

    fireEvent.click(screen.getByRole("button", { name: "Update finish order" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm official result" }));

    expect(await screen.findByText("Official result confirmed")).toBeInTheDocument();
    expect(screen.getByLabelText("Override total time for Golden Arrow")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Update finish order" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Confirm official result" })).toBeDisabled();
  });
});
