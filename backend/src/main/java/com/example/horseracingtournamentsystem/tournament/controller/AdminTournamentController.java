package com.example.horseracingtournamentsystem.tournament.controller;

import com.example.horseracingtournamentsystem.tournament.dto.request.RejectTournamentRequest;
import com.example.horseracingtournamentsystem.tournament.dto.request.TournamentRequest;
import com.example.horseracingtournamentsystem.tournament.dto.response.TournamentResponse;
import com.example.horseracingtournamentsystem.tournament.service.TournamentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/tournaments")
@RequiredArgsConstructor
public class AdminTournamentController {

    private final TournamentService tournamentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TournamentResponse createTournament(@Valid @RequestBody TournamentRequest req, Principal principal) {
        return tournamentService.createTournament(req, principal.getName());
    }

    @PutMapping("/{id}")
    public TournamentResponse updateTournament(@PathVariable Long id, @Valid @RequestBody TournamentRequest req) {
        return tournamentService.updateTournament(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTournament(@PathVariable Long id) {
        tournamentService.deleteTournament(id);
    }

    @GetMapping
    public List<TournamentResponse> listAll() {
        return tournamentService.getAdminTournaments();
    }

    @GetMapping("/{id}")
    public TournamentResponse getDetail(@PathVariable Long id) {
        return tournamentService.getTournamentDetail(id);
    }

    @PutMapping("/{id}/status")
    public void updateStatus(@PathVariable Long id, @RequestParam String status) {
        tournamentService.updateStatus(id, status);
    }

    // Cổng 2 (BR-17): admin duyệt / từ chối giải do Ban tổ chức gửi lên.
    @PostMapping("/{id}/approve")
    public TournamentResponse approveLaunch(@PathVariable Long id, Principal principal) {
        return tournamentService.approveLaunch(id, principal.getName());
    }

    @PostMapping("/{id}/reject")
    public TournamentResponse rejectLaunch(
            @PathVariable Long id,
            @Valid @RequestBody RejectTournamentRequest req,
            Principal principal
    ) {
        return tournamentService.rejectLaunch(id, principal.getName(), req.reason());
    }
}
