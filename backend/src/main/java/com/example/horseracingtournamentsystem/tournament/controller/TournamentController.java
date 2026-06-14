package com.example.horseracingtournamentsystem.tournament.controller;

import com.example.horseracingtournamentsystem.tournament.dto.response.TournamentResponse;
import com.example.horseracingtournamentsystem.tournament.dto.response.TournamentSummaryResponse;
import com.example.horseracingtournamentsystem.tournament.service.TournamentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tournaments")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentService tournamentService;

    @GetMapping
    public List<TournamentResponse> listPublic() {
        return tournamentService.getPublicTournaments();
    }

    @GetMapping("/search")
    public Page<TournamentSummaryResponse> searchPublic(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "ONGOING_FIRST") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return tournamentService.searchPublicTournaments(
                search,
                status,
                year,
                sortBy,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 48))
        );
    }

    @GetMapping("/{id}")
    public TournamentResponse getPublicDetail(@PathVariable Long id) {
        return tournamentService.getTournamentDetail(id);
    }
}
