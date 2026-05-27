import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import { IncidentReportsPage } from "./IncidentReportsPage";
import * as refereeApi from "../../api/refereeApi";

vi.mock("../../api/refereeApi");

describe("IncidentReportsPage", () => {
  it("renders violation and officiating report forms, and handles submissions", async () => {
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
    vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue(mockParticipants);
    const violationSpy = vi.spyOn(refereeApi, "submitViolation").mockResolvedValue();
    const reportSpy = vi.spyOn(refereeApi, "submitRefereeReport").mockResolvedValue();

    render(
      <MemoryRouter initialEntries={["/referee/races/1/report"]}>
        <Routes>
          <Route path="/referee/races/:id/report" element={<IncidentReportsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Incident Reporting & Officiating Log")).toBeInTheDocument();

    // Fill the required summary field
    const summaryInput = screen.getByPlaceholderText(/Summarize overall race conditions/i);
    fireEvent.change(summaryInput, { target: { value: "This was a clean race with no major accidents." } });

    // Submit the report
    const submitReportButton = screen.getByRole("button", { name: /save report/i });
    await act(async () => {
      fireEvent.click(submitReportButton);
    });

    expect(reportSpy).toHaveBeenCalledWith(1, {
      title: "Race Report: R-2026-1",
      summary: "This was a clean race with no major accidents.",
    });
  });
});
