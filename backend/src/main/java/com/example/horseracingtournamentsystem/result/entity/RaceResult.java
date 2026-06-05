package com.example.horseracingtournamentsystem.result.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "race_results")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RaceResult {

    public static final String RESULT_STATUS_FINISHED = "FINISHED";
    public static final String RESULT_STATUS_DISQUALIFIED = "DISQUALIFIED";
    public static final String RESULT_STATUS_DID_NOT_FINISH = "DID_NOT_FINISH";
    public static final String RESULT_STATUS_WITHDRAWN = "WITHDRAWN";

    public static final String STATUS_DRAFT = "DRAFT";
    public static final String STATUS_SUBMITTED = "SUBMITTED";
    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_PUBLISHED = "PUBLISHED";
    public static final String STATUS_REJECTED = "REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "race_id", nullable = false)
    private Long raceId;

    @Column(name = "participant_id", nullable = false)
    private Long participantId; // Trỏ sang race_participants.id

    @Column(name = "position")
    private Integer position; // NULL for DISQUALIFIED/DID_NOT_FINISH

    @Column(name = "finish_time_seconds")
    private Double finishTimeSeconds;

    @Column(name = "result_status", nullable = false, length = 30)
    private String resultStatus;

    @Column(name = "points", nullable = false)
    private Integer points = 0;

    @Column(name = "prize_points", nullable = false)
    private Integer prizePoints = 0;

    @Column(name = "note")
    private String note;

    @Column(name = "submitted_by", nullable = false)
    private Long submittedBy;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "confirmed_by")
    private Long confirmedBy;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "status", nullable = false, length = 30)
    private String status = STATUS_DRAFT;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static RaceResult create(Long raceId, Long participantId, Integer position, String resultStatus, Long submittedBy) {
        RaceResult result = new RaceResult();
        result.setRaceId(raceId);
        result.setParticipantId(participantId);
        result.setPosition(position);
        result.setResultStatus(resultStatus);
        result.setSubmittedBy(submittedBy);
        result.setSubmittedAt(LocalDateTime.now());
        result.setCreatedAt(LocalDateTime.now());
        result.setStatus(STATUS_DRAFT);
        return result;
    }
}
