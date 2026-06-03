import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyToJockeyChampionship,
  getJockeyChampionships,
  getJockeyPoolApplications,
} from "../../api/racingApi";
import { JockeyChampionshipsPage } from "./JockeyChampionshipsPage";

vi.mock("../../api/racingApi", () => ({
  applyToJockeyChampionship: vi.fn(),
  getJockeyChampionships: vi.fn(),
  getJockeyPoolApplications: vi.fn(),
}));

const openChampionship = {
  id: 7,
  name: "Spring Cup 2026",
  code: "SPRING-2026",
  location: "Belmont Park",
  startDate: "2026-06-01",
  endDate: "2026-08-20",
  registrationEndAt: "2026-06-15",
  maxHorses: 20,
  status: "OPEN_REGISTRATION",
  applicationStatus: "NOT_APPLIED" as const,
  approvedPoolCount: 12,
  applicationWindowOpen: true,
  canApply: true,
};

describe("JockeyChampionshipsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getJockeyChampionships).mockResolvedValue([openChampionship]);
    vi.mocked(getJockeyPoolApplications).mockResolvedValue([]);
  });

  it("shows a truth-first empty current state instead of fake standings", async () => {
    render(
      <MemoryRouter>
        <JockeyChampionshipsPage />
      </MemoryRouter>,
    );

    const current = await screen.findByRole("region", { name: /current championship state/i });
    expect(within(current).getByRole("heading", { name: /no active championship/i })).toBeInTheDocument();
    expect(within(current).getByText(/apply to an open championship pool/i)).toBeInTheDocument();
    expect(screen.queryByText(/thunder bolt/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rank #3/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/42 pts/i)).not.toBeInTheDocument();

    fireEvent.click(within(current).getByRole("button", { name: /browse championships/i }));

    const open = screen.getByRole("region", { name: /open championships/i });
    expect(within(open).getByRole("heading", { name: /spring cup 2026/i })).toBeInTheDocument();
  });

  it("submits a championship pool application through the API", async () => {
    vi.mocked(applyToJockeyChampionship).mockResolvedValue({
      id: 31,
      championshipId: 7,
      championshipName: "Spring Cup 2026",
      jockeyId: 4,
      jockeyName: "Jockey",
      status: "PENDING",
    });
    vi.mocked(getJockeyChampionships)
      .mockResolvedValueOnce([openChampionship])
      .mockResolvedValueOnce([
        {
          ...openChampionship,
          applicationStatus: "PENDING",
          applicationId: 31,
          applicationCreatedAt: "2026-06-03T10:00:00Z",
          canApply: false,
        },
      ]);
    vi.mocked(getJockeyPoolApplications)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 31,
          championshipId: 7,
          championshipName: "Spring Cup 2026",
          jockeyId: 4,
          jockeyName: "Jockey",
          status: "PENDING",
        },
      ]);

    render(
      <MemoryRouter>
        <JockeyChampionshipsPage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /browse championships/i }));
    const open = screen.getByRole("region", { name: /open championships/i });
    fireEvent.click(within(open).getByRole("button", { name: /apply for championship spring cup 2026/i }));

    const dialog = screen.getByRole("dialog", { name: /championship application/i });
    fireEvent.change(within(dialog).getByLabelText(/application note/i), {
      target: { value: "Available for all championship rounds." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /submit application/i }));

    expect(applyToJockeyChampionship).toHaveBeenCalledWith(7, "Available for all championship rounds.");
    expect(await screen.findByRole("heading", { name: /application under review/i })).toBeInTheDocument();
    expect(screen.getAllByText(/pending review/i).length).toBeGreaterThan(0);
  });

  it("uses approved-for-pool as the current hero state when available", async () => {
    vi.mocked(getJockeyChampionships).mockResolvedValue([
      {
        ...openChampionship,
        applicationStatus: "APPROVED_FOR_POOL",
        applicationId: 31,
        approvedPoolCount: 13,
        canApply: false,
      },
    ]);
    vi.mocked(getJockeyPoolApplications).mockResolvedValue([
      {
        id: 31,
        championshipId: 7,
        championshipName: "Spring Cup 2026",
        jockeyId: 4,
        jockeyName: "Jockey",
        status: "APPROVED_FOR_POOL",
      },
    ]);

    render(
      <MemoryRouter>
        <JockeyChampionshipsPage />
      </MemoryRouter>,
    );

    const current = await screen.findByRole("region", { name: /current championship state/i });
    expect(within(current).getByRole("heading", { name: /approved for pool/i })).toBeInTheDocument();
    expect(within(current).getAllByText(/visible to owners/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/current rank/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/42 pts/i)).not.toBeInTheDocument();
  });

  it("keeps history future-ready until official standings exist", async () => {
    render(
      <MemoryRouter>
        <JockeyChampionshipsPage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("tab", { name: /history/i }));

    const history = screen.getByRole("region", { name: /championship history/i });
    expect(within(history).getByRole("heading", { name: /no official championship history yet/i })).toBeInTheDocument();
    expect(within(history).getAllByText(/waiting for official standings api/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/career record/i)).not.toBeInTheDocument();
  });
});
