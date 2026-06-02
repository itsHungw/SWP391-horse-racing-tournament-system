import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PreRaceChecklist } from "./PreRaceChecklist";
import { ReadyLineupPanel } from "./ReadyLineupPanel";

const entries = [
  {
    participantId: 5,
    horseName: "Thunderstrike",
    jockeyName: "Julian Sterling",
    equipmentOk: true,
    healthOk: true,
    status: "PASSED" as const,
  },
];

describe("PreRaceChecklist", () => {
  it("marks a horse scratched when the referee fails health verification", () => {
    const onChange = vi.fn();

    render(<PreRaceChecklist onChange={onChange} participants={entries} />);
    fireEvent.click(screen.getByRole("button", { name: "Fail health check for Thunderstrike" }));

    expect(onChange).toHaveBeenCalledWith([
      {
        ...entries[0],
        healthOk: false,
        status: "SCRATCHED",
        scratchedReason: "Failed health check",
      },
    ]);
  });

  it("shows only passed horses in the ready lineup", () => {
    render(
      <ReadyLineupPanel
        onEnterLive={vi.fn()}
        participants={[
          ...entries,
          {
            ...entries[0],
            participantId: 7,
            horseName: "Night Bloom",
            healthOk: false,
            status: "SCRATCHED",
            scratchedReason: "Failed health check",
          },
        ]}
      />
    );

    expect(screen.getByText("Thunderstrike")).toBeInTheDocument();
    expect(screen.queryByText("Night Bloom")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm & Enter Live Control" })).toBeEnabled();
  });
});
