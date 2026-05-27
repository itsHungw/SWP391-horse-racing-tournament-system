import { afterEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "./httpClient";
import { createOwnerHorse, createOwnerTournamentRegistration, getOwnerHorses } from "./racingApi";

vi.mock("./httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("racingApi", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads owner horses from the owner endpoint", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: [{ id: 1, name: "Nova", status: "PENDING" }] });

    await expect(getOwnerHorses()).resolves.toEqual([{ id: 1, name: "Nova", status: "PENDING" }]);
    expect(httpClient.get).toHaveBeenCalledWith("/owner/horses");
  });

  it("creates owner horses without ownerId", async () => {
    vi.mocked(httpClient.post).mockResolvedValueOnce({ data: { id: 1, name: "Nova", status: "PENDING" } });

    await createOwnerHorse({
      name: "Nova",
      gender: "FEMALE",
      imageUrl: "https://cdn.example.com/nova.jpg",
      evidenceUrl: "https://cdn.example.com/nova.pdf",
    });

    expect(httpClient.post).toHaveBeenCalledWith("/owner/horses", {
      name: "Nova",
      gender: "FEMALE",
      imageUrl: "https://cdn.example.com/nova.jpg",
      evidenceUrl: "https://cdn.example.com/nova.pdf",
    });
  });

  it("submits owner tournament registrations", async () => {
    vi.mocked(httpClient.post).mockResolvedValueOnce({ data: { id: 10, status: "PENDING" } });

    await createOwnerTournamentRegistration({ tournamentId: 2, horseId: 1, note: "Ready" });

    expect(httpClient.post).toHaveBeenCalledWith("/owner/tournament-registrations", {
      tournamentId: 2,
      horseId: 1,
      note: "Ready",
    });
  });
});
