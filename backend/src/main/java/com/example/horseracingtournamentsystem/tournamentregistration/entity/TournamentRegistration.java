package com.example.horseracingtournamentsystem.tournamentregistration.entity;

import com.example.horseracingtournamentsystem.horse.entity.Horse;
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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Entity
@Table(name = "tournament_registrations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TournamentRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "horse_id", nullable = false)
    private Horse horse;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "note")
    private String note;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "withdrawn_at")
    private LocalDateTime withdrawnAt;

    public static TournamentRegistration pending(Tournament tournament, Horse horse, User owner, String note) {
        TournamentRegistration registration = new TournamentRegistration();
        registration.tournament = tournament;
        registration.horse = horse;
        registration.owner = owner;
        registration.note = note;
        registration.status = "PENDING";
        registration.createdAt = LocalDateTime.now();
        return registration;
    }

    public void approve(User reviewer) {
        ensurePendingForReview();
        this.status = "APPROVED";
        this.reviewedBy = reviewer;
        this.reviewedAt = LocalDateTime.now();
        this.rejectionReason = null;
        this.updatedAt = LocalDateTime.now();
    }

    public void reject(User reviewer, String reason) {
        ensurePendingForReview();
        this.status = "REJECTED";
        this.reviewedBy = reviewer;
        this.reviewedAt = LocalDateTime.now();
        this.rejectionReason = reason;
        this.updatedAt = LocalDateTime.now();
    }

    public void withdraw() {
        if (!"PENDING".equals(this.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending registrations can be withdrawn");
        }
        this.status = "WITHDRAWN";
        this.withdrawnAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    private void ensurePendingForReview() {
        if (!"PENDING".equals(this.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending registrations can be reviewed");
        }
    }
}
