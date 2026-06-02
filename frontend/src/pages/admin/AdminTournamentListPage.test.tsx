import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAdminTournaments } from "../../api/adminTournamentApi";
import { AdminTournamentListPage } from "./AdminTournamentListPage";

vi.mock("../../api/adminTournamentApi", () => ({
  createTournament: vi.fn(),
  getAdminTournaments: vi.fn(),
}));

describe("AdminTournamentListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminTournaments).mockResolvedValue([
      {
        id: 7,
        name: "Spring Cup 2026",
        code: "SPRING_2026",
        location: "Belmont Park",
        startDate: "2026-06-01",
        endDate: "2026-08-20",
        registrationStartAt: "2026-05-01T09:00",
        registrationEndAt: "2026-05-25T18:00",
        maxHorses: 24,
        status: "OPEN_REGISTRATION",
      },
    ]);
  });

  it("renders championships as operation cards with phase progress", async () => {
    render(
      <MemoryRouter>
        <AdminTournamentListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /championships/i })).toBeInTheDocument();
    expect(screen.getByText("Spring Cup 2026")).toBeInTheDocument();
    expect(screen.getByText(/current phase/i)).toBeInTheDocument();
    expect(screen.getByText(/next action/i)).toBeInTheDocument();
    expect(screen.getByText(/close registration/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Registration$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Pool Formation$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Assignment$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Racing$/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /continue spring cup 2026/i })).toHaveAttribute(
      "href",
      "/admin/tournaments/7",
    );
    expect(screen.queryByRole("columnheader", { name: /tournament name/i })).not.toBeInTheDocument();
  });
});
