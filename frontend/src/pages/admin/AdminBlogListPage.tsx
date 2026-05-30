import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

export function AdminBlogListPage() {
  useDocumentTitle("Admin blog");

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

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

  const handleToggleStatus = async (blog: Blog) => {
    const targetStatus = blog.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setProcessingId(blog.id);
    try {
      const updated = await blogApi.updateBlogStatus(blog.id, targetStatus);
      setBlogs((current) => current.map((item) => (item.id === blog.id ? updated : item)));
    } catch (err) {
      console.error("Blog status update failed.", err);
      setError("Could not update this blog post status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (blog: Blog) => {
    if (!window.confirm(`Delete "${blog.title}"?`)) {
      return;
    }

    setProcessingId(blog.id);
    try {
      await blogApi.deleteBlog(blog.id);
      setBlogs((current) => current.filter((item) => item.id !== blog.id));
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b3193a]">
              Content operations
            </p>
            <h1 id="admin-blog-title" className="mt-2 text-4xl font-black tracking-tight">
              Blog Workspace
            </h1>
            <p className="mt-2 max-w-3xl text-base text-slate-600">
              Manage race previews, spectator education posts, and publishing readiness for the public blog.
            </p>
          </div>

          <Link
            className="flex min-h-11 items-center justify-center rounded-md bg-[#a6ff3f] px-5 text-sm font-black text-[#07110d] hover:bg-[#c4ff72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
            to="/admin/blog/new"
          >
            New Post
          </Link>
        </div>

        <div className="rounded-lg border border-[#d8d8d8] bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full max-w-lg">
              <label className="sr-only" htmlFor="admin-blog-search">
                Search article titles
              </label>
              <input
                className="h-11 w-full rounded-md border border-[#bdbdbd] bg-white px-3 text-sm font-bold text-slate-700 shadow-sm focus:border-[#b3193a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a]"
                id="admin-blog-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search article titles..."
                type="search"
                value={search}
              />
            </div>
            <button
              className="min-h-11 rounded-md border border-[#070f4f] bg-white px-4 text-sm font-black text-[#070f4f] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
              onClick={loadBlogs}
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4" role="alert">
            <p className="text-sm font-bold text-rose-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-lg border border-[#d8d8d8] bg-white py-16">
            <p className="text-sm font-bold text-slate-500">Loading blog posts...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#bdbdbd] bg-white py-16 text-center">
            <p className="text-sm font-bold text-slate-500">No blog posts match this search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#d8d8d8] bg-white">
            <table className="min-w-full divide-y divide-[#ececec] text-left text-sm text-slate-700">
              <thead className="bg-[#f7f7f7] text-xs font-black uppercase tracking-[0.14em] text-slate-500">
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
                              src={blog.thumbnail}
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
    </AdminLayout>
  );
}
