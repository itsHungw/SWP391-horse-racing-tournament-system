import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import { RefereeLayout } from "./RefereeLayout";

vi.mock("../hooks/useClientSession", () => ({
  useClientSession: () => ({
    isAuthenticated: true,
    logout: () => {},
    session: {
      accessToken: "mock-token",
      email: "referee@equine.com",
      fullName: "Julian Sterling",
      roles: ["REFEREE"],
    },
  }),
}));

describe("RefereeLayout", () => {
  it("renders layout sidebar and header in english with light theme aesthetics", () => {
    render(
      <MemoryRouter>
        <RefereeLayout />
      </MemoryRouter>
    );

    expect(screen.getByText("EQUINEPRO ELITE — REFEREE PORTAL")).toBeInTheDocument();
    expect(screen.getByText("Julian Sterling")).toBeInTheDocument();
    expect(screen.getByText(/Head Referee/i)).toBeInTheDocument();
    expect(screen.getByText("Exit Dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Assigned Races/i)).toBeInTheDocument();
  });
});
