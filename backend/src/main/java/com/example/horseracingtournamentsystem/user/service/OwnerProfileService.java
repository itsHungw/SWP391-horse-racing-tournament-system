package com.example.horseracingtournamentsystem.user.service;

import com.example.horseracingtournamentsystem.user.dto.request.UpdateOwnerProfileRequest;
import com.example.horseracingtournamentsystem.user.dto.response.OwnerProfileResponse;
import com.example.horseracingtournamentsystem.user.entity.HorseOwnerProfile;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.HorseOwnerProfileRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class OwnerProfileService {

    private final HorseOwnerProfileRepository ownerProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public OwnerProfileResponse getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        HorseOwnerProfile profile = ownerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner profile not found"));

        return OwnerProfileResponse.from(profile);
    }

    @Transactional
    public OwnerProfileResponse updateMyProfile(String email, UpdateOwnerProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        HorseOwnerProfile profile = ownerProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> HorseOwnerProfile.pending(user));

        profile.updateStableProfile(
                request.stableName().trim(),
                trimToNull(request.ownerName()),
                trimToNull(request.description()),
                request.contactPhone().trim(),
                request.contactEmail().trim(),
                request.contactAddress().trim(),
                trimToNull(request.logoUrl())
        );

        return OwnerProfileResponse.from(ownerProfileRepository.save(profile));
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
