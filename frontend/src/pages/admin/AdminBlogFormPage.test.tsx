import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { blogApi } from "../../api/blogApi";
import type { Blog, PageResponse } from "../../types/blog";
import { AdminBlogFormPage } from "./AdminBlogFormPage";

vi.mock("../../api/blogApi", () => ({
  blogApi: {
    getAllBlogsForAdmin: vi.fn(),
    createBlog: vi.fn(),
    updateBlog: vi.fn(),
    uploadBlogThumbnail: vi.fn(),
  },
}));

const blog: Blog = {
  id: 4,
  title: "Track notes",
  slug: "track-notes",
  summary: "Surface conditions",
  content: "Detailed race surface notes",
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
    totalPages: 1,
    size: 10,
    number: 0,
  };
}

function renderForm(initialEntry = "/admin/blog/new") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/admin/blog/new" element={<AdminBlogFormPage />} />
        <Route path="/admin/blog/edit/:id" element={<AdminBlogFormPage />} />
        <Route path="/admin/blog" element={<div>Blog index</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminBlogFormPage", () => {
  it("creates a blog post through the blog API inside the admin layout", async () => {
    vi.mocked(blogApi.createBlog).mockResolvedValue(blog);

    renderForm();

    expect(screen.getByText(/tournament control/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "Track notes" } });
    fireEvent.change(screen.getByLabelText(/summary/i), { target: { value: "Surface conditions" } });
    fireEvent.change(screen.getByLabelText(/^content$/i), { target: { value: "Detailed race surface notes" } });
    fireEvent.click(screen.getByRole("button", { name: /save post/i }));

    await waitFor(() => {
      expect(blogApi.createBlog).toHaveBeenCalledWith({
        title: "Track notes",
        summary: "Surface conditions",
        content: "Detailed race surface notes",
        thumbnail: null,
        status: "DRAFT",
      });
    });
    expect(await screen.findByText("Blog index")).toBeInTheDocument();
  });

  it("loads an existing blog into the edit form", async () => {
    vi.mocked(blogApi.getAllBlogsForAdmin).mockResolvedValue(page([blog]));

    renderForm("/admin/blog/edit/4");

    await waitFor(() => {
      expect(screen.getByDisplayValue("Track notes")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Surface conditions")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Detailed race surface notes")).toBeInTheDocument();
  });

  it("uploads a thumbnail through the blog API", async () => {
    const file = new File(["image"], "track.jpg", { type: "image/jpeg" });
    vi.mocked(blogApi.uploadBlogThumbnail).mockResolvedValue({ url: "/api/v1/files/download/track.jpg" });

    renderForm();

    fireEvent.change(screen.getByLabelText(/thumbnail image/i), { target: { files: [file] } });

    await waitFor(() => {
      expect(blogApi.uploadBlogThumbnail).toHaveBeenCalledWith(file);
    });
    expect(await screen.findByAltText(/thumbnail preview/i)).toHaveAttribute(
      "src",
      "/api/v1/files/download/track.jpg",
    );
  });
});
