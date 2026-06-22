package com.example.horseracingtournamentsystem.user.entity;

import com.example.horseracingtournamentsystem.user.enums.RoleRequestStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "role_requests")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RoleRequest {

    public static final String CV_REVIEW_NOT_REVIEWED = "NOT_REVIEWED";
    public static final String CV_REVIEW_PASSED = "PASSED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "requested_role", nullable = false, length = 50)
    private String requestedRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RoleRequestStatus status;

    @Lob
    @Column(name = "reason")
    private String reason;

    @Column(name = "resume_url", length = 500)
    private String resumeUrl;

    @Column(name = "cv_review_status", nullable = false, length = 30)
    private String cvReviewStatus;

    @Lob
    @Column(name = "cv_review_note")
    private String cvReviewNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cv_reviewed_by")
    private User cvReviewedBy;

    @Column(name = "cv_reviewed_at")
    private LocalDateTime cvReviewedAt;

    @Lob
    @Column(name = "admin_note")
    private String adminNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static RoleRequest pending(User user, String requestedRole, String reason, String resumeUrl) {
        RoleRequest request = new RoleRequest();
        request.user = user;
        request.requestedRole = requestedRole;
        request.status = RoleRequestStatus.PENDING;
        request.cvReviewStatus = CV_REVIEW_NOT_REVIEWED;
        request.reason = reason;
        request.resumeUrl = resumeUrl;
        request.createdAt = LocalDateTime.now();
        return request;
    }

    public void passCvReview(User reviewer, String note) {
        LocalDateTime now = LocalDateTime.now();
        this.cvReviewStatus = CV_REVIEW_PASSED;
        this.cvReviewNote = note;
        this.cvReviewedBy = reviewer;
        this.cvReviewedAt = now;
        this.updatedAt = now;
    }

    public void approve(User reviewer, String adminNote) {
        review(RoleRequestStatus.APPROVED, reviewer, adminNote);
    }

    public void reject(User reviewer, String adminNote) {
        review(RoleRequestStatus.REJECTED, reviewer, adminNote);
    }

    public void cancel() {
        this.status = RoleRequestStatus.CANCELLED;
        this.updatedAt = LocalDateTime.now();
    }

    private void review(RoleRequestStatus status, User reviewer, String adminNote) {
        LocalDateTime now = LocalDateTime.now();
        this.status = status;
        this.adminNote = adminNote;
        this.reviewedBy = reviewer;
        this.reviewedAt = now;
        this.updatedAt = now;
    }
}
