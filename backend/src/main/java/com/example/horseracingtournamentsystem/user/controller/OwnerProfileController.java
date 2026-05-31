package com.example.horseracingtournamentsystem.user.controller;

import com.example.horseracingtournamentsystem.user.dto.request.UpdateOwnerProfileRequest;
import com.example.horseracingtournamentsystem.user.dto.response.OwnerProfileResponse;
import com.example.horseracingtournamentsystem.user.service.OwnerProfileService;
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
public class OwnerProfileController {

    private final OwnerProfileService ownerProfileService;

    @GetMapping("/me/owner-profile")
    public OwnerProfileResponse getOwnerProfile(Authentication authentication) {
        return ownerProfileService.getMyProfile(authentication.getName());
    }

    @PutMapping("/me/owner-profile")
    public OwnerProfileResponse updateOwnerProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateOwnerProfileRequest request
    ) {
        return ownerProfileService.updateMyProfile(authentication.getName(), request);
    }
}
