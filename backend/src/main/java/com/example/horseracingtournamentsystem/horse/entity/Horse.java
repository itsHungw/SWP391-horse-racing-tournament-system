package com.example.horseracingtournamentsystem.horse.entity;

import com.example.horseracingtournamentsystem.horse.dto.request.OwnerHorseRequest;
import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Entity
@Table(name = "horses")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Horse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "registration_code", length = 100, unique = true)
    private String registrationCode;

    @Column(name = "breed", length = 100)
    private String breed;

    @Column(name = "gender", nullable = false, length = 20)
    private String gender; // MALE / FEMALE

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "color", length = 50)
    private String color;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Column(name = "weight_kg")
    private Integer weightKg;

    @Column(name = "health_status", length = 50)
    private String healthStatus;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "evidence_url", length = 500)
    private String evidenceUrl;

    @Column(name = "medical_note")
    private String medicalNote;

    @Column(name = "description")
    private String description;

    @Column(name = "status", nullable = false, length = 30)
    private String status; // PENDING / APPROVED / REJECTED / INACTIVE / SUSPENDED

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public static Horse create(User owner, String name, String registrationCode, String breed, 
                               String gender, LocalDate dateOfBirth, String color) {
        Horse horse = new Horse();
        horse.owner = owner;
        horse.name = name;
        horse.registrationCode = registrationCode;
        horse.breed = breed;
        horse.gender = gender;
        horse.dateOfBirth = dateOfBirth;
        horse.color = color;
        horse.status = "APPROVED"; // Default as APPROVED (ACTIVE) for direct admin actions
        horse.createdAt = LocalDateTime.now();
        return horse;
    }

    public static Horse submitForReview(User owner, OwnerHorseRequest request, String registrationCode) {
        Horse horse = new Horse();
        horse.owner = owner;
        horse.name = request.name();
        horse.registrationCode = registrationCode;
        horse.breed = request.breed();
        horse.gender = request.gender();
        horse.dateOfBirth = request.dateOfBirth();
        horse.color = request.color();
        horse.heightCm = request.heightCm();
        horse.weightKg = request.weightKg();
        horse.healthStatus = request.healthStatus();
        horse.imageUrl = request.imageUrl();
        horse.evidenceUrl = request.evidenceUrl();
        horse.medicalNote = request.medicalNote();
        horse.description = request.description();
        horse.status = "PENDING";
        horse.createdAt = LocalDateTime.now();
        return horse;
    }

    public void update(String name, String breed, String gender, LocalDate dateOfBirth, String color) {
        this.name = name;
        this.breed = breed;
        this.gender = gender;
        this.dateOfBirth = dateOfBirth;
        this.color = color;
        this.updatedAt = LocalDateTime.now();
    }

    public void approve(User reviewer) {
        requirePendingReview();
        this.status = "APPROVED";
        this.approvedBy = reviewer;
        this.approvedAt = LocalDateTime.now();
        this.rejectionReason = null;
        this.updatedAt = LocalDateTime.now();
    }

    public void reject(String reason) {
        requirePendingReview();
        this.status = "REJECTED";
        this.rejectionReason = reason;
        this.approvedBy = null;
        this.approvedAt = null;
        this.updatedAt = LocalDateTime.now();
    }

    public void setInactive() {
        this.status = "INACTIVE";
        this.updatedAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    private void requirePendingReview() {
        if (!"PENDING".equals(this.status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending horses can be reviewed");
        }
    }
}
