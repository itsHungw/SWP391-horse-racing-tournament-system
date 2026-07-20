package com.example.horseracingtournamentsystem.dispute.controller;

import com.example.horseracingtournamentsystem.dispute.dto.DisputeResponse;
import com.example.horseracingtournamentsystem.dispute.dto.UpdateDisputeStatusRequest;
import com.example.horseracingtournamentsystem.dispute.service.DisputeService;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/disputes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDisputeController {

    private final DisputeService disputeService;
    private final UserRepository userRepo;

    @GetMapping
    public ResponseEntity<List<DisputeResponse>> getAllDisputes() {
        List<DisputeResponse> responses = disputeService.getAllDisputes();
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<DisputeResponse> updateDisputeStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDisputeStatusRequest request,
            Authentication authentication) {
        
        User admin = userRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));

        DisputeResponse response = disputeService.updateDisputeStatus(id, request, admin);
        return ResponseEntity.ok(response);
    }
}
