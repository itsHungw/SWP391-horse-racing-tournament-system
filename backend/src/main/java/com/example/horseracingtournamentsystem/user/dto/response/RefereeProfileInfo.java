package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.RefereeProfile;
import java.time.LocalDateTime;

public record RefereeProfileInfo(
        String licenseNumber,
        String certification,
        int experienceYears,
        String bio,
        String evidenceUrl,
        String status,
        LocalDateTime approvedAt
) {
    public static RefereeProfileInfo from(RefereeProfile profile) {
        if (profile == null) {
            return null;
        }
        return new RefereeProfileInfo(
                profile.getLicenseNumber(),
                profile.getCertification(),
                profile.getExperienceYears(),
                profile.getBio(),
                profile.getEvidenceUrl(),
                profile.getStatus().name(),
                profile.getApprovedAt()
        );
    }
}
