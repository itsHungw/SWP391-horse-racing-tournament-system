package com.example.horseracingtournamentsystem.blog.controller;

import com.example.horseracingtournamentsystem.blog.dto.BlogResponse;
import com.example.horseracingtournamentsystem.blog.dto.CreateBlogRequest;
import com.example.horseracingtournamentsystem.blog.dto.UpdateBlogRequest;
import com.example.horseracingtournamentsystem.blog.dto.UpdateBlogStatusRequest;
import com.example.horseracingtournamentsystem.blog.service.BlogService;
import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/blogs")
@RequiredArgsConstructor
public class AdminBlogController {
    private final BlogService blogService;

    @GetMapping
    public ResponseEntity<Page<BlogResponse>> getAllBlogsForAdmin(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(blogService.getAllBlogsForAdmin(search, pageable));
    }

    @PostMapping
    public ResponseEntity<BlogResponse> createBlog(
            @Valid @RequestBody CreateBlogRequest request,
            @AuthenticationPrincipal User author
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(blogService.createBlog(request, author));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BlogResponse> updateBlog(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBlogRequest request
    ) {
        return ResponseEntity.ok(blogService.updateBlog(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BlogResponse> updateBlogStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBlogStatusRequest request
    ) {
        return ResponseEntity.ok(blogService.updateStatus(id, request.status()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBlog(@PathVariable Long id) {
        blogService.deleteBlog(id);
        return ResponseEntity.noContent().build();
    }
}
