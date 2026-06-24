export interface Blog {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnail: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateBlogRequest {
  title: string;
  summary: string;
  content: string;
  thumbnail: string | null;
  status: 'DRAFT' | 'PUBLISHED';
}

export interface UpdateBlogRequest {
  title: string;
  summary: string;
  content: string;
  thumbnail: string | null;
  status: 'DRAFT' | 'PUBLISHED';
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
