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
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "race_results",
        uniqueConstraints = @UniqueConstraint(name = "uq_race_participant_result", columnNames = {"race_id", "participant_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RaceResult {

    public static final String STATUS_SUBMITTED = "SUBMITTED";
    public static final String STATUS_CONFIRMED = "CONFIRMED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participant_id", nullable = false)
    private RaceParticipant participant;

    @Column(name = "position")
    private Integer position;

    @Column(name = "raw_finish_time_seconds", precision = 10, scale = 3)
    private BigDecimal rawFinishTimeSeconds;

    @Column(name = "penalty_seconds", nullable = false, precision = 10, scale = 3)
    private BigDecimal penaltySeconds = BigDecimal.ZERO;

    @Column(name = "finish_time_seconds", precision = 10, scale = 3)
    private BigDecimal finishTimeSeconds;

    @Column(name = "result_status", nullable = false, length = 30)
    private String resultStatus;

    @Column(name = "points", nullable = false)
    private int points;

    @Column(name = "prize_points", nullable = false)
    private int prizePoints;

    @Column(name = "note")
    private String note;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submitted_by", nullable = false)
    private User submittedBy;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by")
    private User confirmedBy;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static RaceResult create(Race race, RaceParticipant participant, User submitter) {
        RaceResult result = new RaceResult();
        result.race = race;
        result.participant = participant;
        result.submittedBy = submitter;
        result.createdAt = LocalDateTime.now();
        result.submittedAt = result.createdAt;
        result.status = STATUS_SUBMITTED;
        result.resultStatus = "FINISHED";
        return result;
    }

    public void submit(
            Integer position,
            BigDecimal rawFinishTimeSeconds,
            BigDecimal penaltySeconds,
            BigDecimal finishTimeSeconds,
            String resultStatus,
            String status,
            User referee,
            String note
    ) {
        this.position = position;
        this.rawFinishTimeSeconds = rawFinishTimeSeconds;
        this.penaltySeconds = penaltySeconds == null ? BigDecimal.ZERO : penaltySeconds;
        this.finishTimeSeconds = finishTimeSeconds;
        this.resultStatus = resultStatus;
        this.status = status;
        this.submittedBy = referee;
        this.note = note;
        this.submittedAt = LocalDateTime.now();
        this.updatedAt = this.submittedAt;
        if (STATUS_CONFIRMED.equals(status)) {
            this.confirmedBy = referee;
            this.confirmedAt = this.submittedAt;
        } else {
            this.confirmedBy = null;
            this.confirmedAt = null;
        }
    }
}
