import { FormEvent, useEffect, useState } from "react";
import { resolveFileUrl } from "../../utils/fileUrl";
import { Link, useNavigate, useParams } from "react-router-dom";

import { blogApi } from "../../api/blogApi";
import { AdminLayout } from "../../layouts/AdminLayout";
import { Blog } from "../../types/blog";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

type BlogStatus = "DRAFT" | "PUBLISHED";

const emptyMessage = "Not set";

export function AdminBlogFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  useDocumentTitle(isEditMode ? "Edit blog post" : "New blog post");

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [status, setStatus] = useState<BlogStatus>("DRAFT");
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode || !id) {
      return;
    }

    let isMounted = true;

    async function loadBlog() {
      try {
        setLoading(true);
        setError(null);
        const page = await blogApi.getAllBlogsForAdmin(undefined, 0, 100);
        const current = page.content.find((blog: Blog) => blog.id === Number(id));
        if (!current) {
          throw new Error("Blog post not found.");
        }
        if (!isMounted) {
          return;
        }
        setTitle(current.title);
        setSummary(current.summary || "");
        setContent(current.content);
        setThumbnail(current.thumbnail);
        setStatus(current.status);
      } catch (err) {
        console.error("Blog edit load failed.", err);
        if (isMounted) {
          setError("Could not load this blog post for editing.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBlog();

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  const handleUploadThumbnail = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const response = await blogApi.uploadBlogThumbnail(file);
      setThumbnail(response.url);
    } catch (err) {
      console.error("Thumbnail upload failed.", err);
      setError("Could not upload the thumbnail image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      thumbnail,
      status,
    };

    try {
      setSaving(true);
      setError(null);
      if (isEditMode && id) {
        await blogApi.updateBlog(Number(id), payload);
      } else {
        await blogApi.createBlog(payload);
      }
      navigate("/admin/blog");
    } catch (err) {
      console.error("Blog save failed.", err);
      setError("Could not save this blog post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <section aria-labelledby="admin-blog-form-title" className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-[#d8d8d8] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b3193a]">
              Content operations
            </p>
            <h1 id="admin-blog-form-title" className="mt-2 text-4xl font-black tracking-tight">
              {isEditMode ? "Edit Blog Post" : "Create Blog Post"}
            </h1>
            <p className="mt-2 max-w-3xl text-base text-slate-600">
              Prepare public articles for race context, tournament news, and spectator engagement.
            </p>
          </div>
          <Link
            className="flex min-h-11 items-center justify-center rounded-md border border-[#070f4f] bg-white px-5 text-sm font-black text-[#070f4f] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
            to="/admin/blog"
          >
            Back to Blog
          </Link>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4" role="alert">
            <p className="text-sm font-bold text-rose-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-lg border border-[#d8d8d8] bg-white py-16">
            <p className="text-sm font-bold text-slate-500">Loading blog post...</p>
          </div>
        ) : (
          <form className="grid gap-6 xl:grid-cols-[1fr_340px]" onSubmit={handleSave}>
            <section className="rounded-lg border border-[#d8d8d8] bg-white p-6" aria-labelledby="blog-content-title">
              <h2 id="blog-content-title" className="border-b border-[#ececec] pb-3 text-lg font-black">
                Article Content
              </h2>
              <div className="mt-5 space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500" htmlFor="blog-title">
                    Title
                  </label>
                  <input
                    className="mt-2 min-h-11 w-full rounded-md border border-[#bdbdbd] bg-white px-3 text-sm font-bold text-[#171717] shadow-sm focus:border-[#b3193a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a]"
                    id="blog-title"
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    type="text"
                    value={title}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500" htmlFor="blog-summary">
                    Summary
                  </label>
                  <textarea
                    className="mt-2 w-full rounded-md border border-[#bdbdbd] bg-white px-3 py-2 text-sm font-medium leading-6 text-[#171717] shadow-sm focus:border-[#b3193a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a]"
                    id="blog-summary"
                    onChange={(event) => setSummary(event.target.value)}
                    rows={3}
                    value={summary}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500" htmlFor="blog-content">
                    Content
                  </label>
                  <textarea
                    className="mt-2 min-h-[360px] w-full rounded-md border border-[#bdbdbd] bg-white px-3 py-3 font-mono text-sm leading-6 text-[#171717] shadow-sm focus:border-[#b3193a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a]"
                    id="blog-content"
                    onChange={(event) => setContent(event.target.value)}
                    required
                    value={content}
                  />
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-lg border border-[#d8d8d8] bg-white p-5" aria-labelledby="publish-title">
                <h2 id="publish-title" className="border-b border-[#ececec] pb-3 text-lg font-black">
                  Publish Settings
                </h2>
                <div className="mt-5 space-y-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500" htmlFor="blog-status">
                      Status
                    </label>
                    <select
                      className="mt-2 min-h-11 w-full rounded-md border border-[#bdbdbd] bg-white px-3 text-sm font-black text-[#171717] shadow-sm focus:border-[#b3193a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b3193a]"
                      id="blog-status"
                      onChange={(event) => setStatus(event.target.value as BlogStatus)}
                      value={status}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Current thumbnail</p>
                    <div className="mt-2 overflow-hidden rounded-md border border-[#ececec] bg-[#fafafa]">
                      {thumbnail ? (
                        <img alt="Thumbnail preview" className="h-40 w-full object-cover" src={resolveFileUrl(thumbnail)} />
                      ) : (
                        <div className="flex h-40 items-center justify-center px-4 text-center text-sm font-bold text-slate-500">
                          {emptyMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500" htmlFor="blog-thumbnail">
                      Thumbnail image
                    </label>
                    <input
                      accept="image/*"
                      className="mt-2 block w-full text-sm font-bold text-slate-700 file:mr-4 file:min-h-11 file:rounded-md file:border-0 file:bg-[#070f4f] file:px-4 file:text-sm file:font-black file:text-white hover:file:bg-[#101a70] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
                      id="blog-thumbnail"
                      onChange={handleUploadThumbnail}
                      type="file"
                    />
                    {uploading && (
                      <p className="mt-2 text-sm font-bold text-slate-500" role="status">
                        Uploading thumbnail...
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-3 rounded-lg border border-[#d8d8d8] bg-white p-5">
                <button
                  className="min-h-11 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={saving || uploading}
                  type="submit"
                >
                  {saving ? "Saving..." : "Save Post"}
                </button>
                <Link
                  className="flex min-h-11 items-center justify-center rounded-md border border-[#070f4f] bg-white px-5 text-sm font-black text-[#070f4f] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
                  to="/admin/blog"
                >
                  Cancel
                </Link>
              </div>
            </aside>
          </form>
        )}
      </section>
    </AdminLayout>
  );
}
