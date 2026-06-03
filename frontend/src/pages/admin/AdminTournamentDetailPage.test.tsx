import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAdminRace, getAdminRaces, updateAdminRaceStatus } from "../../api/adminRaceApi";
import { getTournamentDetail, updateTournamentStatus } from "../../api/adminTournamentApi";
import {
  getAdminJockeyPoolApplications,
  getAdminTournamentRegistrations,
  lockAdminChampionshipParticipants,
} from "../../api/racingApi";
import { AdminTournamentDetailPage } from "./AdminTournamentDetailPage";

vi.mock("../../api/adminTournamentApi", () => ({
  deleteTournament: vi.fn(),
  getTournamentDetail: vi.fn(),
  updateTournament: vi.fn(),
  updateTournamentStatus: vi.fn(),
}));

vi.mock("../../api/adminRaceApi", () => ({
  createAdminRace: vi.fn(),
  getAdminRaces: vi.fn(),
  updateAdminRaceStatus: vi.fn(),
}));

vi.mock("../../api/racingApi", () => ({
  approveAdminJockeyPoolApplication: vi.fn(),
  approveAdminTournamentRegistration: vi.fn(),
  getAdminJockeyPoolApplications: vi.fn(),
  getAdminTournamentRegistrations: vi.fn(),
  lockAdminChampionshipParticipants: vi.fn(),
  rejectAdminJockeyPoolApplication: vi.fn(),
  rejectAdminTournamentRegistration: vi.fn(),
}));

