import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyProfile } from "../../api/profileApi";
import { getMyRoleRequests, submitRoleRequest } from "../../api/roleRequestApi";
import { MyRoleRequestsPage } from "./MyRoleRequestsPage";

vi.mock("../../api/profileApi", () => ({
  getMyProfile: vi.fn(),
}));

vi.mock("../../api/roleRequestApi", () => ({
  getMyRoleRequests: vi.fn(),
  submitRoleRequest: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MyRoleRequestsPage />
    </MemoryRouter>,
  );
}

const completedProfile = {
  fullName: "Nguyen Van A",
  phone: "+84901234567",
  gender: "MALE",
  dateOfBirth: "2000-01-02",
  address: "Ho Chi Minh City",
  avatarUrl: "",
  profileCompleted: true,
  phoneVerified: false,
  ageVerified: true,
};

describe("MyRoleRequestsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("accessToken", "token");
    vi.clearAllMocks();
  });

  it("shows role cards, readiness, and disables a pending role", async () => {
    vi.mocked(getMyProfile).mockResolvedValue(completedProfile);
    vi.mocked(getMyRoleRequests).mockResolvedValue([
      {
        id: 9,
        userId: 1,
        requestedRole: "JOCKEY",
        status: "PENDING",
        reason: "I have race-day experience and want to join tournament lineups.",
        createdAt: "2026-05-24T00:00:00",
      },
    ]);

    renderPage();

    expect(await screen.findByRole("heading", { name: /role applications/i })).toBeInTheDocument();
    expect(screen.getByText(/profile complete/i)).toBeInTheDocument();
    expect(screen.getByText(/phone verification pending/i)).toBeInTheDocument();

    const jockeyCard = screen.getByRole("button", { name: /jockey application under review/i });
    expect(jockeyCard).toBeDisabled();
    expect(screen.getAllByText(/under review/i).length).toBeGreaterThan(0);
  });

  it("submits a role request with evidence url", async () => {
    vi.mocked(getMyProfile).mockResolvedValue(completedProfile);
    vi.mocked(getMyRoleRequests).mockResolvedValue([]);
    vi.mocked(submitRoleRequest).mockResolvedValue({
      id: 10,
      userId: 1,
      requestedRole: "REFEREE",
      status: "PENDING",
      reason: "I have tournament operations experience and can support fair review workflows.",
      evidenceUrl: "https://example.com/referee-proof",
      createdAt: "2026-05-24T00:00:00",
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /select referee role/i }));
    fireEvent.change(screen.getByLabelText(/application reason/i), {
      target: {
        value: "I have tournament operations experience and can support fair review workflows.",
      },
    });
    fireEvent.change(screen.getByLabelText(/evidence url/i), {
      target: { value: "https://example.com/referee-proof" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit application/i }));

    await waitFor(() => {
      expect(submitRoleRequest).toHaveBeenCalledWith(
        "REFEREE",
        "I have tournament operations experience and can support fair review workflows.",
        "https://example.com/referee-proof",
      );
    });
    expect(await screen.findByText(/application submitted/i)).toBeInTheDocument();
  });

  it("sends incomplete users back to profile before applying", async () => {
    vi.mocked(getMyProfile).mockResolvedValue({
      ...completedProfile,
      fullName: "",
      profileCompleted: false,
      ageVerified: false,
    });
    vi.mocked(getMyRoleRequests).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByRole("heading", { name: /complete your profile/i })).toBeInTheDocument();
    const checklist = screen.getByRole("list", { name: /application readiness/i });
    expect(within(checklist).getByText(/profile incomplete/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /complete profile/i })).toHaveAttribute("href", "/profile");
  });
});
