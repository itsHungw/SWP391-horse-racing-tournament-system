import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import * as refereeApi from "../../api/refereeApi";
import { RefereeOverviewPage } from "./RefereeOverviewPage";

vi.mock("../../api/refereeApi");

const mockRaces = [
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

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}{location.search}</p>;
}

describe("RefereeOverviewPage", () => {
  it("renders the day timeline without the month calendar toggle", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

    render(
      <MemoryRouter>
        <RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Preparing steward assignments/i)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Today's Race Timeline" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Month calendar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "June 2026 Calendar" })).not.toBeInTheDocument();
  });

  it("opens the selected race drawer and bypasses only the time guard in demo mode", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

    render(
      <MemoryRouter>
        <RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: /Royal Ascot Gold Cup/i }));

    expect(screen.getByRole("heading", { name: "Race Details" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Pre-Race Check" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );

    fireEvent.click(screen.getByRole("switch", { name: "Demo mode" }));

    expect(screen.getByText("Demo Mode Active - Time Guard Bypassed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Pre-Race Check" })).not.toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  it("opens the matching race drawer from the raceId query param", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

    render(
      <MemoryRouter initialEntries={["/referee/assigned-races?raceId=1"]}>
        <RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Race Details" })).toBeInTheDocument();
    expect(within(screen.getByRole("complementary", { name: "Race details" })).getByText("Royal Ascot Gold Cup - Qualifiers A")).toBeInTheDocument();
  });

  it("clears raceId from the URL when the selected drawer is closed", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

    render(
      <MemoryRouter initialEntries={["/referee/assigned-races?raceId=1"]}>
        <RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} />
        <LocationProbe />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: "Close race details" }));

    expect(screen.queryByRole("heading", { name: "Race Details" })).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/referee/assigned-races");
  });

  it("shows a retry action when assigned races fail to load", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockRejectedValue(new Error("offline"));

    render(
      <MemoryRouter>
        <RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} />
      </MemoryRouter>
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load assigned races.");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
