import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as authSessionModule from "../hooks/useClientSession";
import { RequireAdminRoute } from "./RequireAdminRoute";
import { RequireAuthRoute } from "./RequireAuthRoute";
import { RequireRoleRoute } from "./RequireRoleRoute";

vi.mock("../hooks/useClientSession");

const mockUseClientSession = vi.mocked(authSessionModule.useClientSession);

function LoginProbe() {
  const location = useLocation();
  const state = location.state as { returnTo?: string } | null;

  return <p>Return to: {state?.returnTo ?? "missing"}</p>;
}

function PathnameProbe() {
  return <p>Current pathname: {useLocation().pathname}</p>;
}

describe("protected route guards", () => {
  beforeEach(() => {
    mockUseClientSession.mockReset();
  });

  it("sends unauthenticated users to login with the complete internal return path in location state", () => {
    mockUseClientSession.mockReturnValue({
      isAuthenticated: false,
      isInitializing: false,
      logout: vi.fn(),
      session: null,
    });

    render(
      <MemoryRouter initialEntries={["/owner/dashboard?tab=entries#history"]}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route
            path="/owner/dashboard"
            element={
              <RequireAuthRoute>
                <p>Owner dashboard</p>
              </RequireAuthRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Return to: /owner/dashboard?tab=entries#history")).toBeInTheDocument();
    expect(screen.queryByText("Owner dashboard")).not.toBeInTheDocument();
  });

  it("shows the shared access-denied page without changing the URL when the required role is missing", () => {
    mockUseClientSession.mockReturnValue({
      isAuthenticated: true,
      isInitializing: false,
      logout: vi.fn(),
      session: {
        accessToken: "spectator-token",
        email: "spectator@aqueduct.test",
        fullName: "Spectator User",
        roles: ["SPECTATOR"],
      },
    });

    render(
      <MemoryRouter initialEntries={["/owner/dashboard"]}>
        <Routes>
          <Route
            path="/owner/dashboard"
            element={
              <>
                <PathnameProbe />
                <RequireRoleRoute role="HORSE_OWNER" workspaceName="Owner Workspace">
                  <p>Owner dashboard</p>
                </RequireRoleRoute>
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /access beyond this gate is restricted/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Current pathname: /owner/dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Owner dashboard")).not.toBeInTheDocument();
  });

  it("renders protected children when the authenticated user has the required role", () => {
    mockUseClientSession.mockReturnValue({
      isAuthenticated: true,
      isInitializing: false,
      logout: vi.fn(),
      session: {
        accessToken: "owner-token",
        email: "owner@aqueduct.test",
        fullName: "Owner User",
        roles: ["horse_owner"],
      },
    });

    render(
      <MemoryRouter initialEntries={["/owner/dashboard"]}>
        <RequireRoleRoute role="HORSE_OWNER" workspaceName="Owner Workspace">
          <p>Owner dashboard</p>
        </RequireRoleRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("Owner dashboard")).toBeInTheDocument();
  });

  it("uses the shared role guard denial behavior for authenticated non-admin users", () => {
    mockUseClientSession.mockReturnValue({
      isAuthenticated: true,
      isInitializing: false,
      logout: vi.fn(),
      session: {
        accessToken: "organizer-token",
        email: "organizer@aqueduct.test",
        fullName: "Organizer User",
        roles: ["ORGANIZER"],
      },
    });

    render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={
              <>
                <PathnameProbe />
                <RequireAdminRoute>
                  <p>Admin dashboard</p>
                </RequireAdminRoute>
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /access beyond this gate is restricted/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Admin Operations")).toBeInTheDocument();
    expect(screen.getByText("Current pathname: /admin/dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Admin dashboard")).not.toBeInTheDocument();
  });
});
