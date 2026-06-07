package com.example.horseracingtournamentsystem.user.controller;

import com.example.horseracingtournamentsystem.user.dto.request.UpdateRefereeProfileRequest;
import com.example.horseracingtournamentsystem.user.dto.response.RefereeProfileInfo;
import com.example.horseracingtournamentsystem.user.service.RefereeProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class RefereeProfileController {

    private final RefereeProfileService refereeProfileService;

    @GetMapping("/me/referee-profile")
    public RefereeProfileInfo getMyRefereeProfile(Authentication authentication) {
        return refereeProfileService.getMyProfile(authentication.getName());
    }

    @PutMapping("/me/referee-profile")
    public RefereeProfileInfo updateMyRefereeProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateRefereeProfileRequest request
    ) {
        return refereeProfileService.updateMyProfile(authentication.getName(), request);
    }
}
