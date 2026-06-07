package com.example.horseracingtournamentsystem.referee.entity;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
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
        name = "pre_race_checks",
        uniqueConstraints = @UniqueConstraint(name = "uq_race_participant_check", columnNames = {"race_id", "participant_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PreRaceCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant_id", nullable = false)
    private RaceParticipant participant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "referee_id", nullable = false)
    private User referee;

    @Column(name = "horse_identity_ok", nullable = false)
    private boolean horseIdentityOk;

    @Column(name = "jockey_identity_ok", nullable = false)
    private boolean jockeyIdentityOk;

    @Column(name = "equipment_ok", nullable = false)
    private boolean equipmentOk;

    @Column(name = "health_ok", nullable = false)
    private boolean healthOk;

    @Column(name = "weight_ok", nullable = false)
    private boolean weightOk;

    @Column(name = "result", nullable = false, length = 30)
    private String result;

    @Column(name = "note")
    private String note;

    @Column(name = "checked_at", nullable = false)
    private LocalDateTime checkedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static PreRaceCheck create(Race race, RaceParticipant participant, User referee) {
        PreRaceCheck check = new PreRaceCheck();
        check.race = race;
        check.participant = participant;
        check.referee = referee;
        check.createdAt = LocalDateTime.now();
        check.checkedAt = check.createdAt;
        return check;
    }

    public void update(
            boolean horseIdentityOk,
            boolean jockeyIdentityOk,
            boolean equipmentOk,
            boolean healthOk,
            boolean weightOk,
            String result,
            String note
    ) {
        this.horseIdentityOk = horseIdentityOk;
        this.jockeyIdentityOk = jockeyIdentityOk;
        this.equipmentOk = equipmentOk;
        this.healthOk = healthOk;
        this.weightOk = weightOk;
        this.result = result;
        this.note = note;
        this.checkedAt = LocalDateTime.now();
    }
}
