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
    equipmentDecision: "PASSED" as const,
    healthDecision: "PASSED" as const,
    status: "PASSED" as const,
  },
];

describe("PreRaceChecklist", () => {
  it("starts unchecked verification actions in a neutral state", () => {
    render(
      <PreRaceChecklist
        onChange={vi.fn()}
        participants={[
          {
            ...entries[0],
            equipmentOk: false,
            healthOk: false,
            equipmentDecision: "PENDING" as const,
            healthDecision: "PENDING" as const,
            status: "CHECK_HEALTH" as const,
          },
        ]}
      />
    );

    expect(screen.getByRole("button", { name: "Pass equipment check for Thunderstrike" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Fail equipment check for Thunderstrike" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Pass health check for Thunderstrike" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Fail health check for Thunderstrike" })).toHaveAttribute("aria-pressed", "false");
  });

  it("marks a horse scratched when the referee fails health verification", () => {
    const onChange = vi.fn();

    render(<PreRaceChecklist onChange={onChange} participants={entries} />);
    fireEvent.click(screen.getByRole("button", { name: "Fail health check for Thunderstrike" }));

    expect(onChange).toHaveBeenCalledWith([
      {
        ...entries[0],
        healthOk: false,
        healthDecision: "SCRATCHED",
        status: "SCRATCHED",
        scratchedReason: "",
      },
    ]);
  });

  it("requires a typed audit reason after scratching a horse", () => {
    const onChange = vi.fn();

    render(
      <PreRaceChecklist
        onChange={onChange}
        participants={[
          {
            ...entries[0],
            healthOk: false,
            healthDecision: "SCRATCHED" as const,
            status: "SCRATCHED" as const,
            scratchedReason: "",
          },
        ]}
      />
    );

    fireEvent.change(screen.getByLabelText("Audit reason for Thunderstrike"), {
      target: { value: "Left foreleg swelling" },
    });

    expect(onChange).toHaveBeenCalledWith([
      {
        ...entries[0],
        healthOk: false,
        healthDecision: "SCRATCHED",
        status: "SCRATCHED",
        scratchedReason: "Left foreleg swelling",
      },
    ]);
  });

  it("disables confirmation while a scratched horse is missing an audit reason", () => {
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
            healthDecision: "SCRATCHED" as const,
            status: "SCRATCHED" as const,
            scratchedReason: "",
          },
        ]}
      />
    );

    expect(screen.getByRole("button", { name: "Confirm & Enter Live Control" })).toBeDisabled();
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
            healthDecision: "SCRATCHED" as const,
            status: "SCRATCHED" as const,
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
