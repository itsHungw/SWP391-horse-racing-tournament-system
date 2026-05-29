import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import { RefereeOfficiatePage } from "./RefereeOfficiatePage";
import * as refereeApi from "../../api/refereeApi";

vi.mock("../../api/refereeApi");

describe("RefereeOfficiatePage", () => {
  it("renders the stepper and initial scheduled state", async () => {
    vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue([]);
    
    render(
      <MemoryRouter initialEntries={["/referee/races/1/officiate"]}>
        <Routes>
          <Route path="/referee/races/:id/officiate" element={<RefereeOfficiatePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Steward Officiating Console/i)).toBeInTheDocument();
    expect(screen.getAllByText(/PRE CHECKING/i).length).toBeGreaterThan(0);
  });
});
