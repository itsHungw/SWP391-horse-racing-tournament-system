import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import * as api from "../../api/adminPredictionApi";
import { AdminPredictionsWorkspace } from "./AdminPredictionsWorkspace";

vi.mock("../../api/adminPredictionApi", () => ({
  getAdminPredictionRaces: vi.fn(),
}));

describe("AdminPredictionsWorkspace", () => {
  it("shows an API failure state instead of local mock prediction races", async () => {
    vi.mocked(api.getAdminPredictionRaces).mockRejectedValue(new Error("API unavailable"));

    render(
      <MemoryRouter>
        <AdminPredictionsWorkspace />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/unable to load prediction races/i)).toBeInTheDocument();
    });

    expect(screen.queryByText("Spring Championship Qualifier")).not.toBeInTheDocument();
    expect(screen.queryByText("Classic Sprint Final")).not.toBeInTheDocument();
  });
});

