import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LiveRaceState } from "./refereeRaceDayModels";
import { LiveRaceWorkspace } from "./LiveRaceWorkspace";

const state: LiveRaceState = {
  mode: "RACING",
  elapsedMilliseconds: 62_345,
  runners: [
    {
      participantId: 7,
      horseName: "Golden Arrow",
      gateNumber: 1,
      progressPercent: 92,
      speedMultiplier: 1,
      status: "RUNNING",
    },
    {
      participantId: 5,
      horseName: "Thunderstrike",
      gateNumber: 2,
      progressPercent: 80,
      speedMultiplier: 0.98,
      status: "RUNNING",
    },
  ],
  outOfRace: [],
  incidents: [],
};

describe("LiveRaceWorkspace", () => {
  it("reveals runner-specific penalty actions after selecting a live row", () => {
    render(<LiveRaceWorkspace onFinish={vi.fn()} onFlag={vi.fn()} onPenalty={vi.fn()} state={state} />);

    fireEvent.click(screen.getByRole("button", { name: /P2 Thunderstrike/i }));

    expect(screen.getByRole("button", { name: "Warn Thunderstrike" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add five-second penalty to Thunderstrike" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disqualify Thunderstrike" })).toBeInTheDocument();
  });

  it("shows resume and abort actions after a red flag", () => {
    render(
      <LiveRaceWorkspace
        onFinish={vi.fn()}
        onFlag={vi.fn()}
        onPenalty={vi.fn()}
        state={{ ...state, mode: "RED_FLAGGED" }}
      />
    );

    expect(screen.getByRole("button", { name: "Resume race" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abort race" })).toBeInTheDocument();
  });

  it("keeps the chequered flag locked until the leader reaches ninety percent", () => {
    render(
      <LiveRaceWorkspace
        onFinish={vi.fn()}
        onFlag={vi.fn()}
        onPenalty={vi.fn()}
        state={{ ...state, runners: state.runners.map((runner) => ({ ...runner, progressPercent: 80 })) }}
      />
    );

    expect(screen.getByRole("button", { name: "Chequered Flag" })).toBeDisabled();
  });
});
