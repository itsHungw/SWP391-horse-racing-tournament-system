import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyProfile } from "../../api/profileApi";
import { getMyOrganization, registerOrganization, uploadOrganizationLicense, uploadOrganizationLogo } from "../../api/racingApi";
import { OrganizerRegisterPage } from "./OrganizerRegisterPage";

vi.mock("../../api/profileApi", () => ({
  getMyProfile: vi.fn(),
}));

vi.mock("../../api/racingApi", () => ({
  getMyOrganization: vi.fn(),
  registerOrganization: vi.fn(),
  uploadOrganizationLicense: vi.fn(),
  uploadOrganizationLogo: vi.fn(),
}));

vi.mock("../../components/client/ClientHeader", () => ({
  ClientHeader: () => <header data-testid="client-header" />,
}));

vi.mock("../../components/client/ClientFooter", () => ({
  ClientFooter: () => <footer data-testid="client-footer" />,
}));

describe("OrganizerRegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyProfile).mockResolvedValue({
      email: "hung@example.com",
      fullName: "Nguyen Vinh Hung",
      phone: "0909123456",
      gender: "MALE",
      dateOfBirth: "2000-01-02",
      address: "Ho Chi Minh City",
      avatarUrl: "",
      roles: ["SPECTATOR"],
      profileCompleted: true,
      phoneVerified: true,
      ageVerified: true,
    });
    vi.mocked(registerOrganization).mockResolvedValue({
      id: 5,
      code: "SGR",
      name: "Sai gon racing club",
      status: "PENDING",
    });
    vi.mocked(uploadOrganizationLicense).mockResolvedValue({ url: "/api/v1/files/private/license.pdf" });
    vi.mocked(uploadOrganizationLogo).mockResolvedValue({ url: "/api/v1/files/download/logo.png" });
  });

  it("shows rejected organization applications as a resubmission workspace with the previous data prefilled", async () => {
    vi.mocked(getMyOrganization).mockResolvedValue({
      id: 5,
      code: "SGR",
      name: "Sai gon racing club",
      status: "REJECTED",
      licenseNumber: "ORG-2026",
      contactEmail: "director@saigon.test",
      contactPhone: "+84901234567",
      description: "Saigon racing venue group",
      evidenceUrl: "/api/v1/files/private/license.pdf",
      logoUrl: "/api/v1/files/download/logo.png",
      applicationNote: "We operate race-day logistics and venue partnerships across southern Vietnam.",
      rejectionReason: "License scan is unreadable. Please upload a clearer PDF.",
    });

    render(
      <MemoryRouter>
        <OrganizerRegisterPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /resubmission workspace/i })).toBeInTheDocument();
    expect(screen.getByText(/license scan is unreadable/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organization name/i)).toHaveValue("Sai gon racing club");
    expect(screen.getByLabelText(/business license/i)).toHaveValue("ORG-2026");
    expect(screen.getByLabelText(/official contact email/i)).toHaveValue("director@saigon.test");
    expect(screen.getByLabelText(/contact phone/i)).toHaveValue("+84901234567");
    expect(screen.getByLabelText(/short tagline/i)).toHaveValue("Saigon racing venue group");
    expect(screen.getByLabelText(/capability statement/i)).toHaveValue(
      "We operate race-day logistics and venue partnerships across southern Vietnam.",
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /resubmit application/i })).toBeEnabled();
    });
  });

  it("tells a recovered active organizer to sign in again when the current session lacks the role", async () => {
    vi.mocked(getMyOrganization).mockResolvedValue({
      id: 5,
      code: "SGR",
      name: "Sai gon racing club",
      status: "ACTIVE",
    });

    render(
      <MemoryRouter>
        <OrganizerRegisterPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/sign out and sign in again/i)).toBeInTheDocument();
  });
});
