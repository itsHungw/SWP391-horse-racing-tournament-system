import { Blog, CreateBlogRequest, UpdateBlogRequest, PageResponse } from '../types/blog';
import { httpClient } from './httpClient';

export const blogApi = {
  // Public APIs
  getPublishedBlogs: async (search?: string, page = 0, size = 9) => {
    const response = await httpClient.get<PageResponse<Blog>>('/blogs', {
      params: { search, page, size }
    });
    return response.data;
  },

  getPublishedBlogBySlug: async (slug: string) => {
    const response = await httpClient.get<Blog>(`/blogs/${slug}`);
    return response.data;
  },

  // Admin APIs
  getAllBlogsForAdmin: async (search?: string, page = 0, size = 10) => {
    const response = await httpClient.get<PageResponse<Blog>>('/admin/blogs', {
      params: { search, page, size }
    });
    return response.data;
  },

  createBlog: async (data: CreateBlogRequest) => {
    const response = await httpClient.post<Blog>('/admin/blogs', data);
    return response.data;
  },

  updateBlog: async (id: number, data: UpdateBlogRequest) => {
    const response = await httpClient.put<Blog>(`/admin/blogs/${id}`, data);
    return response.data;
  },

  updateBlogStatus: async (id: number, status: 'DRAFT' | 'PUBLISHED') => {
    const response = await httpClient.patch<Blog>(`/admin/blogs/${id}/status`, { status });
    return response.data;
  },

  deleteBlog: async (id: number) => {
    await httpClient.delete(`/admin/blogs/${id}`);
  },

  uploadBlogThumbnail: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await httpClient.post<{ url: string }>('/files/upload?category=BLOG', formData);
    return response.data;
  }
};
