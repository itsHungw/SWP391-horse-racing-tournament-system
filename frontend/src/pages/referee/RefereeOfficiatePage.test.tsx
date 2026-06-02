import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import * as refereeApi from "../../api/refereeApi";
import { RaceSummary } from "./race-day/RaceSummary";
import { RefereeOfficiatePage } from "./RefereeOfficiatePage";

vi.mock("../../api/refereeApi");

function renderPage() {
  vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue([
    {
      id: 1,
      name: "Grand Derby",
      code: "R-1",
      distanceMeters: 1600,
      status: "SCHEDULED",
      scheduledAt: "2026-06-02T14:00:00+07:00",
      venue: "Turf Tower C",
    },
  ]);
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

  render(
    <MemoryRouter initialEntries={["/referee/races/1/officiate"]}>
      <Routes>
        <Route element={<RefereeOfficiatePage />} path="/referee/races/:id/officiate" />
      </Routes>
    </MemoryRouter>
  );
}

describe("RefereeOfficiatePage", () => {
  it("shows timeline and checklist during pre-race, then excludes scratched horses from live", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Pre-Race Verification" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Today's Race Timeline" })).toBeInTheDocument();
    expect(screen.getByText("SCRATCHED")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm Pre-Race Checks" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm & Enter Live Control" }));

    expect(await screen.findByRole("region", { name: "Live race workspace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /P1 Golden Arrow/i })).toBeInTheDocument();
    expect(screen.queryByText("Thunderstrike")).not.toBeInTheDocument();
  });

  it("moves a disqualified runner into Out of Race", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Confirm Pre-Race Checks" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm & Enter Live Control" }));
    fireEvent.click(screen.getByRole("button", { name: /P1 Golden Arrow/i }));
    fireEvent.click(screen.getByRole("button", { name: "Disqualify Golden Arrow" }));

    expect(screen.getByText(/DSQ - Golden Arrow/i)).toBeInTheDocument();
  });

  it("renders a finished draft snapshot summary", () => {
    render(
      <RaceSummary
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

    expect(screen.getByRole("heading", { name: "Race Summary" })).toBeInTheDocument();
    expect(screen.getByText("Golden Arrow")).toBeInTheDocument();
    expect(screen.getByText("Elapsed: 62.345s")).toBeInTheDocument();
  });
});
