import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { blogApi } from '../../api/blogApi';

export function AdminBlogFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      blogApi.getAllBlogsForAdmin()
        .then((page) => {
          const current = page.content.find((b) => b.id === Number(id));
          if (current) {
            setTitle(current.title);
            setSummary(current.summary);
            setContent(current.content);
            setThumbnail(current.thumbnail);
            setStatus(current.status);
          }
        })
        .catch(console.error);
    }
  }, [id, isEditMode]);

  const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'BLOG');

    try {
      setUploading(true);
      const response = await axios.post<{ url: string }>('/api/v1/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setThumbnail(response.data.url);
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { title, summary, content, thumbnail, status };
    try {
      if (isEditMode) {
        await blogApi.updateBlog(Number(id), payload);
      } else {
        await blogApi.createBlog(payload);
      }
      navigate('/admin/blog');
    } catch (err) {
      console.error(err);
      alert("Failed to save post.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {isEditMode ? "Edit Blog Post" : "Create New Blog Post"}
      </h1>
      <form onSubmit={handleSave} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-950 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-950 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Thumbnail</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleUploadThumbnail}
            className="w-full dark:text-gray-300"
          />
          {uploading && <p className="text-sm text-gray-400 mt-1">Uploading...</p>}
          {thumbnail && (
            <img src={thumbnail} className="mt-4 h-32 w-48 object-cover rounded shadow" alt="Preview" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Content</label>
          <textarea
            required
            placeholder="Write your rich HTML content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-950 dark:text-white dark:border-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={12}
          />
          <p className="text-xs text-gray-400 mt-1">Rich Content Text Block support. HTML characters accepted.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED')}
            className="px-4 py-2 border rounded-lg dark:bg-gray-950 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
        </div>
        <div className="flex space-x-4 pt-4 border-t dark:border-gray-700">
          <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition duration-200">
            Save Post
          </button>
          <Link to="/admin/blog" className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
