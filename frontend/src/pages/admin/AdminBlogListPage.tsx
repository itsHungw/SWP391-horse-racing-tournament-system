import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogApi } from '../../api/blogApi';
import { Blog } from '../../types/blog';

export function AdminBlogListPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogs();
  }, [search]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const data = await blogApi.getAllBlogsForAdmin(search);
      setBlogs(data.content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (blog: Blog) => {
    const targetStatus = blog.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await blogApi.updateBlogStatus(blog.id, targetStatus);
      loadBlogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      try {
        await blogApi.deleteBlog(id);
        loadBlogs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Blogs Workspace</h1>
        <Link to="/admin/blog/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg">
          Create Blog Post
        </Link>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search article titles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
        />
      </div>
      {loading ? (
        <div className="text-gray-600 dark:text-gray-300">Loading articles...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border rounded-lg overflow-hidden shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Thumbnail</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Title</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Author</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Created At</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              {blogs.map((blog) => (
                <tr key={blog.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {blog.thumbnail ? (
                      <img src={blog.thumbnail} className="h-10 w-16 object-cover rounded" alt="" />
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{blog.title}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-300">{blog.authorName}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleStatus(blog)}
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        blog.status === 'PUBLISHED' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {blog.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-300">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link to={`/admin/blog/edit/${blog.id}`} className="text-indigo-600 hover:text-indigo-950 font-medium mr-2">Edit</Link>
                    <button onClick={() => handleDelete(blog.id)} className="text-red-600 hover:text-red-950 font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
