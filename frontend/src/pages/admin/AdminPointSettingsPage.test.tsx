import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPointSettings, updatePointSettings } from "../../api/pointSettingsApi";
import type { PointSettings } from "../../types/pointSettings";
import { AdminPointSettingsPage } from "./AdminPointSettingsPage";

vi.mock("../../api/pointSettingsApi", () => ({
  getPointSettings: vi.fn(),
  updatePointSettings: vi.fn(),
}));

const defaultSettings: PointSettings = {
  FIRST_LOGIN_BONUS: 0,
  BLOG_REWARD_POINTS: 10,
  DAILY_BLOG_REWARD_LIMIT: 3,
  PREDICTION_ENTRY_COST: 5,
  PREDICTION_CORRECT_REWARD: 25,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminPointSettingsPage />
    </MemoryRouter>,
  );
}

describe("AdminPointSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPointSettings).mockResolvedValue(defaultSettings);
    vi.mocked(updatePointSettings).mockResolvedValue(defaultSettings);
  });

  it("loads and renders all point settings", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: /point settings/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first login bonus/i)).toHaveValue(0);
    expect(screen.getByLabelText(/blog reward points/i)).toHaveValue(10);
    expect(screen.getByLabelText(/daily blog reward limit/i)).toHaveValue(3);
    expect(screen.getByLabelText(/prediction entry cost/i)).toHaveValue(5);
    expect(screen.getByLabelText(/prediction correct reward/i)).toHaveValue(25);
  });

  it("saves edited point settings", async () => {
    renderPage();

    const blogRewardInput = await screen.findByLabelText(/blog reward points/i);
    fireEvent.change(blogRewardInput, { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(updatePointSettings).toHaveBeenCalledWith({
        ...defaultSettings,
        BLOG_REWARD_POINTS: 12,
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent(/saved/i);
  });

  it("blocks negative values before saving", async () => {
    renderPage();

    const entryCostInput = await screen.findByLabelText(/prediction entry cost/i);
    fireEvent.change(entryCostInput, { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: /save settings/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/greater than or equal to 0/i);
    expect(updatePointSettings).not.toHaveBeenCalled();
  });

  it("shows an error alert when settings cannot load", async () => {
    vi.mocked(getPointSettings).mockRejectedValue(new Error("Request failed"));

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not load/i);
  });
});
