package com.example.horseracingtournamentsystem.championship.entity;

import com.example.horseracingtournamentsystem.championship.enums.TournamentParticipantStatus;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournamentregistration.entity.TournamentRegistration;
import com.example.horseracingtournamentsystem.tournamentregistration.enums.RegistrationStatus;
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
        name = "tournament_participants",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "UQ_tournament_participants_tournament_horse",
                        columnNames = {"tournament_id", "horse_id"}
                ),
                @UniqueConstraint(
                        name = "UQ_tournament_participants_tournament_jockey",
                        columnNames = {"tournament_id", "jockey_id"}
                )
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TournamentParticipant {


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
    @JoinColumn(name = "horse_id", nullable = false)
    private Horse horse;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jockey_id", nullable = false)
    private User jockey;

    @Column(name = "jockey_invitation_id")
    private Long jockeyInvitationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private TournamentParticipantStatus status;

    @Column(name = "points", nullable = false)
    private Integer points;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static TournamentParticipant active(
            TournamentRegistration registration,
            User jockey,
            Long jockeyInvitationId
    ) {
        if (RegistrationStatus.APPROVED != registration.getStatus()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only approved horse registrations can become tournament participants");
        }
        TournamentParticipant participant = new TournamentParticipant();
        participant.tournament = registration.getTournament();
        participant.tournamentRegistration = registration;
        participant.horse = registration.getHorse();
        participant.owner = registration.getOwner();
        participant.jockey = jockey;
        participant.jockeyInvitationId = jockeyInvitationId;
        participant.status = TournamentParticipantStatus.ACTIVE;
        participant.points = 0;
        participant.createdAt = LocalDateTime.now();
        return participant;
    }

    public void withdraw() {
        this.status = TournamentParticipantStatus.WITHDRAWN;
        this.updatedAt = LocalDateTime.now();
    }

    public void disqualify() {
        this.status = TournamentParticipantStatus.DISQUALIFIED;
        this.updatedAt = LocalDateTime.now();
    }

    public void addPoints(int earnedPoints) {
        this.points += earnedPoints;
        this.updatedAt = LocalDateTime.now();
    }
}
