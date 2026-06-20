package com.example.horseracingtournamentsystem.organization.dto.response;

import com.example.horseracingtournamentsystem.organization.entity.Organization;
import java.time.LocalDateTime;

public record OrganizationResponse(
        Long id,
        String code,
        String name,
        String status,
        String licenseNumber,
        String contactEmail,
        String contactPhone,
        String logoUrl,
        String evidenceUrl,
        String description,
        String applicationNote,
        String rejectionReason,
        Long ownerId,
        String ownerName,
        Long approvedById,
        LocalDateTime approvedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static OrganizationResponse from(Organization o) {
        return new OrganizationResponse(
                o.getId(),
                o.getCode(),
                o.getName(),
                o.getStatus(),
                o.getLicenseNumber(),
                o.getContactEmail(),
                o.getContactPhone(),
                o.getLogoUrl(),
                o.getEvidenceUrl(),
                o.getDescription(),
                o.getApplicationNote(),
                o.getRejectionReason(),
                o.getOwner().getId(),
                o.getOwner().getFullName(),
                o.getApprovedBy() == null ? null : o.getApprovedBy().getId(),
                o.getApprovedAt(),
                o.getCreatedAt(),
                o.getUpdatedAt()
        );
    }
}
