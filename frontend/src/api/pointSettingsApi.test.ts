import { describe, expect, it, vi } from "vitest";

import { httpClient } from "./httpClient";
import { getPointSettings, updatePointSettings } from "./pointSettingsApi";
import type { PointSettings } from "../types/pointSettings";

vi.mock("./httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const settings: PointSettings = {
  FIRST_LOGIN_BONUS: 0,
  BLOG_REWARD_POINTS: 10,
  DAILY_BLOG_REWARD_LIMIT: 3,
  PREDICTION_ENTRY_COST: 5,
  PREDICTION_CORRECT_REWARD: 25,
};

describe("pointSettingsApi", () => {
  it("fetches admin point settings with the shared http client", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: settings });

    await expect(getPointSettings()).resolves.toEqual(settings);

    expect(httpClient.get).toHaveBeenCalledWith("/admin/point-settings");
  });

  it("updates admin point settings with the shared http client", async () => {
    vi.mocked(httpClient.put).mockResolvedValue({ data: settings });

    await expect(updatePointSettings(settings)).resolves.toEqual(settings);

    expect(httpClient.put).toHaveBeenCalledWith("/admin/point-settings", settings);
  });
});
