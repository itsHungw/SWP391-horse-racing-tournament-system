import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { blogApi } from "../../api/blogApi";
import type { Blog, PageResponse } from "../../types/blog";
import { HomePage } from "./HomePage";
import { SpectatorBlogDetailPage } from "./SpectatorBlogDetailPage";
import { SpectatorBlogListPage } from "./SpectatorBlogListPage";

vi.mock("../../api/blogApi", () => ({
  blogApi: {
    getPublishedBlogs: vi.fn(),
    getPublishedBlogBySlug: vi.fn(),
  },
}));

const blog: Blog = {
  id: 11,
  title: "Derby weekend track notes",
  slug: "derby-weekend-track-notes",
  summary: "How weather and late scratches shape this weekend.",
  content: "<p>Final track notes for spectators.</p>",
  thumbnail: "/api/v1/files/download/track.jpg",
  status: "PUBLISHED",
  authorId: 2,
  authorName: "Race Desk",
  createdAt: "2026-05-29T10:00:00",
  updatedAt: null,
};

function page(content: Blog[]): PageResponse<Blog> {
  return {
    content,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
    size: 9,
    number: 0,
  };
}

describe("public blog pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the latest published blog posts on the home page", async () => {
    vi.mocked(blogApi.getPublishedBlogs).mockResolvedValue(page([blog]));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(blogApi.getPublishedBlogs).toHaveBeenCalledWith(undefined, 0, 3);
    expect(await screen.findByRole("heading", { name: blog.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /more blog posts/i })).toHaveAttribute("href", "/blogs");
    expect(screen.getByRole("link", { name: /read derby weekend track notes/i })).toHaveAttribute(
      "href",
      `/blogs/${blog.slug}`,
    );
  });

  it("loads, searches, and links published blog posts on the blog list page", async () => {
    vi.mocked(blogApi.getPublishedBlogs).mockResolvedValue(page([blog]));

    render(
      <MemoryRouter>
        <SpectatorBlogListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("banner", { name: /client site header/i })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: blog.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /read derby weekend track notes/i })).toHaveAttribute(
      "href",
      `/blogs/${blog.slug}`,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: /search blog posts/i }), {
      target: { value: "derby" },
    });

    await waitFor(() => {
      expect(blogApi.getPublishedBlogs).toHaveBeenLastCalledWith("derby");
    });
  });

  it("shows an empty state when there are no published blog posts", async () => {
    vi.mocked(blogApi.getPublishedBlogs).mockResolvedValue(page([]));

    render(
      <MemoryRouter>
        <SpectatorBlogListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/no published blog posts/i)).toBeInTheDocument();
  });

  it("shows an error state when the public blog list cannot load", async () => {
    vi.mocked(blogApi.getPublishedBlogs).mockRejectedValue(new Error("API offline"));

    render(
      <MemoryRouter>
        <SpectatorBlogListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/could not load published blog posts/i)).toBeInTheDocument();
  });

  it("renders a published blog article by slug", async () => {
    vi.mocked(blogApi.getPublishedBlogBySlug).mockResolvedValue(blog);

    render(
      <MemoryRouter initialEntries={[`/blogs/${blog.slug}`]}>
        <Routes>
          <Route path="/blogs/:slug" element={<SpectatorBlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(blogApi.getPublishedBlogBySlug).toHaveBeenCalledWith(blog.slug);
    expect(await screen.findByRole("banner", { name: /client site header/i })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: blog.title })).toBeInTheDocument();
    expect(screen.getByText(/final track notes for spectators/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to blogs/i })).toHaveAttribute("href", "/blogs");
  });
});
