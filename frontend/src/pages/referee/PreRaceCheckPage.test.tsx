import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import { PreRaceCheckPage } from "./PreRaceCheckPage";
import * as refereeApi from "../../api/refereeApi";

vi.mock("../../api/refereeApi");

const mockParticipants = [
  {
    participantId: 1,
    horseName: "Thunderstrike",
    jockeyName: "Julian Sterling",
    jockeyWeight: 54.5,
    gearOk: true,
    healthOk: true,
    status: "PASSED" as const,
  },
];

describe("PreRaceCheckPage", () => {
  it("renders verification inputs, checkboxes and handles save checks", async () => {
    vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue(mockParticipants);
    const saveSpy = vi.spyOn(refereeApi, "savePreRaceChecks").mockResolvedValue();

    render(
      <MemoryRouter initialEntries={["/referee/races/1/check"]}>
        <Routes>
          <Route path="/referee/races/:id/check" element={<PreRaceCheckPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Pre-Race Check-in Verification")).toBeInTheDocument();
    expect(screen.getByText(/Thunderstrike/i)).toBeInTheDocument();
    expect(screen.getByText("Julian Sterling")).toBeInTheDocument();

    const saveButton = screen.getByRole("button", { name: /save pre-checks/i });
    fireEvent.click(saveButton);

    expect(saveSpy).toHaveBeenCalledWith(1, mockParticipants);
  });
});
