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

    expect(screen.getByRole("button", { name: "START / RESUME" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "STOP RACE" })).toBeInTheDocument();
  });

  it("resumes the safety car state that was active before a red flag", () => {
    const onFlag = vi.fn();
    render(
      <LiveRaceWorkspace
        onFinish={vi.fn()}
        onFlag={onFlag}
        onPenalty={vi.fn()}
        state={{ ...state, mode: "RED_FLAGGED", resumeMode: "SAFETY_CAR" }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "START / RESUME" }));

    expect(onFlag).toHaveBeenCalledWith("SAFETY_CAR");
  });

  it("does not expose post-race proceed before every active runner finishes", () => {
    render(
      <LiveRaceWorkspace
        onFinish={vi.fn()}
        onFlag={vi.fn()}
        onPenalty={vi.fn()}
        state={{ ...state, runners: state.runners.map((runner) => ({ ...runner, progressPercent: 80 })) }}
      />
    );

    expect(screen.queryByRole("button", { name: "CHEQUERED FLAG" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "PROCEED TO POST-RACE" })).not.toBeInTheDocument();
  });

  it("uses horse-racing labels for live control buttons", () => {
    render(<LiveRaceWorkspace onFinish={vi.fn()} onFlag={vi.fn()} onPenalty={vi.fn()} state={state} />);

    expect(screen.getByRole("button", { name: "START / RESUME" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "TRACK HAZARD" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "STOP RACE" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "CHEQUERED FLAG" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Green Flag" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yellow Flag / Safety Car" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Red Flag" })).not.toBeInTheDocument();
  });

  it("shows a large proceed action once the simulator freezes the finished draft", () => {
    const onFinish = vi.fn();
    render(
      <LiveRaceWorkspace
        onFinish={onFinish}
        onFlag={vi.fn()}
        onPenalty={vi.fn()}
        state={{
          ...state,
          mode: "FINISHED_DRAFT",
          runners: state.runners.map((runner, index) => ({
            ...runner,
            progressPercent: 100,
            finishMilliseconds: index === 0 ? 64_235 : 66_120,
          })),
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "PROCEED TO POST-RACE" }));

    expect(onFinish).toHaveBeenCalledOnce();
  });

  it("shows locked finish time for completed runners while active runners keep the stopwatch", () => {
    render(
      <LiveRaceWorkspace
        onFinish={vi.fn()}
        onFlag={vi.fn()}
        onPenalty={vi.fn()}
        state={{
          ...state,
          elapsedMilliseconds: 66_000,
          runners: [
            { ...state.runners[0], progressPercent: 100, finishMilliseconds: 64_235 },
            { ...state.runners[1], progressPercent: 94 },
          ],
        }}
      />
    );

    expect(screen.getByText("64.235s")).toBeInTheDocument();
    expect(screen.getByText("66.000s")).toBeInTheDocument();
    expect(screen.getByText("FINISHED")).toBeInTheDocument();
    expect(screen.getByText("RUNNING")).toBeInTheDocument();
  });
});
