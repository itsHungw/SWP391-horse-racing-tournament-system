import axios from 'axios';
import { Blog, CreateBlogRequest, UpdateBlogRequest, PageResponse } from '../types/blog';

const API_URL = '/api/v1';

export const blogApi = {
  // Public APIs
  getPublishedBlogs: async (search?: string, page = 0, size = 9) => {
    const response = await axios.get<PageResponse<Blog>>(`${API_URL}/blogs`, {
      params: { search, page, size }
    });
    return response.data;
  },

  getPublishedBlogBySlug: async (slug: string) => {
    const response = await axios.get<Blog>(`${API_URL}/blogs/${slug}`);
    return response.data;
  },

  // Admin APIs
  getAllBlogsForAdmin: async (search?: string, page = 0, size = 10) => {
    const response = await axios.get<PageResponse<Blog>>(`${API_URL}/admin/blogs`, {
      params: { search, page, size }
    });
    return response.data;
  },

  createBlog: async (data: CreateBlogRequest) => {
    const response = await axios.post<Blog>(`${API_URL}/admin/blogs`, data);
    return response.data;
  },

  updateBlog: async (id: number, data: UpdateBlogRequest) => {
    const response = await axios.put<Blog>(`${API_URL}/admin/blogs/${id}`, data);
    return response.data;
  },

  updateBlogStatus: async (id: number, status: 'DRAFT' | 'PUBLISHED') => {
    const response = await axios.patch<Blog>(`${API_URL}/admin/blogs/${id}/status`, { status });
    return response.data;
  },

  deleteBlog: async (id: number) => {
    await axios.delete(`${API_URL}/admin/blogs/${id}`);
  }
};
