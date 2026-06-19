package com.example.horseracingtournamentsystem.race.entity;

import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "races")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Race {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "round_name", length = 100)
    private String roundName;

    @Column(name = "race_number")
    private Integer raceNumber;

    @Column(name = "track_name", length = 150)
    private String trackName;

    @Column(name = "track_condition", length = 50)
    private String trackCondition;

    @Column(name = "note")
    private String note;

    @Column(name = "race_at", nullable = false)
    private LocalDateTime raceAt;

    @Column(name = "distance_meter", nullable = false)
    private Integer distanceMeter;

    @Column(name = "max_participants", nullable = false)
    private Integer maxParticipants;

    @Column(name = "min_participants", nullable = false)
    private Integer minParticipants;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private RaceStatus status; // SCHEDULED / CHECKING / READY / ONGOING / FINISHED / RESULT_SUBMITTED / RESULT_CONFIRMED / PUBLISHED / CANCELLED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referee_id")
    private User referee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public static Race create(Tournament tournament, String name, String code, LocalDateTime raceAt, 
                               Integer distanceMeter, Integer maxParticipants, User creator) {
        Race race = new Race();
        race.tournament = tournament;
        race.name = name;
        race.code = code;
        race.raceAt = raceAt;
        race.distanceMeter = distanceMeter;
        race.maxParticipants = maxParticipants;
        race.minParticipants = 2; // Default constraint
        race.status = RaceStatus.SCHEDULED;
        race.createdBy = creator;
        race.createdAt = LocalDateTime.now();
        return race;
    }

    public void update(Tournament tournament, String name, LocalDateTime raceAt, Integer distanceMeter, Integer maxParticipants) {
        this.tournament = tournament;
        this.name = name;
        this.raceAt = raceAt;
        this.distanceMeter = distanceMeter;
        this.maxParticipants = maxParticipants;
        this.updatedAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = RaceStatus.CANCELLED;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateStatus(RaceStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public void assignReferee(User referee) {
        this.referee = referee;
        this.updatedAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}
