package com.example.horseracingtournamentsystem.user.controller;

import com.example.horseracingtournamentsystem.user.dto.request.SubmitRoleRequestRequest;
import com.example.horseracingtournamentsystem.user.dto.response.UserRoleRequestResponse;
import com.example.horseracingtournamentsystem.user.service.UserRoleRequestService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/role-requests")
@RequiredArgsConstructor
public class UserRoleRequestController {

    private final UserRoleRequestService userRoleRequestService;

    @GetMapping("/my")
    public List<UserRoleRequestResponse> listMine(Authentication authentication) {
        return userRoleRequestService.listMine(authentication.getName());
    }

    @PostMapping
    public UserRoleRequestResponse submit(
            Authentication authentication,
            @Valid @RequestBody SubmitRoleRequestRequest request
    ) {
        return userRoleRequestService.submit(authentication.getName(), request);
    }
}
