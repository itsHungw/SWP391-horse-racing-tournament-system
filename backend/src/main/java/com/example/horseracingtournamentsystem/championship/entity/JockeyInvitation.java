package com.example.horseracingtournamentsystem.championship.entity;

import com.example.horseracingtournamentsystem.championship.enums.JockeyInvitationStatus;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournamentregistration.entity.TournamentRegistration;
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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Entity
@Table(name = "jockey_invitations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class JockeyInvitation {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tournament_registration_id", nullable = false)
    private TournamentRegistration tournamentRegistration;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jockey_application_id", nullable = false)
    private JockeyTournamentApplication jockeyApplication;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "horse_id", nullable = false)
    private Horse horse;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jockey_id", nullable = false)
    private User jockey;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private JockeyInvitationStatus status;

    @Column(name = "message", length = 500)
    private String message;

    @Column(name = "agreement_url", length = 500)
    private String agreementUrl;

    @Column(name = "agreement_file_name", length = 255)
    private String agreementFileName;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static JockeyInvitation pending(
            TournamentRegistration registration,
            JockeyTournamentApplication application,
            String message,
            String agreementUrl,
            String agreementFileName
    ) {
        JockeyInvitation invitation = new JockeyInvitation();
        invitation.tournament = registration.getTournament();
        invitation.tournamentRegistration = registration;
        invitation.jockeyApplication = application;
        invitation.horse = registration.getHorse();
        invitation.owner = registration.getOwner();
        invitation.jockey = application.getJockey();
        invitation.status = JockeyInvitationStatus.PENDING;
        invitation.message = message;
        invitation.agreementUrl = agreementUrl;
        invitation.agreementFileName = agreementFileName;
        invitation.createdAt = LocalDateTime.now();
        return invitation;
    }

    public void accept(String jockeyEmail) {
        ensureOwnedByJockey(jockeyEmail);
        ensurePending();
        this.status = JockeyInvitationStatus.ACCEPTED;
        this.acceptedAt = LocalDateTime.now();
        if (this.readAt == null) {
            this.readAt = this.acceptedAt;
        }
        this.updatedAt = this.acceptedAt;
    }

    public void reject(String jockeyEmail, String reason) {
        ensureOwnedByJockey(jockeyEmail);
        ensurePending();
        this.status = JockeyInvitationStatus.REJECTED;
        this.rejectedAt = LocalDateTime.now();
        this.rejectionReason = reason;
        if (this.readAt == null) {
            this.readAt = this.rejectedAt;
        }
        this.updatedAt = this.rejectedAt;
    }

    private void ensureOwnedByJockey(String jockeyEmail) {
        if (!this.jockey.getEmail().equals(jockeyEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only review your own contracts");
        }
    }

    private void ensurePending() {
        if (JockeyInvitationStatus.PENDING != this.status) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending contracts can be reviewed");
        }
    }
}
