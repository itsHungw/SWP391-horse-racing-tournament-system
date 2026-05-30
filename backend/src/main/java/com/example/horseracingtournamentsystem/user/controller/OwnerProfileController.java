package com.example.horseracingtournamentsystem.user.controller;

import com.example.horseracingtournamentsystem.user.dto.response.OwnerProfileResponse;
import com.example.horseracingtournamentsystem.user.service.OwnerProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
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
}
