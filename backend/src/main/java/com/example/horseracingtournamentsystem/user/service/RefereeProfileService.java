package com.example.horseracingtournamentsystem.user.service;

import com.example.horseracingtournamentsystem.user.dto.request.UpdateRefereeProfileRequest;
import com.example.horseracingtournamentsystem.user.dto.response.RefereeProfileInfo;
import com.example.horseracingtournamentsystem.user.entity.RefereeProfile;
import com.example.horseracingtournamentsystem.user.entity.RefereeProfileStatus;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.RefereeProfileRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class RefereeProfileService {

    private final RefereeProfileRepository refereeProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public RefereeProfileInfo getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        RefereeProfile profile = refereeProfileRepository.findByUserId(user.getId())
                .orElse(null);

        return RefereeProfileInfo.from(profile);
    }

    @Transactional
    public RefereeProfileInfo updateMyProfile(String email, UpdateRefereeProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!user.getActiveRoleNames().contains("REFEREE")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only referees can update referee credentials");
        }

        RefereeProfile profile = refereeProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> RefereeProfile.create(user, null, null, 0, null, RefereeProfileStatus.PENDING));

        profile.updateCredentials(
                trimToNull(request.licenseNumber()),
                trimToNull(request.certification()),
                request.experienceYears(),
                trimToNull(request.bio()),
                trimToNull(request.evidenceUrl())
        );

        return RefereeProfileInfo.from(refereeProfileRepository.save(profile));
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
