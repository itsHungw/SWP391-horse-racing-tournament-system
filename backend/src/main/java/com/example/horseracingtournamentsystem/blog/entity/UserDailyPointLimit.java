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
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "user_daily_point_limits",
        uniqueConstraints = @UniqueConstraint(name = "uq_user_daily_point", columnNames = {"user_id", "point_date"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserDailyPointLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "point_date", nullable = false)
    private LocalDate pointDate;

    @Column(name = "points_earned_from_blog", nullable = false)
    private int pointsEarnedFromBlog;

    @Column(name = "points_earned_total", nullable = false)
    private int pointsEarnedTotal;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static UserDailyPointLimit create(User user, LocalDate pointDate) {
        UserDailyPointLimit limit = new UserDailyPointLimit();
        limit.user = user;
        limit.pointDate = pointDate;
        limit.pointsEarnedFromBlog = 0;
        limit.pointsEarnedTotal = 0;
        limit.createdAt = LocalDateTime.now();
        return limit;
    }

    public void addBlogPoints(int points) {
        if (points <= 0) {
            throw new IllegalArgumentException("Point amount must be greater than 0.");
        }
        this.pointsEarnedFromBlog += points;
        this.pointsEarnedTotal += points;
        this.updatedAt = LocalDateTime.now();
    }
}
