import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getJockeyChampionships,
  getJockeyContracts,
  getJockeyParticipants,
  getJockeyPoolApplications,
} from "../../api/racingApi";
import { JockeyDashboardPage } from "./JockeyDashboardPage";

vi.mock("../../api/racingApi", () => ({
  getJockeyChampionships: vi.fn(),
  getJockeyContracts: vi.fn(),
  getJockeyParticipants: vi.fn(),
  getJockeyPoolApplications: vi.fn(),
}));

const acceptedContract = {
  id: 10,
  championshipId: 7,
  championshipName: "Spring Cup 2026",
  horseRegistrationId: 15,
  horseId: 3,
  horseName: "Thunder Bolt",
  ownerId: 2,
  ownerName: "Sunrise Stable",
  jockeyId: 4,
  jockeyName: "Nguyen Van A",
  jockeyApplicationId: 8,
  status: "ACCEPTED" as const,
  acceptedAt: "2026-06-04T08:00:00Z",
};

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
  jockeyInvitationId: 10,
  status: "ACTIVE",
  points: 0,
};

describe("JockeyDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getJockeyChampionships).mockResolvedValue([]);
    vi.mocked(getJockeyPoolApplications).mockResolvedValue([]);
    vi.mocked(getJockeyContracts).mockResolvedValue([]);
    vi.mocked(getJockeyParticipants).mockResolvedValue([]);
  });

  it("shows accepted contracts as committed assignments waiting for admin lock", async () => {
    vi.mocked(getJockeyContracts).mockResolvedValue([acceptedContract]);

    render(
      <MemoryRouter>
        <JockeyDashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /spring cup 2026/i })).toBeInTheDocument();
    expect(screen.getByText(/committed assignment/i)).toBeInTheDocument();
    expect(screen.getByText(/pending admin lock/i)).toBeInTheDocument();
    expect(screen.getAllByText(/thunder bolt with sunrise stable/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/admin still needs to lock participants/i)).toBeInTheDocument();

    expect(screen.queryByText(/current standing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rank #3/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/42 pts/i)).not.toBeInTheDocument();
  });

  it("shows official participant only after admin lock creates the pair", async () => {
    vi.mocked(getJockeyContracts).mockResolvedValue([acceptedContract]);
    vi.mocked(getJockeyParticipants).mockResolvedValue([officialParticipant]);

    render(
      <MemoryRouter>
        <JockeyDashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/official championship assignment/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /spring cup 2026/i })).toBeInTheDocument();
    expect(screen.getAllByText(/thunder bolt with sunrise stable/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/current points: 0/i)).toBeInTheDocument();

    const summary = screen.getByLabelText(/jockey dashboard summary/i);
    expect(within(summary).getByText(/official assignments/i)).toBeInTheDocument();
    expect(within(summary).getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.queryByText(/leader:/i)).not.toBeInTheDocument();
  });
});
