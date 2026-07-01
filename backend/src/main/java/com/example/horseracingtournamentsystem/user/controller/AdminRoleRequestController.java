package com.example.horseracingtournamentsystem.user.controller;

import com.example.horseracingtournamentsystem.user.dto.request.ApproveRoleRequestRequest;
import com.example.horseracingtournamentsystem.user.dto.request.PassCvReviewRequest;
import com.example.horseracingtournamentsystem.user.dto.request.RejectRoleRequestRequest;
import com.example.horseracingtournamentsystem.user.dto.response.AdminRoleRequestResponse;
import com.example.horseracingtournamentsystem.user.service.AdminRoleRequestService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/role-requests")
@RequiredArgsConstructor
public class AdminRoleRequestController {

    private final AdminRoleRequestService adminRoleRequestService;

    @GetMapping
    public List<AdminRoleRequestResponse> list(@RequestParam(required = false) com.example.horseracingtournamentsystem.user.enums.RoleRequestStatus status) {
        return adminRoleRequestService.list(status);
    }

    // F1: Admin duyệt role
    @PostMapping("/{id}/approve")
    public AdminRoleRequestResponse approve(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) ApproveRoleRequestRequest request,
            Authentication authentication
    ) {
        String adminNote = request == null ? null : request.adminNote();
        return adminRoleRequestService.approve(id, authentication.getName(), adminNote);
    }

    // F1: Admin duyệt CV
    @PostMapping("/{id}/pass-cv")
    public AdminRoleRequestResponse passCv(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) PassCvReviewRequest request,
            Authentication authentication
    ) {
        String cvReviewNote = request == null ? null : request.cvReviewNote();
        return adminRoleRequestService.passCvReview(id, authentication.getName(), cvReviewNote);
    }

    @PostMapping("/{id}/reject")
    public AdminRoleRequestResponse reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectRoleRequestRequest request,
            Authentication authentication
    ) {
        return adminRoleRequestService.reject(id, authentication.getName(), request.reason());
    }
}
