import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import { RequireRefereeRoute } from "./RequireRefereeRoute";
import * as authSessionModule from "../hooks/useClientSession";

vi.mock("../hooks/useClientSession");

describe("RequireRefereeRoute Guard", () => {
  it("redirects to home if user is not authenticated", () => {
    vi.spyOn(authSessionModule, "useClientSession").mockReturnValue({
      isAuthenticated: false,
      logout: () => {},
      session: null,
    });

    render(
      <MemoryRouter initialEntries={["/referee"]}>
        <Routes>
          <Route path="/" element={<div>Public Home</div>} />
          <Route
            path="/referee"
            element={
              <RequireRefereeRoute>
                <div>Referee Content</div>
              </RequireRefereeRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Public Home")).toBeInTheDocument();
    expect(screen.queryByText("Referee Content")).not.toBeInTheDocument();
  });

  it("redirects to home if user is authenticated but does not have REFEREE role", () => {
    vi.spyOn(authSessionModule, "useClientSession").mockReturnValue({
      isAuthenticated: true,
      logout: () => {},
      session: {
        accessToken: "mock-token",
        email: "spectator@equine.com",
        fullName: "Spectator User",
        roles: ["SPECTATOR"],
      },
    });

    render(
      <MemoryRouter initialEntries={["/referee"]}>
        <Routes>
          <Route path="/" element={<div>Public Home</div>} />
          <Route
            path="/referee"
            element={
              <RequireRefereeRoute>
                <div>Referee Content</div>
              </RequireRefereeRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Public Home")).toBeInTheDocument();
  });

  it("renders children if user has REFEREE role", () => {
    vi.spyOn(authSessionModule, "useClientSession").mockReturnValue({
      isAuthenticated: true,
      logout: () => {},
      session: {
        accessToken: "mock-token",
        email: "referee@equine.com",
        fullName: "Referee Julian",
        roles: ["REFEREE"],
      },
    });

    render(
      <MemoryRouter initialEntries={["/referee"]}>
        <Routes>
          <Route path="/" element={<div>Public Home</div>} />
          <Route
            path="/referee"
            element={
              <RequireRefereeRoute>
                <div>Referee Content</div>
              </RequireRefereeRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Referee Content")).toBeInTheDocument();
  });
});
