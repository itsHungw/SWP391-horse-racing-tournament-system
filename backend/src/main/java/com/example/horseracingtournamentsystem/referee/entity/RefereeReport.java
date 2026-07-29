package com.example.horseracingtournamentsystem.referee.entity;

import com.example.horseracingtournamentsystem.race.entity.Race;
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
        name = "referee_reports",
        uniqueConstraints = @UniqueConstraint(name = "uq_race_referee_report", columnNames = {"race_id", "referee_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefereeReport {

    public static final String STATUS_SUBMITTED = "SUBMITTED";
    public static final String STATUS_CONFIRMED = "CONFIRMED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "referee_id", nullable = false)
    private User referee;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "summary", nullable = false)
    private String summary;

    @Column(name = "ai_summary")
    private String aiSummary;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by")
    private User confirmedBy;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static RefereeReport create(Race race, User referee) {
        RefereeReport report = new RefereeReport();
        report.race = race;
        report.referee = referee;
        report.createdAt = LocalDateTime.now();
        report.status = STATUS_SUBMITTED;
        return report;
    }

    public void submit(String title, String summary, String status) {
        this.title = title;
        this.summary = summary == null || summary.isBlank() ? "Race report submitted." : summary;
        this.status = status;
        // Nộp lại là đã xử lý xong lý do bị trả về trước đó.
        this.rejectionReason = null;
        this.submittedAt = LocalDateTime.now();
        this.updatedAt = this.submittedAt;
    }

    /**
     * BR-16: Ban tổ chức trả hồ sơ về cho trọng tài sửa, kèm lý do.
     * Lý do thuộc về cả gói kết quả nên lưu ở đây, KHÔNG ghi đè note của từng ngựa.
     */
    public void markReturned(String reason) {
        this.rejectionReason = reason;
        this.status = STATUS_SUBMITTED;
        this.updatedAt = LocalDateTime.now();
    }

    public void confirm(User admin) {
        this.status = STATUS_CONFIRMED;
        this.confirmedBy = admin;
        this.confirmedAt = LocalDateTime.now();
        this.updatedAt = this.confirmedAt;
    }
}
