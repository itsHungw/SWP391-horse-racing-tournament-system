import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogApi } from '../../api/blogApi';
import { Blog } from '../../types/blog';

export function SpectatorBlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      blogApi.getPublishedBlogBySlug(slug)
        .then(setBlog)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) return <div className="p-8 text-gray-600 dark:text-gray-300">Loading post...</div>;
  if (!blog) return <div className="p-8 text-gray-600 dark:text-gray-300">Post not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/blogs" className="text-indigo-600 dark:text-indigo-400 hover:underline mb-6 block">&larr; Back to Blogs</Link>
      {blog.thumbnail && (
        <img src={blog.thumbnail} alt={blog.title} className="w-full h-80 object-cover rounded-lg mb-6 shadow" />
      )}
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">{blog.title}</h1>
      <div className="text-gray-500 text-sm mb-6">
        By {blog.authorName} &bull; {new Date(blog.createdAt).toLocaleDateString()}
      </div>
      <div 
        className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
        dangerouslySetInnerHTML={{ __html: blog.content }} 
      />
    </div>
  );
}
