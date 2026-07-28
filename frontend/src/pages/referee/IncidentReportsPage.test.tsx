import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import { IncidentReportsPage } from "./IncidentReportsPage";
import * as refereeApi from "../../api/refereeApi";

vi.mock("../../api/refereeApi");

const mockParticipants = [
  {
    participantId: 2,
    horseName: "Golden Mane",
    jockeyName: "Michael Chang",
    jockeyWeight: 56,
    gearOk: true,
    healthOk: true,
    status: "PASSED" as const,
  },
];

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/referee/races/1/report"]}>
      <Routes>
        <Route path="/referee/races/:id/report" element={<IncidentReportsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("IncidentReportsPage", () => {
  it("logs a race incident against the selected participant", async () => {
    vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue(mockParticipants);
    const violationSpy = vi.spyOn(refereeApi, "submitViolation").mockResolvedValue();

    renderPage();

    expect(await screen.findByRole("heading", { name: "Race incident log" })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Describe what happened/i), {
      target: { value: "Loose rein on the back straight." },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /log race incident/i }));
    });

    expect(violationSpy).toHaveBeenCalledWith(1, {
      offenderId: 2,
      severity: "LOW",
      description: "Loose rein on the back straight.",
    });
  });

  it("no longer offers a second place to write the official report", async () => {
    vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue(mockParticipants);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Race incident log" })).toBeInTheDocument();
    // The report is written on the result package screen so it reaches the organizer
    // together with the finish order, instead of overwriting a report already submitted.
    expect(screen.queryByRole("button", { name: /save official report/i })).not.toBeInTheDocument();
  });
});
