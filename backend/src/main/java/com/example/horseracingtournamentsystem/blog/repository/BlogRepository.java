package com.example.horseracingtournamentsystem.blog.repository;

import com.example.horseracingtournamentsystem.blog.entity.Blog;
import com.example.horseracingtournamentsystem.blog.entity.BlogStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long> {
    Optional<Blog> findBySlug(String slug);
    boolean existsBySlug(String slug);
    Page<Blog> findByStatus(BlogStatus status, Pageable pageable);
    Page<Blog> findByStatusAndTitleContainingIgnoreCase(BlogStatus status, String title, Pageable pageable);
    Page<Blog> findByTitleContainingIgnoreCase(String title, Pageable pageable);
}
