import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getJockeyContracts, getJockeyParticipants, getJockeySchedule } from "../../api/racingApi";
import { JockeySchedulePage } from "./JockeySchedulePage";

vi.mock("../../api/racingApi", () => ({
  getJockeyContracts: vi.fn(),
  getJockeyParticipants: vi.fn(),
  getJockeySchedule: vi.fn(),
}));

const officialParticipant = {
  id: 21,
  championshipId: 7,
  championshipName: "Spring Cup 2026",
  horseRegistrationId: 15,
  horseId: 3,
  horseName: "Thunder Bolt",
  ownerId: 2,
  ownerName: "Sunrise Stable",
  jockeyId: 4,
  jockeyName: "Nguyen Van A",
  status: "ACTIVE",
  points: 0,
};

const scheduleItem = {
  raceParticipantId: 44,
  raceId: 9,
  raceName: "Round 1 - Opening Sprint",
  raceCode: "SPRING_R1",
  raceAt: "2026-06-16T11:00:00",
  distanceMeters: 1600,
  raceStatus: "SCHEDULED",
  championshipId: 7,
  championshipName: "Spring Cup 2026",
  championshipStatus: "SCHEDULE_PUBLISHED",
  horseId: 3,
  horseName: "Thunder Bolt",
  ownerId: 2,
  ownerName: "Sunrise Stable",
  confirmationStatus: "PENDING",
  checkStatus: "NOT_CHECKED",
  participantStatus: "REGISTERED",
};

describe("JockeySchedulePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getJockeyContracts).mockResolvedValue([]);
    vi.mocked(getJockeyParticipants).mockResolvedValue([]);
    vi.mocked(getJockeySchedule).mockResolvedValue([]);
  });

  it("shows waiting publication state after participant lock but before schedule publish", async () => {
    vi.mocked(getJockeyParticipants).mockResolvedValue([officialParticipant]);

    render(
      <MemoryRouter>
        <JockeySchedulePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /official assignment confirmed/i })).toBeInTheDocument();
    expect(screen.getByText(/waiting for admin to publish the official race schedule/i)).toBeInTheDocument();
    expect(screen.getAllByText(/participant lock/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/schedule publish/i)).toBeInTheDocument();
  });

  it("renders official schedule data in timeline, calendar, list, and detail drawer", async () => {
    vi.mocked(getJockeySchedule).mockResolvedValue([scheduleItem]);
    vi.mocked(getJockeyParticipants).mockResolvedValue([officialParticipant]);

    render(
      <MemoryRouter>
        <JockeySchedulePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /round 1 - opening sprint/i })).toBeInTheDocument();
    expect(screen.getByText(/spring cup 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/official rounds/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^calendar$/i }));
    const calendar = screen.getByLabelText(/month calendar/i);
    expect(within(calendar).getByText(/june 2026/i)).toBeInTheDocument();
    expect(within(calendar).getByText(/1 official race/i)).toBeInTheDocument();
    expect(within(calendar).getByLabelText(/calendar status legend/i)).toHaveTextContent(/scheduled/i);

    fireEvent.click(within(calendar).getByRole("button", { name: /round 1 - opening sprint scheduled/i }));
    const detail = screen.getByRole("dialog", { name: /race detail/i });
    expect(within(detail).getByText(/thunder bolt/i)).toBeInTheDocument();
    expect(within(detail).getByText(/owner: sunrise stable/i)).toBeInTheDocument();
    expect(within(detail).getByText(/1600 meters/i)).toBeInTheDocument();

    fireEvent.click(within(detail).getByRole("button", { name: /close race detail/i }));
    fireEvent.click(screen.getByRole("button", { name: /^list$/i }));
    expect(screen.getByRole("region", { name: /schedule list/i })).toHaveTextContent(/round 1 - opening sprint/i);
  });
});
