package com.example.horseracingtournamentsystem.championship.entity;

import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
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
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Entity
@Table(
        name = "jockey_tournament_applications",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_jockey_tournament_applications_tournament_jockey",
                columnNames = {"tournament_id", "jockey_id"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class JockeyTournamentApplication {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED_FOR_POOL = "APPROVED_FOR_POOL";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_WITHDRAWN = "WITHDRAWN";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jockey_id", nullable = false)
    private User jockey;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "message", length = 500)
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "withdrawn_at")
    private LocalDateTime withdrawnAt;

    public static JockeyTournamentApplication pending(Tournament tournament, User jockey, String message) {
        JockeyTournamentApplication application = new JockeyTournamentApplication();
        application.tournament = tournament;
        application.jockey = jockey;
        application.message = message;
        application.status = STATUS_PENDING;
        application.createdAt = LocalDateTime.now();
        return application;
    }

    public void approve(User reviewer) {
        ensurePendingForReview();
        this.status = STATUS_APPROVED_FOR_POOL;
        this.reviewedBy = reviewer;
        this.reviewedAt = LocalDateTime.now();
        this.rejectionReason = null;
        this.updatedAt = LocalDateTime.now();
    }

    public void reject(User reviewer, String reason) {
        ensurePendingForReview();
        this.status = STATUS_REJECTED;
        this.reviewedBy = reviewer;
        this.reviewedAt = LocalDateTime.now();
        this.rejectionReason = reason;
        this.updatedAt = LocalDateTime.now();
    }

    public void withdraw() {
        if (!STATUS_PENDING.equals(this.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending pool applications can be withdrawn");
        }
        this.status = STATUS_WITHDRAWN;
        this.withdrawnAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    private void ensurePendingForReview() {
        if (!STATUS_PENDING.equals(this.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending pool applications can be reviewed");
        }
    }
}
