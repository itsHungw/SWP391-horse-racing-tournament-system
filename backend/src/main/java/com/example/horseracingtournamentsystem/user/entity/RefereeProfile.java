package com.example.horseracingtournamentsystem.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "referee_profiles")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefereeProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(name = "certification", length = 255)
    private String certification;

    @Column(name = "experience_years", nullable = false)
    private int experienceYears;

    @Lob
    @Column(name = "bio")
    private String bio;

    @Column(name = "evidence_url", length = 500)
    private String evidenceUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RefereeProfileStatus status;

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

    public static RefereeProfile create(User user, String licenseNumber, String certification, int experienceYears, String bio, RefereeProfileStatus status) {
        RefereeProfile profile = new RefereeProfile();
        profile.user = user;
        profile.licenseNumber = licenseNumber;
        profile.certification = certification;
        profile.experienceYears = experienceYears;
        profile.bio = bio;
        profile.status = status;
        profile.createdAt = LocalDateTime.now();
        return profile;
    }

    public void updateCredentials(String licenseNumber, String certification, int experienceYears, String bio, String evidenceUrl) {
        this.licenseNumber = licenseNumber;
        this.certification = certification;
        this.experienceYears = experienceYears;
        this.bio = bio;
        this.evidenceUrl = evidenceUrl;
        this.status = RefereeProfileStatus.PENDING;
        this.rejectionReason = null;
        this.updatedAt = LocalDateTime.now();
    }
}
