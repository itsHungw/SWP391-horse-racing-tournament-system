package com.example.horseracingtournamentsystem.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "horse_owner_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HorseOwnerProfile {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_SUSPENDED = "SUSPENDED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "stable_name", length = 150)
    private String stableName;

    @Column(name = "organization_name", length = 150)
    private String organizationName;

    @Column(name = "owner_name", length = 150)
    private String ownerName;

    @Column(name = "description")
    private String description;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(name = "contact_email", length = 150)
    private String contactEmail;

    @Column(name = "contact_address")
    private String contactAddress;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(name = "experience_years", nullable = false)
    private Integer experienceYears;

    @Column(name = "bio")
    private String bio;

    @Column(name = "evidence_url", length = 500)
    private String evidenceUrl;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

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

    public static HorseOwnerProfile pending(User user) {
        HorseOwnerProfile profile = new HorseOwnerProfile();
        profile.user = user;
        profile.status = STATUS_PENDING;
        profile.experienceYears = 0;
        profile.createdAt = LocalDateTime.now();
        return profile;
    }

    public void markUpdated() {
        this.updatedAt = LocalDateTime.now();
    }

    public void updateStableProfile(
            String stableName,
            String ownerName,
            String description,
            String contactPhone,
            String contactEmail,
            String contactAddress,
            String logoUrl
    ) {
        this.stableName = stableName;
        this.ownerName = ownerName;
        this.description = description;
        this.contactPhone = contactPhone;
        this.contactEmail = contactEmail;
        this.contactAddress = contactAddress;
        this.logoUrl = logoUrl;
        this.markUpdated();
    }
}
