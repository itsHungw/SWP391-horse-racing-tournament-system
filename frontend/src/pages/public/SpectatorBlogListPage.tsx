import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogApi } from '../../api/blogApi';
import { Blog } from '../../types/blog';

export function SpectatorBlogListPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogs();
  }, [search]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const data = await blogApi.getPublishedBlogs(search);
      setBlogs(data.content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Latest Tournament Updates & Blogs</h1>
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search blog posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
        />
      </div>
      {loading ? (
        <div className="text-gray-600 dark:text-gray-300">Loading blogs...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div key={blog.id} className="border rounded-lg overflow-hidden flex flex-col bg-white dark:bg-gray-800 shadow">
              {blog.thumbnail && (
                <img src={blog.thumbnail} alt={blog.title} className="h-48 w-full object-cover" />
              )}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{blog.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{blog.summary}</p>
                </div>
                <Link to={`/blogs/${blog.slug}`} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                  Read More &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
