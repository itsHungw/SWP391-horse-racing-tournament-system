import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import * as refereeApi from "../../api/refereeApi";
import * as profileApi from "../../api/profileApi";
import { RefereeProfileDashboardPage } from "./RefereeProfileDashboardPage";

vi.mock("../../api/refereeApi");
vi.mock("../../api/profileApi");
vi.mock("../../hooks/useClientSession", () => ({
  useClientSession: () => ({
    session: {
      email: "referee@equine.com",
      fullName: "Julian Sterling",
      roles: ["REFEREE"],
    },
  }),
}));

const mockRaces = [
  {
    id: 1,
    name: "Royal Ascot Gold Cup - Qualifiers A",
    code: "R-2026-001",
    distanceMeters: 1600,
    status: "SCHEDULED",
    scheduledAt: "2026-06-02T14:00:00+07:00",
    venue: "Turf Tower C",
  },
];

const mockProfile = {
  fullName: "Julian Sterling",
  phone: "0909123456",
  gender: "MALE",
  dateOfBirth: "1985-06-12",
  address: "123 Turf Tower Road",
  avatarUrl: "",
  roles: ["REFEREE"],
  profileCompleted: true,
  phoneVerified: true,
  ageVerified: true,
  refereeProfile: {
    licenseNumber: "REF-2026-X89",
    certification: "FEI Certified Steward",
    experienceYears: 8,
    bio: "Veteran steward bio details.",
    status: "ACTIVE" as const,
  },
};

function LocationProbe() {
  const location = useLocation();
  return (
    <p data-testid="location">
      {location.pathname}
      {location.search}
    </p>
  );
}

describe("RefereeProfileDashboardPage", () => {
  it("renders referee credential center details", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);
    vi.spyOn(profileApi, "getMyProfile").mockResolvedValue(mockProfile);

    render(
      <MemoryRouter>
        <RefereeProfileDashboardPage now={new Date("2026-06-02T12:30:00+07:00")} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Preparing credential center/i)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Professional race official profile" })).toBeInTheDocument();

    expect(screen.getByText("Julian Sterling")).toBeInTheDocument();
    expect(screen.getByText("referee@equine.com")).toBeInTheDocument();
    expect(screen.getByText("+84 0909123456")).toBeInTheDocument();
    expect(screen.getByText("123 Turf Tower Road")).toBeInTheDocument();

    expect(screen.getByText("Certified Race Official")).toBeInTheDocument();
    expect(screen.getByText("FEI Certified Steward")).toBeInTheDocument();
    expect(screen.getByText("REF-2026-X89")).toBeInTheDocument();
    expect(screen.getByText("8 years")).toBeInTheDocument();
    expect(screen.getAllByText("Veteran steward bio details.").length).toBeGreaterThan(0);

    expect(screen.getByText("Account profile completed")).toBeInTheDocument();
    expect(screen.getByText("Phone verified")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Calendar/i })).not.toBeInTheDocument();

    const statusBadge = screen.getByText("ACTIVE");
    expect(statusBadge).toHaveClass("bg-emerald-50");
  });

  it("keeps editing inside the referee profile page", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);
    vi.spyOn(profileApi, "getMyProfile").mockResolvedValue(mockProfile);

    render(
      <MemoryRouter initialEntries={["/referee"]}>
        <Routes>
          <Route path="/referee" element={<RefereeProfileDashboardPage now={new Date("2026-06-02T12:30:00+07:00")} />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    const manageBtn = await screen.findByRole("link", { name: /Edit referee profile/i });
    expect(manageBtn).toHaveAttribute("href", "#edit-referee-profile");
  });

  it("uploads referee evidence before saving credential changes", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);
    vi.spyOn(profileApi, "getMyProfile").mockResolvedValue(mockProfile);
    vi.spyOn(profileApi, "updateMyProfile").mockResolvedValue(mockProfile);
    vi.spyOn(profileApi, "uploadRefereeEvidence").mockResolvedValue({
      url: "/api/v1/files/private/referee-evidence.pdf",
    });
    vi.spyOn(profileApi, "updateMyRefereeProfile").mockResolvedValue({
      licenseNumber: "REF-2026-X89",
      certification: "FEI Certified Steward",
      experienceYears: 8,
      bio: "Veteran steward bio details.",
      evidenceUrl: "/api/v1/files/private/referee-evidence.pdf",
      status: "PENDING",
    });

    render(
      <MemoryRouter>
        <RefereeProfileDashboardPage now={new Date("2026-06-02T12:30:00+07:00")} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Professional race official profile" })).toBeInTheDocument();

    const evidenceFile = new File(["certificate"], "referee-evidence.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/certification evidence file/i), {
      target: { files: [evidenceFile] },
    });
    fireEvent.click(screen.getByRole("button", { name: /save referee profile/i }));

    await waitFor(() => {
      expect(profileApi.uploadRefereeEvidence).toHaveBeenCalledWith(evidenceFile);
      expect(profileApi.updateMyRefereeProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          evidenceUrl: "/api/v1/files/private/referee-evidence.pdf",
        }),
      );
    });
  });
});
