import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfilePage } from "./ProfilePage";
import * as profileApi from "../../api/profileApi";

vi.mock("../../api/profileApi", () => ({
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
  uploadAvatar: vi.fn(),
}));

function renderProfilePage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("shows profile readiness and the application path", async () => {
    vi.mocked(profileApi.getMyProfile).mockResolvedValue({
      email: "test@example.com",
      roles: ["SPECTATOR"],
      fullName: "Nguyen Van A",
      phone: "0901234567",
      gender: "MALE",
      dateOfBirth: "2000-01-02",
      address: "District 1, Ho Chi Minh City",
      avatarUrl: "",
      profileCompleted: true,
      phoneVerified: false,
      ageVerified: true,
    });

    renderProfilePage();

    expect(await screen.findByRole("heading", { name: /member credentials/i })).toBeInTheDocument();
    expect(screen.getAllByText(/profile complete/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/6 of 6 ready/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/gender/i)).toHaveValue("MALE");
    expect(screen.getByLabelText(/date of birth/i)).toHaveValue("2000-01-02");
    expect(screen.getByRole("link", { name: /continue to role application/i })).toHaveAttribute(
      "href",
      "/my-role-requests",
    );
  });

  it("updates profile information with clean form feedback", async () => {
    vi.mocked(profileApi.getMyProfile).mockResolvedValue({
      email: "test@example.com",
      roles: [],
      fullName: "",
      phone: "",
      gender: "",
      dateOfBirth: "",
      address: "",
      avatarUrl: "",
      profileCompleted: false,
      phoneVerified: false,
      ageVerified: false,
    });
    vi.mocked(profileApi.updateMyProfile).mockResolvedValue({
      email: "test@example.com",
      roles: [],
      fullName: "Nguyen Van B",
      phone: "0901234567",
      gender: "FEMALE",
      dateOfBirth: "1999-06-15",
      address: "District 3, Ho Chi Minh City",
      avatarUrl: "",
      profileCompleted: true,
      phoneVerified: false,
      ageVerified: true,
    });

    renderProfilePage();

    fireEvent.change(await screen.findByLabelText(/full name/i), {
      target: { value: "Nguyen Van B" },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: "901234567" },
    });
    fireEvent.change(screen.getByLabelText(/gender/i), {
      target: { value: "FEMALE" },
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: "1999-06-15" },
    });
    fireEvent.change(screen.getByLabelText(/^address$/i), {
      target: { value: "District 3, Ho Chi Minh City" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => {
      expect(profileApi.updateMyProfile).toHaveBeenCalledWith({
        fullName: "Nguyen Van B",
        phone: "0901234567",
        gender: "FEMALE",
        dateOfBirth: "1999-06-15",
        address: "District 3, Ho Chi Minh City",
        avatarUrl: "",
      });
    });
    expect(await screen.findByText(/profile updated successfully/i)).toBeInTheDocument();
  });
});
