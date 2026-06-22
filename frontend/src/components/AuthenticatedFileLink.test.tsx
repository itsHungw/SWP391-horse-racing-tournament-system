import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "../api/httpClient";
import { AuthenticatedFileLink } from "./AuthenticatedFileLink";

vi.mock("../api/httpClient", () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

describe("AuthenticatedFileLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves a private file with the authenticated API before opening it", async () => {
    const popup = {
      close: vi.fn(),
      location: { href: "about:blank" },
      opener: window,
    };
    vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
    vi.mocked(httpClient.get).mockResolvedValue({
      data: { url: "https://s3.example.com/presigned" },
    });

    render(
      <AuthenticatedFileLink href="/api/v1/files/private/resume.pdf">
        Open resume
      </AuthenticatedFileLink>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Open resume" }));

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith("/files/private/resume.pdf");
      expect(popup.location.href).toBe("https://s3.example.com/presigned");
    });
  });

  it("leaves external links as normal anchors", () => {
    render(
      <AuthenticatedFileLink
        href="https://example.com/resume.pdf"
        onClick={(event) => event.preventDefault()}
      >
        Open resume
      </AuthenticatedFileLink>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Open resume" }));

    expect(httpClient.get).not.toHaveBeenCalled();
  });
});
