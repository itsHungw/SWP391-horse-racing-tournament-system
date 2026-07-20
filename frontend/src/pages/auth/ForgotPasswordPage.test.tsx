import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { forgotPassword, resetPassword, verifyResetCode } from "../../api/authApi";
import { ForgotPasswordPage } from "./ForgotPasswordPage";

vi.mock("../../api/authApi", () => ({
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  verifyResetCode: vi.fn(),
}));

const mockedForgotPassword = vi.mocked(forgotPassword);
const mockedResetPassword = vi.mocked(resetPassword);
const mockedVerifyResetCode = vi.mocked(verifyResetCode);

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    mockedForgotPassword.mockReset();
    mockedResetPassword.mockReset();
    mockedVerifyResetCode.mockReset();
  });

  it("uses the same authentication shell branding as the login page", () => {
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/tournament operations introduction/i)).toBeInTheDocument();
    expect(screen.getByText(/official tournament operations/i)).toBeInTheDocument();
    expect(screen.getByText(/the prestige of performance/i)).toBeInTheDocument();
    expect(screen.getByText(/certified tournament partner/i)).toBeInTheDocument();
    expect(screen.getByText(/2026 aqueduct/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to login/i })).toHaveAttribute("href", "/login");
  });

  it("keeps email and reset code fields together while requesting a code", async () => {
    mockedForgotPassword.mockResolvedValue();
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "rider@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send code/i }));

    await waitFor(() => {
      expect(mockedForgotPassword).toHaveBeenCalledWith("rider@example.com");
    });
    expect(screen.getByLabelText(/reset code/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^new password$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/if this email exists/i)).toBeInTheDocument();
  });

  it("shows password fields only after email otp verification succeeds", async () => {
    mockedForgotPassword.mockResolvedValue();
    mockedVerifyResetCode.mockResolvedValue();
    mockedResetPassword.mockResolvedValue();
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/login" element={<h1>Login page</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "rider@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send code/i }));
    await waitFor(() => {
      expect(mockedForgotPassword).toHaveBeenCalledWith("rider@example.com");
    });

    fireEvent.change(screen.getByLabelText(/reset code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

    await waitFor(() => {
      expect(mockedVerifyResetCode).toHaveBeenCalledWith({
        email: "rider@example.com",
        token: "123456",
      });
    });
    expect(await screen.findByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /change email or code/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to login/i })).toHaveAttribute("href", "/login");

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "NewPassword123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "NewPassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(mockedResetPassword).toHaveBeenCalledWith({
        email: "rider@example.com",
        token: "123456",
        newPassword: "NewPassword123",
        confirmPassword: "NewPassword123",
      });
    });
    expect(await screen.findByText(/password changed successfully/i)).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /go to login/i })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: /back to login/i })).not.toBeInTheDocument();
  });
});
