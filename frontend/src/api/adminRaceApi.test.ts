import { afterEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "./httpClient";
import { createAdminRace } from "./adminRaceApi";

vi.mock("./httpClient", () => ({
  httpClient: {
    post: vi.fn(),
  },
}));

describe("adminRaceApi", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates an admin race round with the backend race payload", async () => {
    const payload = {
      tournamentId: 7,
      name: "Round 3 - Saigon Sprint",
      code: "SUM_R3",
      raceDateTime: "2026-06-20T11:00",
      distanceMeters: 1400,
      maxParticipants: 12,
    };
    vi.mocked(httpClient.post).mockResolvedValueOnce({
      data: { id: 43, ...payload, status: "SCHEDULED" },
    });

    await expect(createAdminRace(payload)).resolves.toMatchObject({
      id: 43,
      name: "Round 3 - Saigon Sprint",
    });
    expect(httpClient.post).toHaveBeenCalledWith("/admin/races", payload);
  });
});
