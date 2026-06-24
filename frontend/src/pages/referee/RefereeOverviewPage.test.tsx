import { fireEvent, render, screen } from "@testing-library/react";
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
  it("renders the assigned race queue with calendar as a secondary view", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

    render(
      <MemoryRouter>
        <RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Preparing steward assignments/i)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Assigned race queue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Work Queue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "June 2026 Calendar" })).not.toBeInTheDocument();
  });

  it("expands a card inline when its header is clicked, showing details like venue and next action", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

    render(
      <MemoryRouter>
        <RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: /Royal Ascot Gold Cup/i }));

    expect(screen.getByText("Turf Tower C")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start checks" })).toHaveAttribute(
      "href",
      "/referee/races/1/officiate"
    );
  });

  it("expands the matching card by default when the raceId query param is present", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

    render(
      <MemoryRouter initialEntries={["/referee/assigned-races?raceId=1"]}>
        <RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} />
      </MemoryRouter>
    );

    expect(await screen.findByText("Turf Tower C")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start checks" })).toHaveAttribute(
      "href",
      "/referee/races/1/officiate"
    );
  });

  it("collapses an already expanded card and clears raceId from the URL when clicked", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

    render(
      <MemoryRouter initialEntries={["/referee/assigned-races?raceId=1"]}>
        <RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} />
        <LocationProbe />
      </MemoryRouter>
    );

    expect(await screen.findByText("Turf Tower C")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Royal Ascot Gold Cup/i }));

    expect(screen.queryByText("Turf Tower C")).not.toBeInTheDocument();
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
