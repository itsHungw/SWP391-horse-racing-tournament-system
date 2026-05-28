import { afterEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "./httpClient";
import {
  createOwnerHorse,
  createOwnerHorseDocument,
  createOwnerTournamentRegistration,
  getOwnerHorseDocuments,
  getOwnerHorses,
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
});
