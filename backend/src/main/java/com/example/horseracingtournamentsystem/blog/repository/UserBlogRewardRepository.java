package com.example.horseracingtournamentsystem.blog.repository;

import com.example.horseracingtournamentsystem.blog.entity.UserBlogReward;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBlogRewardRepository extends JpaRepository<UserBlogReward, Long> {
    boolean existsByUserIdAndBlogId(Long userId, Long blogId);
}
