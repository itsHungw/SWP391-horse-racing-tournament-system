import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import * as api from "../../api/adminPredictionApi";
import { AdminRacePredictionDetailPage } from "./AdminRacePredictionDetailPage";

vi.mock("../../api/adminPredictionApi", () => ({
  getAdminPredictionRaceDetail: vi.fn(),
  getAdminRacePredictions: vi.fn(),
  retrySettlementJob: vi.fn(),
}));

describe("AdminRacePredictionDetailPage", () => {
  it("shows an API failure state instead of local mock race audit data", async () => {
    vi.mocked(api.getAdminPredictionRaceDetail).mockRejectedValue(new Error("API unavailable"));
    vi.mocked(api.getAdminRacePredictions).mockRejectedValue(new Error("API unavailable"));

    render(
      <MemoryRouter initialEntries={["/admin/predictions/races/101"]}>
        <Routes>
          <Route path="/admin/predictions/races/:raceId" element={<AdminRacePredictionDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/unable to load prediction race details/i)).toBeInTheDocument();
    });

    expect(screen.queryByText("Spring Championship Qualifier")).not.toBeInTheDocument();
    expect(screen.queryByText("Nguyen Van A")).not.toBeInTheDocument();
  });
});

