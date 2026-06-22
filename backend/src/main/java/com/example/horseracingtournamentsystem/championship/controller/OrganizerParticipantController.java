package com.example.horseracingtournamentsystem.championship.controller;

import com.example.horseracingtournamentsystem.championship.dto.request.RejectJockeyPoolApplicationRequest;
import com.example.horseracingtournamentsystem.championship.dto.response.JockeyPoolApplicationResponse;
import com.example.horseracingtournamentsystem.championship.dto.response.LockParticipantsResponse;
import com.example.horseracingtournamentsystem.championship.dto.response.TournamentParticipantResponse;
import com.example.horseracingtournamentsystem.championship.service.JockeyInvitationContractService;
import com.example.horseracingtournamentsystem.championship.service.JockeyPoolApplicationService;
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

/**
 * Organizer gác cổng phía jockey + chốt danh sách thi đấu cho giải CỦA MÌNH (BR-09):
 * duyệt/từ chối đơn vào jockey pool, và lock participants (vật chất hóa horse+jockey thành
 * official participants). Prefix /api/v1/organizer/** -> hasRole('ORGANIZER'); service
 * kiểm tra thêm quyền sở hữu giải qua Tournament.isManagedBy.
 */
@RestController
@RequestMapping("/api/v1/organizer/tournaments/{tournamentId}")
@RequiredArgsConstructor
@io.swagger.v3.oas.annotations.tags.Tag(name = "10 · Organizer · Jockey pool & lock field", description = "Organizer approves jockey applications and locks the official participant roster.")
public class OrganizerParticipantController {

    private final JockeyPoolApplicationService jockeyPoolService;
    private final JockeyInvitationContractService contractService;

    @GetMapping("/jockey-applications")
    public List<JockeyPoolApplicationResponse> listJockeyApplications(
            @PathVariable Long tournamentId,
            @RequestParam(required = false) String status,
            Authentication authentication
    ) {
        return jockeyPoolService.listForOrganizer(tournamentId, status, authentication.getName());
    }

    @PostMapping("/jockey-applications/{applicationId}/approve")
    public JockeyPoolApplicationResponse approveJockeyApplication(
            @PathVariable Long tournamentId,
            @PathVariable Long applicationId,
            Authentication authentication
    ) {
        return jockeyPoolService.approveAsOrganizer(tournamentId, applicationId, authentication.getName());
    }

    @PostMapping("/jockey-applications/{applicationId}/reject")
    public JockeyPoolApplicationResponse rejectJockeyApplication(
            @PathVariable Long tournamentId,
            @PathVariable Long applicationId,
            Authentication authentication,
            @Valid @RequestBody RejectJockeyPoolApplicationRequest request
    ) {
        return jockeyPoolService.rejectAsOrganizer(tournamentId, applicationId, authentication.getName(), request.reason());
    }

    @GetMapping("/participants")
    public List<TournamentParticipantResponse> listParticipants(
            @PathVariable Long tournamentId,
            Authentication authentication
    ) {
        return contractService.listParticipantsForOrganizer(tournamentId, authentication.getName());
    }

    @PostMapping("/lock-participants")
    public LockParticipantsResponse lockParticipants(
            @PathVariable Long tournamentId,
            Authentication authentication
    ) {
        return contractService.lockParticipantsForOrganizer(tournamentId, authentication.getName());
    }
}
