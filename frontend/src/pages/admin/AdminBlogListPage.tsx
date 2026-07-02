import { useCallback, useEffect, useState } from "react";
import { resolveFileUrl } from "../../utils/fileUrl";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

import { blogApi } from "../../api/blogApi";
import { AdminLayout } from "../../layouts/AdminLayout";
import { Blog } from "../../types/blog";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

function statusClasses(status: Blog["status"]) {
  return status === "PUBLISHED"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

type PendingStatusChange = {
  blog: Blog;
  targetStatus: Blog["status"];
};

export function AdminBlogListPage() {
  useDocumentTitle("Admin blog");

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [blogPendingStatusChange, setBlogPendingStatusChange] = useState<PendingStatusChange | null>(null);
  const [blogPendingDelete, setBlogPendingDelete] = useState<Blog | null>(null);

  const loadBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await blogApi.getAllBlogsForAdmin(search);
      setBlogs(Array.isArray(data.content) ? data.content : []);
    } catch (err) {
      console.error("Admin blog API unavailable.", err);
      setBlogs([]);
      setError("Could not load blog posts from the server.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const handleToggleStatus = (blog: Blog) => {
    const targetStatus = blog.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setBlogPendingStatusChange({ blog, targetStatus });
  };

  const handleCancelStatusChange = () => {
    if (processingId !== null) {
      return;
    }

    setBlogPendingStatusChange(null);
  };

  const handleConfirmStatusChange = async () => {
    if (!blogPendingStatusChange) {
      return;
    }

    const { blog, targetStatus } = blogPendingStatusChange;
    setProcessingId(blog.id);
    try {
      const updated = await blogApi.updateBlogStatus(blog.id, targetStatus);
      setBlogs((current) => current.map((item) => (item.id === blog.id ? updated : item)));
      setBlogPendingStatusChange(null);
    } catch (err) {
      console.error("Blog status update failed.", err);
      setError("Could not update this blog post status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = (blog: Blog) => {
    setBlogPendingDelete(blog);
  };

  const handleCancelDelete = () => {
    if (processingId !== null) {
      return;
    }

    setBlogPendingDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!blogPendingDelete) {
      return;
    }

    const blog = blogPendingDelete;
    setProcessingId(blog.id);
    try {
      await blogApi.deleteBlog(blog.id);
      setBlogs((current) => current.filter((item) => item.id !== blog.id));
      setBlogPendingDelete(null);
    } catch (err) {
      console.error("Blog delete failed.", err);
      setError("Could not delete this blog post.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout>
      <section aria-labelledby="admin-blog-title" className="space-y-6">
        {/* Title Header Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b3193a]">
              Content operations
            </p>
            <h1 id="admin-blog-title" className="mt-2 text-3xl font-black tracking-tight text-[#070f4f]">
              Blog Workspace
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Manage race previews, spectator education posts, and publishing readiness for the public blog.
            </p>
          </div>

          <Link
            className="flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a] transition"
            to="/admin/blog/new"
          >
            New Post
          </Link>
        </div>

        {/* Operations Filter Bar */}
        <div className="grid gap-4 md:grid-cols-[1fr_120px] bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          {/* Search box */}
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="admin-blog-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search article titles..."
              type="search"
              value={search}
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#b3193a] focus:ring-2 focus:ring-[#b3193a]/10"
            />
          </div>

          {/* Refresh Button */}
          <button
            className="min-h-11 w-full rounded-lg border border-[#070f4f] bg-white px-4 text-xs font-black uppercase tracking-wider text-[#070f4f] hover:bg-slate-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
            onClick={loadBlogs}
            type="button"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4" role="alert">
            <p className="text-sm font-bold text-rose-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
            <p className="text-sm font-bold text-slate-500">Loading blog posts...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-350 bg-slate-50/50 py-16 text-center">
            <p className="text-sm font-bold text-slate-500">No blog posts match this search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-[#ececec] text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-6 py-3">Post</th>
                  <th className="px-6 py-3">Author</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec] bg-white">
                {blogs.map((blog) => {
                  const targetStatus = blog.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

                  return (
                    <tr className="transition-colors hover:bg-[#fafafa]" key={blog.id}>
                      <td className="px-6 py-4">
                        <div className="flex min-w-[280px] items-center gap-4">
                          {blog.thumbnail ? (
                            <img
                              alt=""
                              className="h-14 w-20 rounded-md border border-[#ececec] object-cover"
                              src={resolveFileUrl(blog.thumbnail)}
                            />
                          ) : (
                            <div className="flex h-14 w-20 items-center justify-center rounded-md border border-dashed border-[#bdbdbd] bg-[#fafafa] text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                              No image
                            </div>
                          )}
                          <div>
                            <p className="font-black text-[#171717]">{blog.title}</p>
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">{blog.summary || "No summary"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-600">{blog.authorName}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-black ${statusClasses(blog.status)}`}>
                          {blog.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">{formatDate(blog.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            aria-label={`${targetStatus === "PUBLISHED" ? "Publish" : "Unpublish"} ${blog.title}`}
                            className="min-h-11 rounded-md border border-[#006d5b] bg-white px-3 text-xs font-black text-[#006d5b] hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={processingId === blog.id}
                            onClick={() => handleToggleStatus(blog)}
                            type="button"
                          >
                            {targetStatus === "PUBLISHED" ? "Publish" : "Unpublish"}
                          </button>
                          <Link
                            className="flex min-h-11 items-center rounded-md border border-[#070f4f] bg-white px-3 text-xs font-black text-[#070f4f] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
                            to={`/admin/blog/edit/${blog.id}`}
                          >
                            Edit
                          </Link>
                          <button
                            className="min-h-11 rounded-md bg-[#b3193a] px-3 text-xs font-black text-white hover:bg-[#8f1430] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={processingId === blog.id}
                            onClick={() => handleDelete(blog)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {blogPendingStatusChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <section
            aria-labelledby="status-blog-title"
            aria-modal="true"
            className="w-full max-w-md rounded-lg border border-[#d8d8d8] bg-white p-6 shadow-xl"
            role="dialog"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#006d5b]">
              Publishing action
            </p>
            <h2 id="status-blog-title" className="mt-2 text-2xl font-black text-[#171717]">
              {blogPendingStatusChange.targetStatus === "PUBLISHED" ? "Publish Blog Post" : "Unpublish Blog Post"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {blogPendingStatusChange.targetStatus === "PUBLISHED"
                ? `This post will become visible on public blog pages: "${blogPendingStatusChange.blog.title}".`
                : `This post will move back to draft and disappear from public blog pages: "${blogPendingStatusChange.blog.title}".`}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="min-h-11 rounded-md border border-[#070f4f] bg-white px-4 text-sm font-black text-[#070f4f] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={processingId === blogPendingStatusChange.blog.id}
                onClick={handleCancelStatusChange}
                type="button"
              >
                Cancel
              </button>
              <button
                className="min-h-11 rounded-md bg-[#006d5b] px-4 text-sm font-black text-white hover:bg-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={processingId === blogPendingStatusChange.blog.id}
                onClick={handleConfirmStatusChange}
                type="button"
              >
                {processingId === blogPendingStatusChange.blog.id
                  ? blogPendingStatusChange.targetStatus === "PUBLISHED"
                    ? "Publishing..."
                    : "Unpublishing..."
                  : blogPendingStatusChange.targetStatus === "PUBLISHED"
                    ? "Confirm Publish"
                    : "Confirm Unpublish"}
              </button>
            </div>
          </section>
        </div>
      )}

      {blogPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <section
            aria-labelledby="delete-blog-title"
            aria-modal="true"
            className="w-full max-w-md rounded-lg border border-[#d8d8d8] bg-white p-6 shadow-xl"
            role="dialog"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b3193a]">
              Destructive action
            </p>
            <h2 id="delete-blog-title" className="mt-2 text-2xl font-black text-[#171717]">
              Delete Blog Post
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This action cannot be undone. The blog post "{blogPendingDelete.title}" will be removed from the admin
              workspace and public blog pages.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="min-h-11 rounded-md border border-[#070f4f] bg-white px-4 text-sm font-black text-[#070f4f] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={processingId === blogPendingDelete.id}
                onClick={handleCancelDelete}
                type="button"
              >
                Cancel
              </button>
              <button
                className="min-h-11 rounded-md bg-[#b3193a] px-4 text-sm font-black text-white hover:bg-[#8f1430] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={processingId === blogPendingDelete.id}
                onClick={handleConfirmDelete}
                type="button"
              >
                {processingId === blogPendingDelete.id ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
