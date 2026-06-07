package com.example.horseracingtournamentsystem.tournament.controller;

import com.example.horseracingtournamentsystem.tournament.dto.response.TournamentResponse;
import com.example.horseracingtournamentsystem.tournament.service.TournamentService;
import lombok.RequiredArgsConstructor;
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

    @GetMapping("/{id}")
    public TournamentResponse getPublicDetail(@PathVariable Long id) {
        return tournamentService.getTournamentDetail(id);
    }
}
