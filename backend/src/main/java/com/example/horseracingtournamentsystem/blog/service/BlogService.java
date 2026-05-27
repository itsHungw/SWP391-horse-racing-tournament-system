package com.example.horseracingtournamentsystem.blog.service;

import com.example.horseracingtournamentsystem.blog.dto.BlogResponse;
import com.example.horseracingtournamentsystem.blog.dto.CreateBlogRequest;
import com.example.horseracingtournamentsystem.blog.dto.UpdateBlogRequest;
import com.example.horseracingtournamentsystem.blog.entity.Blog;
import com.example.horseracingtournamentsystem.blog.entity.BlogStatus;
import com.example.horseracingtournamentsystem.blog.repository.BlogRepository;
import com.example.horseracingtournamentsystem.blog.utils.SlugUtils;
import com.example.horseracingtournamentsystem.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BlogService {
    private final BlogRepository blogRepository;

    public Page<BlogResponse> getPublishedBlogs(String search, Pageable pageable) {
        Page<Blog> blogs;
        if (search != null && !search.isBlank()) {
            blogs = blogRepository.findByStatusAndTitleContainingIgnoreCase(BlogStatus.PUBLISHED, search, pageable);
        } else {
            blogs = blogRepository.findByStatus(BlogStatus.PUBLISHED, pageable);
        }
        return blogs.map(BlogResponse::from);
    }

    public BlogResponse getPublishedBlogBySlug(String slug) {
        Blog blog = blogRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Blog post not found with slug: " + slug));
        if (blog.getStatus() != BlogStatus.PUBLISHED) {
            throw new IllegalArgumentException("Requested blog post is not published.");
        }
        return BlogResponse.from(blog);
    }

    public Page<BlogResponse> getAllBlogsForAdmin(String search, Pageable pageable) {
        Page<Blog> blogs;
        if (search != null && !search.isBlank()) {
            blogs = blogRepository.findByTitleContainingIgnoreCase(search, pageable);
        } else {
            blogs = blogRepository.findAll(pageable);
        }
        return blogs.map(BlogResponse::from);
    }

    @Transactional
    public BlogResponse createBlog(CreateBlogRequest request, User author) {
        String slug = generateUniqueSlug(request.title());
        BlogStatus status = BlogStatus.valueOf(request.status().toUpperCase());
        Blog blog = Blog.create(
            request.title(),
            slug,
            request.summary(),
            request.content(),
            request.thumbnail(),
            status,
            author
        );
        return BlogResponse.from(blogRepository.save(blog));
    }

    @Transactional
    public BlogResponse updateBlog(Long id, UpdateBlogRequest request) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Blog post not found with id: " + id));
        
        String slug = blog.getSlug();
        if (!blog.getTitle().equalsIgnoreCase(request.title())) {
            slug = generateUniqueSlug(request.title());
        }

        BlogStatus status = BlogStatus.valueOf(request.status().toUpperCase());
        blog.update(
            request.title(),
            slug,
            request.summary(),
            request.content(),
            request.thumbnail(),
            status
        );
        return BlogResponse.from(blogRepository.save(blog));
    }

    @Transactional
    public BlogResponse updateStatus(Long id, String statusStr) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Blog post not found with id: " + id));
        BlogStatus status = BlogStatus.valueOf(statusStr.toUpperCase());
        blog.updateStatus(status);
        return BlogResponse.from(blogRepository.save(blog));
    }

    @Transactional
    public void deleteBlog(Long id) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Blog post not found with id: " + id));
        blogRepository.delete(blog);
    }

    private String generateUniqueSlug(String title) {
        String baseSlug = SlugUtils.toSlug(title);
        String slug = baseSlug;
        while (blogRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + UUID.randomUUID().toString().substring(0, 6);
        }
        return slug;
    }
}
