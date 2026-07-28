package com.example.horseracingtournamentsystem.user.controller;

import com.example.horseracingtournamentsystem.user.dto.request.CreateUserAdminRequest;
import com.example.horseracingtournamentsystem.user.dto.request.AccountStatusTransitionRequest;
import com.example.horseracingtournamentsystem.user.dto.request.SuspendAccountRequest;
import com.example.horseracingtournamentsystem.user.dto.request.UpdateUserProfileAdminRequest;
import com.example.horseracingtournamentsystem.user.dto.request.UpdateUserRolesAdminRequest;
import com.example.horseracingtournamentsystem.user.dto.response.AdminUserDetailResponse;
import com.example.horseracingtournamentsystem.user.dto.response.UserRoleHistoryResponse;
import com.example.horseracingtournamentsystem.user.dto.response.UserStatusHistoryResponse;
import com.example.horseracingtournamentsystem.user.entity.UserRoleHistory;
import com.example.horseracingtournamentsystem.user.service.UserService;
import com.example.horseracingtournamentsystem.user.service.AccountEnforcementService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;
    private final AccountEnforcementService accountEnforcementService;

    @GetMapping
    public ResponseEntity<Page<AdminUserDetailResponse>> searchUsers(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "status", required = false) com.example.horseracingtournamentsystem.user.enums.UserStatus status,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("id").descending());
        Page<AdminUserDetailResponse> results = userService.searchActiveUsers(query, status, role, pageRequest);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserDetailResponse> getUserDetail(@PathVariable("id") Long id) {
        AdminUserDetailResponse response = userService.getUserDetailsForAdmin(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<UserRoleHistoryResponse>> getUserRoleHistory(@PathVariable("id") Long id) {
        List<UserRoleHistoryResponse> history = userService.getRecentRoleHistory(id).stream()
                .map(UserRoleHistoryResponse::from)
                .toList();
        return ResponseEntity.ok(history);
    }

    @PostMapping
    public ResponseEntity<AdminUserDetailResponse> createUser(
            @Valid @RequestBody CreateUserAdminRequest request
    ) {
        AdminUserDetailResponse response = userService.createUserByAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<AdminUserDetailResponse> updateUserProfile(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateUserProfileAdminRequest request
    ) {
        AdminUserDetailResponse response = userService.updateUserProfileByAdmin(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/roles")
    public ResponseEntity<AdminUserDetailResponse> updateUserRoles(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateUserRolesAdminRequest request,
            Authentication authentication
    ) {
        AdminUserDetailResponse response = userService.updateUserRolesByAdmin(id, request, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/suspend")
    public ResponseEntity<AdminUserDetailResponse> suspend(
            @PathVariable("id") Long id, @Valid @RequestBody SuspendAccountRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(accountEnforcementService.suspend(id, request, authentication.getName()));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<AdminUserDetailResponse> restore(
            @PathVariable("id") Long id, @Valid @RequestBody AccountStatusTransitionRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(accountEnforcementService.restore(id, request, authentication.getName()));
    }

    @PostMapping("/{id}/ban")
    public ResponseEntity<AdminUserDetailResponse> ban(
            @PathVariable("id") Long id, @Valid @RequestBody AccountStatusTransitionRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(accountEnforcementService.ban(id, request, authentication.getName()));
    }

    @PostMapping("/{id}/reopen")
    public ResponseEntity<AdminUserDetailResponse> reopen(
            @PathVariable("id") Long id, @Valid @RequestBody AccountStatusTransitionRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(accountEnforcementService.reopen(id, request, authentication.getName()));
    }

    @GetMapping("/{id}/status-history")
    public ResponseEntity<List<UserStatusHistoryResponse>> statusHistory(@PathVariable("id") Long id) {
        return ResponseEntity.ok(accountEnforcementService.history(id));
    }
}
