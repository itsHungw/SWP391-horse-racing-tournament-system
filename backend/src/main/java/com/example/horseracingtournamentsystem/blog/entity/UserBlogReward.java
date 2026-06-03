package com.example.horseracingtournamentsystem.blog.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "user_blog_rewards",
        uniqueConstraints = @UniqueConstraint(name = "uq_user_blog_reward", columnNames = {"user_id", "blog_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserBlogReward {

    public static final String STATUS_CLAIMED = "CLAIMED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blog_id", nullable = false)
    private Blog blog;

    @Column(name = "points_earned", nullable = false)
    private int pointsEarned;

    @Column(name = "reading_seconds", nullable = false)
    private int readingSeconds;

    @Column(name = "scroll_percent", nullable = false)
    private int scrollPercent;

    @Column(name = "reward_status", nullable = false, length = 30)
    private String rewardStatus;

    @Column(name = "earned_at", nullable = false)
    private LocalDateTime earnedAt;

    public static UserBlogReward claimed(
            User user,
            Blog blog,
            int pointsEarned,
            int readingSeconds,
            int scrollPercent
    ) {
        UserBlogReward reward = new UserBlogReward();
        reward.user = user;
        reward.blog = blog;
        reward.pointsEarned = pointsEarned;
        reward.readingSeconds = readingSeconds;
        reward.scrollPercent = scrollPercent;
        reward.rewardStatus = STATUS_CLAIMED;
        reward.earnedAt = LocalDateTime.now();
        return reward;
    }
}
