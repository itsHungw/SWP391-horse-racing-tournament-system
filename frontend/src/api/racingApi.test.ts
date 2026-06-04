import { afterEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "./httpClient";
import {
  createOwnerHorse,
  createOwnerHorseDocument,
  createOwnerTournamentRegistration,
  applyToJockeyChampionship,
  approveAdminJockeyPoolApplication,
  getOwnerHorseDocuments,
  getOwnerHorses,
  getOwnerHorsesPage,
  getAdminJockeyPoolApplications,
  getJockeyChampionships,
  getJockeyPoolApplications,
  getOwnerAvailableJockeys,
  getOwnerTournamentRegistrationsPage,
  rejectAdminJockeyPoolApplication,
} from "./racingApi";

vi.mock("./httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("racingApi", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads owner horses from the owner endpoint", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ data: [{ id: 1, name: "Nova", status: "PENDING" }] });

    await expect(getOwnerHorses()).resolves.toEqual([{ id: 1, name: "Nova", status: "PENDING" }]);
    expect(httpClient.get).toHaveBeenCalledWith("/owner/horses");
  });

  it("loads paginated owner horses with page params", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: { content: [{ id: 1, name: "Nova", status: "PENDING" }], totalElements: 9, totalPages: 3, number: 0 },
    });

    await expect(getOwnerHorsesPage({ page: 0, size: 4 })).resolves.toMatchObject({
      content: [{ id: 1, name: "Nova", status: "PENDING" }],
      totalElements: 9,
    });
    expect(httpClient.get).toHaveBeenCalledWith("/owner/horses", {
      params: { page: 0, size: 4 },
    });
  });

  it("creates owner horses without ownerId", async () => {
    vi.mocked(httpClient.post).mockResolvedValueOnce({ data: { id: 1, name: "Nova", status: "PENDING" } });
    const imageFile = new File(["image"], "nova.png", { type: "image/png" });
    const evidenceFile = new File(["evidence"], "nova.pdf", { type: "application/pdf" });

    await createOwnerHorse({
      name: "Nova",
      gender: "FEMALE",
      imageFile,
      evidenceFile,
    });

    expect(httpClient.post).toHaveBeenCalledWith("/owner/horses", expect.any(FormData));
    const formData = vi.mocked(httpClient.post).mock.calls[0][1] as FormData;
    expect(formData.get("name")).toBe("Nova");
    expect(formData.get("gender")).toBe("FEMALE");
    expect(formData.get("imageFile")).toBe(imageFile);
    expect(formData.get("evidenceFile")).toBe(evidenceFile);
  });

  it("loads and uploads owner horse documents", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: [{ id: 7, horseId: 1, documentType: "HEALTH_CERTIFICATE" }],
    });
    vi.mocked(httpClient.post).mockResolvedValueOnce({
      data: { id: 8, horseId: 1, documentType: "COGGINS" },
    });
    const documentFile = new File(["document"], "coggins.pdf", { type: "application/pdf" });

    await expect(getOwnerHorseDocuments(1)).resolves.toEqual([
      { id: 7, horseId: 1, documentType: "HEALTH_CERTIFICATE" },
    ]);
    await createOwnerHorseDocument(1, {
      documentType: "COGGINS",
      referenceNumber: "COG-2026-001",
      issueDate: "2026-05-01",
      expiryDate: "2027-05-01",
      issuer: "Saigon Equine Clinic",
      notes: "Clear.",
      documentFile,
    });

    expect(httpClient.get).toHaveBeenCalledWith("/owner/horses/1/documents");
    expect(httpClient.post).toHaveBeenCalledWith("/owner/horses/1/documents", expect.any(FormData));
    const formData = vi.mocked(httpClient.post).mock.calls[0][1] as FormData;
    expect(formData.get("documentType")).toBe("COGGINS");
    expect(formData.get("referenceNumber")).toBe("COG-2026-001");
    expect(formData.get("documentFile")).toBe(documentFile);
  });

  it("submits owner tournament registrations", async () => {
    vi.mocked(httpClient.post).mockResolvedValueOnce({ data: { id: 10, status: "PENDING" } });

    await createOwnerTournamentRegistration({ tournamentId: 2, horseId: 1, note: "Ready" });

    expect(httpClient.post).toHaveBeenCalledWith("/owner/tournament-registrations", {
      tournamentId: 2,
      horseId: 1,
      note: "Ready",
    });
  });

  it("loads paginated owner tournament registrations with optional horse and focus params", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: { content: [{ id: 10, status: "REJECTED" }], totalElements: 12, totalPages: 3, number: 1 },
    });

    await expect(
      getOwnerTournamentRegistrationsPage({ page: 0, size: 5, horseId: 3, focusId: 10 }),
    ).resolves.toMatchObject({
      content: [{ id: 10, status: "REJECTED" }],
      number: 1,
    });
    expect(httpClient.get).toHaveBeenCalledWith("/owner/tournament-registrations", {
      params: { page: 0, size: 5, horseId: 3, focusId: 10 },
    });
  });

  it("loads and reviews championship jockey pool applications", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: [{ id: 31, jockeyName: "Nguyen Van A", status: "PENDING" }],
    });
    vi.mocked(httpClient.post)
      .mockResolvedValueOnce({ data: { id: 31, status: "APPROVED_FOR_POOL" } })
      .mockResolvedValueOnce({ data: { id: 32, status: "REJECTED" } });

    await expect(getAdminJockeyPoolApplications(7, "PENDING")).resolves.toEqual([
      { id: 31, jockeyName: "Nguyen Van A", status: "PENDING" },
    ]);
    await approveAdminJockeyPoolApplication(7, 31);
    await rejectAdminJockeyPoolApplication(7, 32, "Schedule conflict.");

    expect(httpClient.get).toHaveBeenCalledWith("/admin/championships/7/jockey-pool-applications", {
      params: { status: "PENDING" },
    });
    expect(httpClient.post).toHaveBeenCalledWith(
      "/admin/championships/7/jockey-pool-applications/31/approve",
    );
    expect(httpClient.post).toHaveBeenCalledWith(
      "/admin/championships/7/jockey-pool-applications/32/reject",
      { reason: "Schedule conflict." },
    );
  });

  it("loads owner available jockeys from the approved championship pool", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: [{ id: 31, jockeyName: "Nguyen Van A", status: "APPROVED_FOR_POOL" }],
    });

    await expect(getOwnerAvailableJockeys(7)).resolves.toEqual([
      { id: 31, jockeyName: "Nguyen Van A", status: "APPROVED_FOR_POOL" },
    ]);
    expect(httpClient.get).toHaveBeenCalledWith("/owner/championships/7/jockey-pool");
  });

  it("loads and applies to jockey championships", async () => {
    vi.mocked(httpClient.get)
      .mockResolvedValueOnce({
        data: [{ id: 7, name: "Spring Cup 2026", applicationStatus: "NOT_APPLIED", canApply: true }],
      })
      .mockResolvedValueOnce({
        data: [{ id: 31, championshipName: "Spring Cup 2026", status: "PENDING" }],
      });
    vi.mocked(httpClient.post).mockResolvedValueOnce({
      data: { id: 31, championshipName: "Spring Cup 2026", status: "PENDING" },
    });

    await expect(getJockeyChampionships()).resolves.toEqual([
      { id: 7, name: "Spring Cup 2026", applicationStatus: "NOT_APPLIED", canApply: true },
    ]);
    await expect(getJockeyPoolApplications()).resolves.toEqual([
      { id: 31, championshipName: "Spring Cup 2026", status: "PENDING" },
    ]);
    await applyToJockeyChampionship(7, "Available for all rounds.");

    expect(httpClient.get).toHaveBeenCalledWith("/jockey/championships");
    expect(httpClient.get).toHaveBeenCalledWith("/jockey/championships/applications");
    expect(httpClient.post).toHaveBeenCalledWith("/jockey/championships/7/pool-applications", {
      message: "Available for all rounds.",
    });
  });
});
