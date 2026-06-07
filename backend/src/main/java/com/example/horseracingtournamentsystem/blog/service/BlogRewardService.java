package com.example.horseracingtournamentsystem.blog.service;

import com.example.horseracingtournamentsystem.blog.dto.BlogRewardClaimRequest;
import com.example.horseracingtournamentsystem.blog.dto.BlogRewardClaimResponse;
import com.example.horseracingtournamentsystem.blog.entity.Blog;
import com.example.horseracingtournamentsystem.blog.entity.BlogStatus;
import com.example.horseracingtournamentsystem.blog.entity.UserBlogReward;
import com.example.horseracingtournamentsystem.blog.entity.UserDailyPointLimit;
import com.example.horseracingtournamentsystem.blog.repository.BlogRepository;
import com.example.horseracingtournamentsystem.blog.repository.UserBlogRewardRepository;
import com.example.horseracingtournamentsystem.blog.repository.UserDailyPointLimitRepository;
import com.example.horseracingtournamentsystem.point.entity.PointSettingKey;
import com.example.horseracingtournamentsystem.point.entity.PointTransactionType;
import com.example.horseracingtournamentsystem.point.service.PointAccountService;
import com.example.horseracingtournamentsystem.point.service.PointSettingsService;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class BlogRewardService {

    private static final String BLOG_REFERENCE_TYPE = "BLOG";

    private final BlogRepository blogRepository;
    private final UserRepository userRepository;
    private final UserBlogRewardRepository userBlogRewardRepository;
    private final UserDailyPointLimitRepository userDailyPointLimitRepository;
    private final PointSettingsService pointSettingsService;
    private final PointAccountService pointAccountService;

    @Transactional
    public BlogRewardClaimResponse claimReward(String slug, String userEmail, BlogRewardClaimRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        Blog blog = blogRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Blog post not found"));

        if (blog.getStatus() != BlogStatus.PUBLISHED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only published blogs can reward points.");
        }

        int balance = pointAccountService.getExistingBalanceOrZero(user);
        if (userBlogRewardRepository.existsByUserIdAndBlogId(user.getId(), blog.getId())) {
            return BlogRewardClaimResponse.alreadyClaimed(balance);
        }

        int rewardPoints = pointSettingsService.getInt(PointSettingKey.BLOG_REWARD_POINTS);
        int dailyLimit = pointSettingsService.getInt(PointSettingKey.DAILY_BLOG_REWARD_LIMIT);
        if (rewardPoints <= 0 || dailyLimit <= 0) {
            return BlogRewardClaimResponse.dailyLimitReached(balance);
        }

        UserDailyPointLimit dailyPointLimit = getOrCreateDailyPointLimit(user, LocalDate.now());
        if (dailyPointLimit.getPointsEarnedFromBlog() + rewardPoints > dailyLimit) {
            return BlogRewardClaimResponse.dailyLimitReached(balance);
        }

        dailyPointLimit.addBlogPoints(rewardPoints);
        userDailyPointLimitRepository.save(dailyPointLimit);

        int updatedBalance = pointAccountService.credit(
                user,
                rewardPoints,
                PointTransactionType.BLOG_REWARD,
                BLOG_REFERENCE_TYPE,
                blog.getId(),
                "Blog reward: " + blog.getTitle()
        );
        userBlogRewardRepository.save(UserBlogReward.claimed(
                user,
                blog,
                rewardPoints,
                request.readingSeconds(),
                request.scrollPercent()
        ));

        return BlogRewardClaimResponse.claimed(rewardPoints, updatedBalance);
    }

    private UserDailyPointLimit getOrCreateDailyPointLimit(User user, LocalDate pointDate) {
        return userDailyPointLimitRepository.findByUserIdAndPointDate(user.getId(), pointDate)
                .orElseGet(() -> userDailyPointLimitRepository.save(UserDailyPointLimit.create(user, pointDate)));
    }
}
