import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createOwnerHorse, getOwnerHorses, getOwnerTournamentRegistrations } from "../../api/racingApi";
import { OwnerHorsesPage } from "./OwnerHorsesPage";

vi.mock("../../api/racingApi", () => ({
  createOwnerHorse: vi.fn(),
  getOwnerHorses: vi.fn(),
  getOwnerTournamentRegistrations: vi.fn(),
}));

describe("OwnerHorsesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOwnerHorses).mockResolvedValue([
      {
        id: 1,
        name: "Nova",
        breed: "Thoroughbred",
        color: "Bay",
        registrationCode: "NOVA-1",
        gender: "FEMALE",
        imageUrl: "/uploads/horses/images/nova.jpg",
        evidenceUrl: "/uploads/horses/evidence/nova.pdf",
        status: "PENDING",
      },
      {
        id: 2,
        name: "Storm",
        breed: "Arabian",
        color: "Black",
        gender: "MALE",
        status: "APPROVED",
      },
    ]);
    vi.mocked(getOwnerTournamentRegistrations).mockResolvedValue([
      {
        id: 9,
        tournamentId: 4,
        tournamentName: "Spring Cup",
        horseId: 2,
        horseName: "Storm",
        status: "APPROVED",
      },
    ]);
    vi.mocked(createOwnerHorse).mockResolvedValue({
      id: 3,
      name: "Comet",
      gender: "MALE",
      imageUrl: "/uploads/horses/images/comet.jpg",
      evidenceUrl: "/uploads/horses/evidence/comet.pdf",
      status: "PENDING",
    });
  });

  it("renders a searchable horse roster with profile links", async () => {
    render(
      <MemoryRouter>
        <OwnerHorsesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /horse roster/i })).toBeInTheDocument();
    expect(screen.getByText(/manage your stable of 2 horses/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /view profile/i })[0]).toHaveAttribute("href", "/owner/horses/1");

    fireEvent.change(screen.getByLabelText(/search horses/i), { target: { value: "storm" } });
    expect(screen.queryByText("Nova")).not.toBeInTheDocument();
    expect(screen.getByText("Storm")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/filter by status/i), { target: { value: "PENDING" } });
    expect(screen.getByText(/no horses match this roster view/i)).toBeInTheDocument();
  });

  it("creates a horse from the add horse panel using local files", async () => {
    render(
      <MemoryRouter>
        <OwnerHorsesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /horse roster/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add horse/i }));

    const panel = screen.getByRole("dialog", { name: /add horse/i });
    expect(within(panel).queryByLabelText(/registration code/i)).not.toBeInTheDocument();
    fireEvent.change(within(panel).getByLabelText(/horse name/i), { target: { value: "Comet" } });
    fireEvent.change(within(panel).getByLabelText(/gender/i), { target: { value: "MALE" } });
    fireEvent.change(within(panel).getByLabelText(/horse image/i), {
      target: { files: [new File(["image"], "comet.png", { type: "image/png" })] },
    });
    fireEvent.change(within(panel).getByLabelText(/evidence document/i), {
      target: { files: [new File(["evidence"], "comet.pdf", { type: "application/pdf" })] },
    });
    fireEvent.submit(within(panel).getByRole("button", { name: /submit for review/i }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(createOwnerHorse).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Comet",
          gender: "MALE",
          imageFile: expect.any(File),
          evidenceFile: expect.any(File),
        }),
      );
    });
  });
});
