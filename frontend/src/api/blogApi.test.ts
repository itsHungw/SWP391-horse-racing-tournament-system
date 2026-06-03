import { describe, expect, it, vi } from "vitest";

import { httpClient } from "./httpClient";
import { blogApi } from "./blogApi";

vi.mock("./httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("blogApi", () => {
  it("fetches admin blogs through the shared http client", async () => {
    const page = { content: [], totalPages: 0, totalElements: 0, size: 10, number: 0 };
    vi.mocked(httpClient.get).mockResolvedValue({ data: page });

    const result = await blogApi.getAllBlogsForAdmin("derby", 1, 20);

    expect(httpClient.get).toHaveBeenCalledWith("/admin/blogs", {
      params: { search: "derby", page: 1, size: 20 },
    });
    expect(result).toEqual(page);
  });

  it("creates an admin blog through the shared http client", async () => {
    const blog = {
      id: 7,
      title: "Race preview",
      slug: "race-preview",
      summary: "Preview",
      content: "Body",
      thumbnail: null,
      status: "DRAFT" as const,
      authorId: 1,
      authorName: "Admin User",
      createdAt: "2026-05-30T10:00:00",
      updatedAt: null,
    };
    const payload = {
      title: "Race preview",
      summary: "Preview",
      content: "Body",
      thumbnail: null,
      status: "DRAFT" as const,
    };
    vi.mocked(httpClient.post).mockResolvedValue({ data: blog });

    const result = await blogApi.createBlog(payload);

    expect(httpClient.post).toHaveBeenCalledWith("/admin/blogs", payload);
    expect(result).toEqual(blog);
  });

  it("updates blog status through the shared http client", async () => {
    const blog = {
      id: 7,
      title: "Race preview",
      slug: "race-preview",
      summary: "Preview",
      content: "Body",
      thumbnail: null,
      status: "PUBLISHED" as const,
      authorId: 1,
      authorName: "Admin User",
      createdAt: "2026-05-30T10:00:00",
      updatedAt: "2026-05-30T11:00:00",
    };
    vi.mocked(httpClient.patch).mockResolvedValue({ data: blog });

    const result = await blogApi.updateBlogStatus(7, "PUBLISHED");

    expect(httpClient.patch).toHaveBeenCalledWith("/admin/blogs/7/status", { status: "PUBLISHED" });
    expect(result).toEqual(blog);
  });

  it("claims a blog reward through the shared http client", async () => {
    const response = { outcome: "CLAIMED" as const, pointsAwarded: 10, balance: 30 };
    const payload = { readingSeconds: 30, scrollPercent: 80 };
    vi.mocked(httpClient.post).mockResolvedValue({ data: response });

    const result = await blogApi.claimBlogReward("race-preview", payload);

    expect(httpClient.post).toHaveBeenCalledWith("/blogs/race-preview/claim-reward", payload);
    expect(result).toEqual(response);
  });

  it("uploads a blog thumbnail with FormData through the shared http client", async () => {
    const file = new File(["image"], "preview.jpg", { type: "image/jpeg" });
    vi.mocked(httpClient.post).mockResolvedValue({ data: { url: "http://localhost/api/v1/files/download/preview.jpg" } });

    const result = await blogApi.uploadBlogThumbnail(file);

    expect(httpClient.post).toHaveBeenCalledWith(
      "/files/upload?category=BLOG",
      expect.any(FormData),
    );
    expect(result).toEqual({ url: "http://localhost/api/v1/files/download/preview.jpg" });
  });
});
