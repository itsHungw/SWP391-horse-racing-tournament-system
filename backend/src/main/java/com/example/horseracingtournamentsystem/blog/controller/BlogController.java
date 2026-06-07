package com.example.horseracingtournamentsystem.blog.controller;

import com.example.horseracingtournamentsystem.blog.dto.BlogRewardClaimRequest;
import com.example.horseracingtournamentsystem.blog.dto.BlogRewardClaimResponse;
import com.example.horseracingtournamentsystem.blog.dto.BlogResponse;
import com.example.horseracingtournamentsystem.blog.service.BlogRewardService;
import com.example.horseracingtournamentsystem.blog.service.BlogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/blogs")
@RequiredArgsConstructor
public class BlogController {
    private final BlogService blogService;
    private final BlogRewardService blogRewardService;

    @GetMapping
    public ResponseEntity<Page<BlogResponse>> getPublishedBlogs(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "9") int size
      ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(blogService.getPublishedBlogs(search, pageable));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<BlogResponse> getPublishedBlogBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(blogService.getPublishedBlogBySlug(slug));
    }

    @PostMapping("/{slug}/claim-reward")
    public ResponseEntity<BlogRewardClaimResponse> claimReward(
            @PathVariable String slug,
            @Valid @RequestBody BlogRewardClaimRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(blogRewardService.claimReward(slug, authentication.getName(), request));
    }
}