describe("AdminTournamentDetailPage championship lifecycle UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTournamentDetail).mockResolvedValue({
      id: 7,
      name: "Summer Championship 2026",
      code: "SUMMER_2026",
      location: "Belmont Park",
      startDate: "2026-06-01",
      endDate: "2026-08-20",
      registrationStartAt: "2026-05-01T09:00",
      registrationEndAt: "2026-05-25T18:00",
      maxHorses: 20,
      status: "ONGOING",
    });
    vi.mocked(getAdminRaces).mockResolvedValue([
      {
        id: 41,
        tournamentId: 7,
        tournamentName: "Summer Championship 2026",
        name: "Round 1 - Belmont Stakes",
        code: "SUM_R1",
        raceDateTime: "2026-06-06T11:00:00",
        distanceMeters: 1600,
        maxParticipants: 12,
        status: "SCHEDULED",
        creatorName: "Admin User",
      },
      {
        id: 42,
        tournamentId: 7,
        tournamentName: "Summer Championship 2026",
        name: "Round 2 - Intercontinental",
        code: "SUM_R2",
        raceDateTime: "2026-06-13T11:00:00",
        distanceMeters: 1800,
        maxParticipants: 12,
        status: "RESULT_CONFIRMED",
        creatorName: "Admin User",
      },
    ]);
    vi.mocked(updateAdminRaceStatus).mockResolvedValue({
      id: 41,
      tournamentId: 7,
      tournamentName: "Summer Championship 2026",
      name: "Round 1 - Belmont Stakes",
      code: "SUM_R1",
      raceDateTime: "2026-06-06T11:00:00",
      distanceMeters: 1600,
      maxParticipants: 12,
      status: "CHECKING",
      creatorName: "Admin User",
    });
    vi.mocked(createAdminRace).mockResolvedValue({
      id: 43,
      tournamentId: 7,
      tournamentName: "Summer Championship 2026",
      name: "Round 3 - Saigon Sprint",
      code: "SUM_R3",
      raceDateTime: "2026-06-20T11:00:00",
      distanceMeters: 1400,
      maxParticipants: 12,
      status: "SCHEDULED",
      creatorName: "Admin User",
    });
    vi.mocked(getAdminTournamentRegistrations).mockResolvedValue([
      {
        id: 11,
        tournamentId: 7,
        tournamentName: "Summer Championship 2026",
        horseId: 8,
        horseName: "Storm Signal",
        ownerId: 5,
        ownerName: "Linh Tran",
        status: "PENDING",
        note: "Ready for review",
      },
      {
        id: 12,
        tournamentId: 99,
        tournamentName: "Other Championship",
        horseId: 9,
        horseName: "Wrong Context",
        status: "PENDING",
      },
    ]);
    vi.mocked(getAdminJockeyPoolApplications).mockResolvedValue([
      {
        id: 31,
        championshipId: 7,
        championshipName: "Summer Championship 2026",
        jockeyId: 14,
        jockeyName: "Nguyen Van A",
        jockeyEmail: "jockey@example.com",
        status: "PENDING",
        message: "Available for the full championship.",
      },
      {
        id: 32,
        championshipId: 7,
        championshipName: "Summer Championship 2026",
        jockeyId: 15,
        jockeyName: "Tran Minh K",
        jockeyEmail: "approved@example.com",
        status: "APPROVED_FOR_POOL",
      },
    ]);
    vi.mocked(updateTournamentStatus).mockResolvedValue(undefined);
    vi.mocked(lockAdminChampionshipParticipants).mockResolvedValue({
      championshipId: 7,
      createdParticipants: 1,
    });
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/admin/tournaments/7"]}>
        <Routes>
          <Route path="/admin/tournaments/:id" element={<AdminTournamentDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("answers current state and opens round control center from the command header", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: /summer championship 2026/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^overview$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^applications$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^participants$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^rounds$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^standings$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^controls$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^races$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^operations$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: /primary championship overview/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /championship secondary navigation/i })).toBeInTheDocument();

    expect(screen.getAllByText(/current phase/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^racing$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/current round/i).length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getAllByText(/round 1 of 2/i).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/next action/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/start operational checks/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: /continue operations/i })[0]);

    expect(await screen.findByRole("heading", { name: /round control center/i })).toBeInTheDocument();
    expect(getAdminRaces).toHaveBeenCalledWith({ tournamentId: 7 });
    expect(screen.getAllByText("Round 1 - Belmont Stakes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Round 2 - Intercontinental").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/result ready for publishing/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /start checks for round 1 - belmont stakes/i }));

    await waitFor(() => {
      expect(updateAdminRaceStatus).toHaveBeenCalledWith(41, "CHECKING");
    });
  });

  it("keeps race control inside rounds and keeps controls championship-level only", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: /summer championship 2026/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^rounds$/i }));
    expect(await screen.findByRole("heading", { name: /championship rounds/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /season timeline/i })).toBeInTheDocument();
    expect(screen.getByText(/registration closed/i)).toBeInTheDocument();
    expect(screen.getByText(/pool approved/i)).toBeInTheDocument();
    expect(screen.getByText(/participants locked/i)).toBeInTheDocument();
    expect(getAdminRaces).toHaveBeenCalledWith({ tournamentId: 7 });
    expect(screen.getByText("Round 1 - Belmont Stakes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /open control center for round 1 - belmont stakes/i }));
    expect(await screen.findByRole("heading", { name: /round control center/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^controls$/i }));
    expect(screen.getByRole("heading", { name: /championship controls/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /race operations/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start checks for round 1 - belmont stakes/i })).not.toBeInTheDocument();
  });

  it("routes continue operations to applications during registration phase", async () => {
    vi.mocked(getTournamentDetail).mockResolvedValueOnce({
      id: 7,
      name: "Summer Championship 2026",
      code: "SUMMER_2026",
      location: "Belmont Park",
      startDate: "2026-06-01",
      endDate: "2026-08-20",
      registrationStartAt: "2026-05-01T09:00",
      registrationEndAt: "2026-05-25T18:00",
      maxHorses: 20,
      status: "OPEN_REGISTRATION",
    });

    renderPage();

    expect(await screen.findByRole("heading", { name: /summer championship 2026/i })).toBeInTheDocument();
    expect(screen.getAllByText(/review applications/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: /continue operations/i })[0]);

    expect(await screen.findByRole("heading", { name: /championship applications/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /horse registrations/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /jockey pool/i })).toBeInTheDocument();
    expect(screen.getByText("Storm Signal")).toBeInTheDocument();
    expect(screen.queryByText("Wrong Context")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /jockey pool/i }));

    expect(await screen.findByText("Nguyen Van A")).toBeInTheDocument();
    expect(screen.getByText(/available for the full championship/i)).toBeInTheDocument();
    expect(screen.getByText("Tran Minh K")).toBeInTheDocument();
  });

  it("creates a championship round from the rounds tab", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: /summer championship 2026/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^rounds$/i }));
    expect(await screen.findByRole("heading", { name: /championship rounds/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^create round$/i }));

    expect(screen.getByRole("dialog", { name: /create championship round/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/round name/i), {
      target: { value: "Round 3 - Saigon Sprint" },
    });
    fireEvent.change(screen.getByLabelText(/round code/i), {
      target: { value: "SUM_R3" },
    });
    fireEvent.change(screen.getByLabelText(/race date and time/i), {
      target: { value: "2026-06-20T11:00" },
    });
    fireEvent.change(screen.getByLabelText(/distance/i), {
      target: { value: "1400" },
    });
    fireEvent.change(screen.getByLabelText(/max participants/i), {
      target: { value: "12" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

    await waitFor(() => {
      expect(createAdminRace).toHaveBeenCalledWith({
        tournamentId: 7,
        name: "Round 3 - Saigon Sprint",
        code: "SUM_R3",
        raceDateTime: "2026-06-20T11:00",
        distanceMeters: 1400,
        maxParticipants: 12,
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /create championship round/i })).not.toBeInTheDocument();
    });
    expect(getAdminRaces).toHaveBeenCalledWith({ tournamentId: 7 });
  });
});
