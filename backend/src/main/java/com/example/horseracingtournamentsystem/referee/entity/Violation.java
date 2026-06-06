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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "violations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Violation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id")
    private RaceParticipant participant;

    @Column(name = "violation_type", length = 100)
    private String violationType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reported_by", nullable = false)
    private User reportedBy;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "penalty", length = 150)
    private String penalty;

    @Column(name = "severity", length = 30)
    private String severity;

    @Column(name = "occurred_at")
    private LocalDateTime occurredAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static Violation create(
            Race race,
            RaceParticipant participant,
            User reportedBy,
            String violationType,
            String description,
            String penalty,
            String severity
    ) {
        Violation violation = new Violation();
        violation.race = race;
        violation.participant = participant;
        violation.reportedBy = reportedBy;
        violation.violationType = violationType;
        violation.description = description;
        violation.penalty = penalty;
        violation.severity = severity;
        violation.occurredAt = LocalDateTime.now();
        violation.createdAt = violation.occurredAt;
        return violation;
    }
}
