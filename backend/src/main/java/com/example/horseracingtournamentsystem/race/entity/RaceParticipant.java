package com.example.horseracingtournamentsystem.race.entity;

import com.example.horseracingtournamentsystem.championship.entity.JockeyInvitation;
import com.example.horseracingtournamentsystem.championship.entity.TournamentParticipant;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.race.enums.ParticipantCheckStatus;
import com.example.horseracingtournamentsystem.race.enums.ParticipantConfirmationStatus;
import com.example.horseracingtournamentsystem.race.enums.ParticipantStatus;
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
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "race_participants",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_race_horse",
                        columnNames = {"race_id", "horse_id"}
                )
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RaceParticipant {



    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "horse_id", nullable = false)
    private Horse horse;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jockey_id")
    private User jockey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitation_id")
    private JockeyInvitation invitation;

    @Column(name = "start_number")
    private Integer startNumber;

    @Column(name = "lane_number")
    private Integer laneNumber;

    @Column(name = "weight_carried_kg", precision = 5, scale = 2)
    private BigDecimal weightCarriedKg;

    @Enumerated(EnumType.STRING)
    @Column(name = "confirmation_status", nullable = false, length = 30)
    private ParticipantConfirmationStatus confirmationStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "check_status", nullable = false, length = 30)
    private ParticipantCheckStatus checkStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ParticipantStatus status;

    @Column(name = "base_win_probability", precision = 5, scale = 4)
    private BigDecimal baseWinProbability = new BigDecimal("0.1000");

    @Column(name = "check_note")
    private String checkNote;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static RaceParticipant registered(
            Race race,
            TournamentParticipant tournamentParticipant,
            JockeyInvitation invitation
    ) {
        RaceParticipant participant = new RaceParticipant();
        participant.race = race;
        participant.horse = tournamentParticipant.getHorse();
        participant.owner = tournamentParticipant.getOwner();
        participant.jockey = tournamentParticipant.getJockey();
        participant.invitation = invitation;
        participant.confirmationStatus = ParticipantConfirmationStatus.PENDING;
        participant.checkStatus = ParticipantCheckStatus.NOT_CHECKED;
        participant.status = ParticipantStatus.REGISTERED;
        participant.createdAt = LocalDateTime.now();
        return participant;
    }

    public void updateCheck(ParticipantCheckStatus checkStatus, ParticipantStatus participantStatus, String note) {
        this.checkStatus = checkStatus;
        this.status = participantStatus;
        this.checkNote = note;
        this.updatedAt = LocalDateTime.now();
    }

    public void setBaseWinProbability(BigDecimal baseWinProbability) {
        this.baseWinProbability = baseWinProbability;
    }
}
