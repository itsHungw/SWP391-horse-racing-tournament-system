package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.HorseOwnerProfile;
import java.time.LocalDateTime;
import com.example.horseracingtournamentsystem.user.enums.ProfileStatus;

public record OwnerProfileResponse(
        String stableName,
        String organizationName,
        String ownerName,
        String description,
        String contactPhone,
        String contactEmail,
        String contactAddress,
        String licenseNumber,
        Integer experienceYears,
        String bio,
        String evidenceUrl,
        String logoUrl,
        ProfileStatus status,
        String rejectionReason,
        Long approvedBy,
        LocalDateTime approvedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static OwnerProfileResponse from(HorseOwnerProfile profile) {
        return new OwnerProfileResponse(
                profile.getStableName(),
                profile.getOrganizationName(),
                profile.getOwnerName(),
                profile.getDescription(),
                profile.getContactPhone(),
                profile.getContactEmail(),
                profile.getContactAddress(),
                profile.getLicenseNumber(),
                profile.getExperienceYears(),
                profile.getBio(),
                profile.getEvidenceUrl(),
                profile.getLogoUrl(),
                profile.getStatus(),
                profile.getRejectionReason(),
                profile.getApprovedBy() == null ? null : profile.getApprovedBy().getId(),
                profile.getApprovedAt(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}
