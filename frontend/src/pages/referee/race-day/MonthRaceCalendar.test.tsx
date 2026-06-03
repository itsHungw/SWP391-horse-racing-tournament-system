import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MonthRaceCalendar } from "./MonthRaceCalendar";
import { AssignedRace } from "./refereeRaceDayModels";

const races: AssignedRace[] = [
  {
    id: 1,
    name: "Royal Ascot Gold Cup - Qualifiers A",
    code: "R-2026-001",
    distanceMeters: 1600,
    status: "SCHEDULED",
    scheduledAt: "2026-06-02T14:00:00+07:00",
    venue: "Turf Tower C",
  },
];

describe("MonthRaceCalendar", () => {
  it("renders selectable race chips as accessible buttons", () => {
    const onRaceSelect = vi.fn();

    render(
      <MonthRaceCalendar
        races={races}
        referenceDate={new Date("2026-06-02T12:30:00+07:00")}
        onRaceSelect={onRaceSelect}
      />
    );

    const chip = screen.getByRole("button", {
      name: "Open R-2026-001 Royal Ascot Gold Cup - Qualifiers A",
    });

    expect(chip).toHaveClass("min-h-11");
    fireEvent.click(chip);
    expect(onRaceSelect).toHaveBeenCalledWith(races[0]);
  });

  it("keeps race chips as static text when no selection handler is provided", () => {
    render(
      <MonthRaceCalendar
        races={races}
        referenceDate={new Date("2026-06-02T12:30:00+07:00")}
      />
    );

    expect(screen.getByText("R-2026-001")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open R-2026-001/i })).not.toBeInTheDocument();
  });
});
