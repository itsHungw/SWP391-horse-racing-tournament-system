package com.example.horseracingtournamentsystem.tournament.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tournaments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tournament {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "description")
    private String description;

    @Column(name = "location", nullable = false, length = 255)
    private String location;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "registration_start_at", nullable = false)
    private LocalDateTime registrationStartAt;

    @Column(name = "registration_end_at", nullable = false)
    private LocalDateTime registrationEndAt;

    @Column(name = "max_horses")
    private Integer maxHorses;

    @Column(name = "status", nullable = false, length = 40)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public static Tournament create(String name, String code, String description, String location, 
                                    LocalDate startDate, LocalDate endDate, LocalDateTime regStart, 
                                    LocalDateTime regEnd, Integer maxHorses, User creator) {
        Tournament tournament = new Tournament();
        tournament.name = name;
        tournament.code = code;
        tournament.description = description;
        tournament.location = location;
        tournament.startDate = startDate;
        tournament.endDate = endDate;
        tournament.registrationStartAt = regStart;
        tournament.registrationEndAt = regEnd;
        tournament.maxHorses = maxHorses;
        tournament.status = "DRAFT";
        tournament.createdBy = creator;
        tournament.createdAt = LocalDateTime.now();
        return tournament;
    }

    public void update(String name, String description, String location, LocalDate startDate, LocalDate endDate,
                       LocalDateTime regStart, LocalDateTime regEnd, Integer maxHorses) {
        this.name = name;
        this.description = description;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.registrationStartAt = regStart;
        this.registrationEndAt = regEnd;
        this.maxHorses = maxHorses;
        this.updatedAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = "CANCELLED";
        this.updatedAt = LocalDateTime.now();
    }

    public void openRegistration() {
        this.status = "OPEN_REGISTRATION";
        this.updatedAt = LocalDateTime.now();
    }

    public void closeRegistration() {
        this.status = "CLOSED_REGISTRATION";
        this.updatedAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}
