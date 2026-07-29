package com.example.horseracingtournamentsystem.result.entity;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus;
import com.example.horseracingtournamentsystem.result.enums.ResultRecordStatus;
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
        name = "race_results",
        uniqueConstraints = @UniqueConstraint(name = "uq_race_participant_result", columnNames = {"race_id", "participant_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RaceResult {


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

    @Enumerated(EnumType.STRING)
    @Column(name = "result_status", nullable = false, length = 30)
    private ResultFinishStatus resultStatus;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ResultRecordStatus status;

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
        result.status = ResultRecordStatus.SUBMITTED;
        result.resultStatus = ResultFinishStatus.FINISHED;
        return result;
    }

    public void submit(
            Integer position,
            BigDecimal rawFinishTimeSeconds,
            BigDecimal penaltySeconds,
            BigDecimal finishTimeSeconds,
            ResultFinishStatus resultStatus,
            ResultRecordStatus status,
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
        if (ResultRecordStatus.CONFIRMED == status) {
            this.confirmedBy = referee;
            this.confirmedAt = this.submittedAt;
        } else {
            this.confirmedBy = null;
            this.confirmedAt = null;
        }

        this.points = 0;
        if (ResultFinishStatus.FINISHED == resultStatus && position != null) {
            switch (position) {
                case 1 -> this.points = 25;
                case 2 -> this.points = 18;
                case 3 -> this.points = 15;
                case 4 -> this.points = 12;
                case 5 -> this.points = 10;
                case 6 -> this.points = 8;
                case 7 -> this.points = 6;
                case 8 -> this.points = 4;
                case 9 -> this.points = 2;
                case 10 -> this.points = 1;
                default -> this.points = 0;
            }
        }
    }

    /** BR-16: Ban tổ chức (hoặc admin khi tranh chấp) chốt kết quả referee đã nộp. */
    public void confirm(User confirmer) {
        this.status = ResultRecordStatus.CONFIRMED;
        this.confirmedBy = confirmer;
        this.confirmedAt = LocalDateTime.now();
        this.updatedAt = this.confirmedAt;
    }

    /** Lên bảng chính thức: kết quả đã chốt -> công khai cho khán giả + cộng điểm standings. */
    public void publish() {
        this.status = ResultRecordStatus.PUBLISHED;
        this.publishedAt = LocalDateTime.now();
        this.updatedAt = this.publishedAt;
    }

    public Long getRaceId() {
        return race.getId();
    }

    public Long getParticipantId() {
        return participant.getId();
    }

    public Long getSubmittedById() {
        return submittedBy.getId();
    }

    public Long getConfirmedById() {
        return confirmedBy == null ? null : confirmedBy.getId();
    }
}
