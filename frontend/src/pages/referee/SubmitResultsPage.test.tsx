import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import { SubmitResultsPage } from "./SubmitResultsPage";
import * as refereeApi from "../../api/refereeApi";

vi.mock("../../api/refereeApi");

const mockEntries = [
  {
    participantId: 1,
    horseName: "Thunderstrike",
    jockeyName: "Julian Sterling",
    position: "" as const,
    finishTimeSeconds: "" as const,
    status: "FINISHED" as const,
  },
];

describe("SubmitResultsPage", () => {
  it("renders finishing positions form and handles successful submission", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue(mockEntries);
    const submitSpy = vi.spyOn(refereeApi, "submitRaceResults").mockResolvedValue();

    render(
      <MemoryRouter initialEntries={["/referee/races/1/results"]}>
        <Routes>
          <Route path="/referee/races/:id/results" element={<SubmitResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Submit Final Results")).toBeInTheDocument();
    expect(screen.getByText(/Thunderstrike — Julian Sterling/i)).toBeInTheDocument();

    const submitButton = screen.getByRole("button", { name: /submit official results/i });
    fireEvent.click(submitButton);

    expect(submitSpy).toHaveBeenCalledWith(1, mockEntries);
  });

  it("allows entering decimal strings for elapsed time and parses to number on save", async () => {
    vi.spyOn(refereeApi, "getRaceResultEntries").mockResolvedValue(mockEntries);
    const submitSpy = vi.spyOn(refereeApi, "submitRaceResults").mockResolvedValue();

    render(
      <MemoryRouter initialEntries={["/referee/races/1/results"]}>
        <Routes>
          <Route path="/referee/races/:id/results" element={<SubmitResultsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Submit Final Results")).toBeInTheDocument();

    const timeInput = screen.getByPlaceholderText("e.g. 94.25");
    
    // Simulate typing a decimal step-by-step
    fireEvent.change(timeInput, { target: { value: "94" } });
    expect(timeInput).toHaveValue("94");

    fireEvent.change(timeInput, { target: { value: "94." } });
    expect(timeInput).toHaveValue("94.");

    fireEvent.change(timeInput, { target: { value: "94.25" } });
    expect(timeInput).toHaveValue("94.25");

    const submitButton = screen.getByRole("button", { name: /submit official results/i });
    fireEvent.click(submitButton);

    // Should submit parsed floating-point number
    expect(submitSpy).toHaveBeenCalledWith(1, [
      {
        participantId: 1,
        horseName: "Thunderstrike",
        jockeyName: "Julian Sterling",
        position: "",
        finishTimeSeconds: 94.25,
        status: "FINISHED",
      },
    ]);
  });
});
