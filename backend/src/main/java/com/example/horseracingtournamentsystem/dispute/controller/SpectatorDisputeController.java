package com.example.horseracingtournamentsystem.dispute.controller;

import com.example.horseracingtournamentsystem.dispute.dto.CreateDisputeRequest;
import com.example.horseracingtournamentsystem.dispute.dto.DisputeResponse;
import com.example.horseracingtournamentsystem.dispute.enums.DisputeRole;
import com.example.horseracingtournamentsystem.dispute.service.DisputeService;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/spectator/disputes")
@RequiredArgsConstructor
public class SpectatorDisputeController {

    private final DisputeService disputeService;
    private final UserRepository userRepo;

    @PostMapping
    public ResponseEntity<DisputeResponse> createDispute(
            @Valid @RequestBody CreateDisputeRequest request,
            Authentication authentication) {
        
        User spectator = userRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Spectator user not found"));

        // Spectators always complain to Admin for V1
        DisputeResponse response = disputeService.createDispute(
                spectator,
                DisputeRole.SPECTATOR,
                DisputeRole.ADMIN,
                request
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<DisputeResponse>> getMyDisputes(Authentication authentication) {
        User spectator = userRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Spectator user not found"));

        List<DisputeResponse> disputes = disputeService.getDisputesByRequester(spectator.getId());
        return ResponseEntity.ok(disputes);
    }
}
