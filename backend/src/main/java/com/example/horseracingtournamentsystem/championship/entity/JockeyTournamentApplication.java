package com.example.horseracingtournamentsystem.championship.entity;

import com.example.horseracingtournamentsystem.championship.enums.JockeyApplicationStatus;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jockey_id", nullable = false)
    private User jockey;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private JockeyApplicationStatus status;

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
        application.status = JockeyApplicationStatus.PENDING;
        application.createdAt = LocalDateTime.now();
        return application;
    }

    public void approve(User reviewer) {
        ensurePendingForReview();
        this.status = JockeyApplicationStatus.APPROVED_FOR_POOL;
        this.reviewedBy = reviewer;
        this.reviewedAt = LocalDateTime.now();
        this.rejectionReason = null;
        this.updatedAt = LocalDateTime.now();
    }

    public void reject(User reviewer, String reason) {
        ensurePendingForReview();
        this.status = JockeyApplicationStatus.REJECTED;
        this.reviewedBy = reviewer;
        this.reviewedAt = LocalDateTime.now();
        this.rejectionReason = reason;
        this.updatedAt = LocalDateTime.now();
    }

    public void withdraw() {
        if (JockeyApplicationStatus.PENDING != this.status) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending pool applications can be withdrawn");
        }
        this.status = JockeyApplicationStatus.WITHDRAWN;
        this.withdrawnAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void resubmit(String message) {
        if (JockeyApplicationStatus.REJECTED != this.status && JockeyApplicationStatus.WITHDRAWN != this.status) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only rejected or withdrawn pool applications can be resubmitted");
        }
        this.status = JockeyApplicationStatus.PENDING;
        this.message = message;
        this.reviewedBy = null;
        this.reviewedAt = null;
        this.rejectionReason = null;
        this.withdrawnAt = null;
        this.updatedAt = LocalDateTime.now();
    }

    private void ensurePendingForReview() {
        if (JockeyApplicationStatus.PENDING != this.status) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending pool applications can be reviewed");
        }
    }
}
