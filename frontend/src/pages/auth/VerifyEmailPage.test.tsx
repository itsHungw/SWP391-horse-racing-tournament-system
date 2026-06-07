import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resendVerificationEmail, verifyEmail } from "../../api/authApi";
import { VerifyEmailPage } from "./VerifyEmailPage";

vi.mock("../../api/authApi", () => ({
  resendVerificationEmail: vi.fn(),
  verifyEmail: vi.fn(),
}));

const mockedResendVerificationEmail = vi.mocked(resendVerificationEmail);
const mockedVerifyEmail = vi.mocked(verifyEmail);

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    localStorage.clear();
    mockedResendVerificationEmail.mockReset();
    mockedVerifyEmail.mockReset();
  });

  it("verifies the email when the user enters the six digit OTP", async () => {
    mockedVerifyEmail.mockResolvedValue();
    localStorage.setItem("pendingVerifyEmail", "rider@example.com");

    render(
      <MemoryRouter initialEntries={["/verify-email"]}>
        <VerifyEmailPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^verify email$/i }));

    await waitFor(() => {
      expect(mockedVerifyEmail).toHaveBeenCalledWith("123456");
    });
    expect(await screen.findByText(/email verified successfully/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to login/i })).toHaveAttribute("href", "/login");
  });

  it("shows a helpful inbox state and resends verification email when an email is pending", async () => {
    mockedResendVerificationEmail.mockResolvedValue();
    localStorage.setItem("pendingVerifyEmail", "rider@example.com");

    render(
      <MemoryRouter initialEntries={["/verify-email"]}>
        <VerifyEmailPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /check your inbox/i })).toBeInTheDocument();
    expect(screen.getByText(/rider@example.com/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /resend code/i }));

    await waitFor(() => {
      expect(mockedResendVerificationEmail).toHaveBeenCalledWith("rider@example.com");
    });
    expect(await screen.findByText(/new verification code has been sent/i)).toBeInTheDocument();
  });

  it("guides the user back to registration when no pending email exists", () => {
    render(
      <MemoryRouter initialEntries={["/verify-email"]}>
        <VerifyEmailPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /check your inbox/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resend code/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to register/i })).toHaveAttribute("href", "/register");
  });
});
