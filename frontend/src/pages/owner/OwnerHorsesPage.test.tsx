import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createOwnerHorse, getOwnerHorses } from "../../api/racingApi";
import { OwnerHorsesPage } from "./OwnerHorsesPage";

vi.mock("../../api/racingApi", () => ({
  createOwnerHorse: vi.fn(),
  getOwnerHorses: vi.fn(),
}));

describe("OwnerHorsesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOwnerHorses).mockResolvedValue([
      {
        id: 1,
        name: "Nova",
        gender: "FEMALE",
        imageUrl: "https://cdn.example.com/nova.jpg",
        evidenceUrl: "https://cdn.example.com/nova.pdf",
        status: "PENDING",
      },
    ]);
    vi.mocked(createOwnerHorse).mockResolvedValue({
      id: 2,
      name: "Storm",
      gender: "MALE",
      imageUrl: "https://cdn.example.com/storm.jpg",
      evidenceUrl: "https://cdn.example.com/storm.pdf",
      status: "PENDING",
    });
  });

  it("creates a horse with required evidence and refreshes the stable", async () => {
    render(
      <MemoryRouter>
        <OwnerHorsesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /my horses/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/horse name/i), { target: { value: "Storm" } });
    fireEvent.change(screen.getByLabelText(/gender/i), { target: { value: "MALE" } });
    fireEvent.change(screen.getByLabelText(/horse image url/i), {
      target: { value: "https://cdn.example.com/storm.jpg" },
    });
    fireEvent.change(screen.getByLabelText(/evidence url/i), {
      target: { value: "https://cdn.example.com/storm.pdf" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add horse/i }));

    await waitFor(() => {
      expect(createOwnerHorse).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Storm",
          gender: "MALE",
          imageUrl: "https://cdn.example.com/storm.jpg",
          evidenceUrl: "https://cdn.example.com/storm.pdf",
        }),
      );
    });
  });
});
