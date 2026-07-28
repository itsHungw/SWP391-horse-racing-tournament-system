import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminWalletApi } from "./adminWalletApi";
import { httpClient } from "./httpClient";

vi.mock("./httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("adminWalletApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends private receipt confirmation as browser-owned multipart data", async () => {
    const receipt = new File(["receipt"], "receipt.png", { type: "image/png" });
    vi.mocked(httpClient.post).mockResolvedValue({ data: { id: 42, status: "PAID" } });

    await adminWalletApi.markPaid(42, {
      transferReference: "FT-20260723-001",
      internalNote: "OCR fields matched",
      mismatchAcknowledged: false,
      idempotencyKey: "4f05c73d-8f50-42ce-9021-c57381caef12",
      receipt,
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      "/admin/withdrawals/42/mark-paid",
      expect.any(FormData),
    );
    const data = vi.mocked(httpClient.post).mock.calls[0][1] as FormData;
    expect(data.get("transferReference")).toBe("FT-20260723-001");
    expect(data.get("internalNote")).toBe("OCR fields matched");
    expect(data.get("mismatchAcknowledged")).toBe("false");
    expect(data.get("idempotencyKey")).toBe("4f05c73d-8f50-42ce-9021-c57381caef12");
    expect(data.get("receipt")).toBe(receipt);
  });
});
