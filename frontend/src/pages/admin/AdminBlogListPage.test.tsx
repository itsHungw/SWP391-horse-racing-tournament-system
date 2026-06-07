import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { blogApi } from "../../api/blogApi";
import type { Blog, PageResponse } from "../../types/blog";
import { AdminBlogListPage } from "./AdminBlogListPage";

vi.mock("../../api/blogApi", () => ({
  blogApi: {
    getAllBlogsForAdmin: vi.fn(),
    updateBlogStatus: vi.fn(),
    deleteBlog: vi.fn(),
  },
}));

const blog: Blog = {
  id: 1,
  title: "Derby preview",
  slug: "derby-preview",
  summary: "A short preview",
  content: "Race day analysis",
  thumbnail: null,
  status: "DRAFT",
  authorId: 1,
  authorName: "Admin User",
  createdAt: "2026-05-30T10:00:00",
  updatedAt: null,
};

function page(content: Blog[]): PageResponse<Blog> {
  return {
    content,
    totalElements: content.length,
    totalPages: content.length > 0 ? 1 : 0,
    size: 10,
    number: 0,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminBlogListPage />
    </MemoryRouter>,
  );
}

describe("AdminBlogListPage", () => {
  it("renders inside the admin layout and lists blog rows", async () => {
    vi.mocked(blogApi.getAllBlogsForAdmin).mockResolvedValue(page([blog]));

    renderPage();

    expect(screen.getByText(/tournament control/i)).toBeInTheDocument();
    expect(screen.getByText(/loading blog posts/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Derby preview")).toBeInTheDocument();
    });

    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /new post/i })).toHaveAttribute("href", "/admin/blog/new");
  });

  it("shows an empty state when the API returns no posts", async () => {
    vi.mocked(blogApi.getAllBlogsForAdmin).mockResolvedValue(page([]));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/no blog posts match this search/i)).toBeInTheDocument();
    });
  });

  it("shows an error state when the API fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(blogApi.getAllBlogsForAdmin).mockRejectedValue(new Error("API unavailable"));

    try {
      renderPage();

      await waitFor(() => {
        expect(screen.getByText(/could not load blog posts/i)).toBeInTheDocument();
      });
    } finally {
      consoleError.mockRestore();
    }
  });

  it("asks for confirmation before publishing a blog post", async () => {
    vi.mocked(blogApi.getAllBlogsForAdmin).mockResolvedValue(page([blog]));
    vi.mocked(blogApi.updateBlogStatus).mockResolvedValue({ ...blog, status: "PUBLISHED" });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Derby preview")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /publish derby preview/i }));

    expect(screen.getByRole("dialog", { name: /publish blog post/i })).toBeInTheDocument();
    expect(screen.getByText(/this post will become visible/i)).toBeInTheDocument();
    expect(blogApi.updateBlogStatus).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog", { name: /publish blog post/i })).not.toBeInTheDocument();
    expect(blogApi.updateBlogStatus).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /publish derby preview/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm publish/i }));

    await waitFor(() => {
      expect(blogApi.updateBlogStatus).toHaveBeenCalledWith(1, "PUBLISHED");
    });
  });

  it("asks for confirmation before deleting a blog post", async () => {
    vi.mocked(blogApi.getAllBlogsForAdmin).mockResolvedValue(page([blog]));
    vi.mocked(blogApi.deleteBlog).mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Derby preview")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(screen.getByRole("dialog", { name: /delete blog post/i })).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    expect(blogApi.deleteBlog).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("dialog", { name: /delete blog post/i })).not.toBeInTheDocument();
    expect(blogApi.deleteBlog).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => {
      expect(blogApi.deleteBlog).toHaveBeenCalledWith(1);
    });
  });
});
