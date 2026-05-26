import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { login, register } from "../../api/authApi";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";

vi.mock("../../api/authApi", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

const mockedLogin = vi.mocked(login);
const mockedRegister = vi.mocked(register);

function createAccessTokenWithRoles(roles: string[]) {
  const header = window.btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = window.btoa(JSON.stringify({ roles }));

  return `${header}.${payload}.signature`;
}

describe("Auth pages", () => {
  beforeEach(() => {
    localStorage.clear();
    mockedLogin.mockReset();
    mockedRegister.mockReset();
  });

  it("connects the NYRA-style login UI to the login API", async () => {
    mockedLogin.mockResolvedValue({
      accessToken: "access-token",
      email: "official@nyra.com",
      fullName: "Official User",
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^login$/i })).toHaveAttribute("aria-pressed", "true");

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "official@nyra.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Password1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /secure login/i }));

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalledWith({
        email: "official@nyra.com",
        password: "Password1",
      });
    });
    expect(localStorage.getItem("accessToken")).toBe("access-token");
    expect(localStorage.getItem("fullName")).toBe("Official User");
    expect(localStorage.getItem("email")).toBe("official@nyra.com");
  });

  it("redirects admins to the admin dashboard after login", async () => {
    mockedLogin.mockResolvedValue({
      accessToken: createAccessTokenWithRoles(["ADMIN", "SPECTATOR"]),
      email: "admin@nyra.com",
      fullName: "Admin User",
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<h1>Admin dashboard</h1>} />
          <Route path="/" element={<h1>Home</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "admin@nyra.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Password1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /secure login/i }));

    expect(await screen.findByRole("heading", { name: /admin dashboard/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^home$/i })).not.toBeInTheDocument();
  });

  it("connects the NYRA-style register UI to the register API", async () => {
    mockedRegister.mockResolvedValue();

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /join the circuit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account tab/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Julian Sterling" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "sterling@stable.com" },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: "0901234567" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "Password1" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "Password1" },
    });
    fireEvent.click(screen.getByLabelText(/tournament rules/i));
    fireEvent.click(screen.getByRole("button", { name: /^create account$/i }));

    await waitFor(() => {
      expect(mockedRegister).toHaveBeenCalledWith({
        email: "sterling@stable.com",
        fullName: "Julian Sterling",
        password: "Password1",
        phone: "0901234567",
      });
    });
    expect(localStorage.getItem("pendingVerifyEmail")).toBe("sterling@stable.com");
  });
});
