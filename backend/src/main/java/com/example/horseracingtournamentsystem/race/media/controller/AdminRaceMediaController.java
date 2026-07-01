package com.example.horseracingtournamentsystem.race.media.controller;

import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaRequest;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaResponse;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaValidateResponse;
import com.example.horseracingtournamentsystem.race.media.service.RaceMediaService;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/races")
@RequiredArgsConstructor
public class AdminRaceMediaController {

    private final RaceMediaService raceMediaService;

    @GetMapping("/{raceId}/media")
    public ResponseEntity<RaceMediaResponse> get(@PathVariable Long raceId) {
        return raceMediaService.getAdminHighlight(raceId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/{raceId}/media/validate")
    public RaceMediaValidateResponse validate(@PathVariable Long raceId, @Valid @RequestBody RaceMediaRequest request) {
        return raceMediaService.validateAdminHighlight(raceId, request);
    }

    @PutMapping("/{raceId}/media")
    public RaceMediaResponse upsert(
            @PathVariable Long raceId,
            @Valid @RequestBody RaceMediaRequest request,
            Principal principal
    ) {
        return raceMediaService.upsertAdminHighlight(raceId, request, principal.getName());
    }

    @PostMapping("/{raceId}/media/publish")
    public RaceMediaResponse publish(@PathVariable Long raceId, Principal principal) {
        return raceMediaService.publishAdminHighlight(raceId, principal.getName());
    }

    @PostMapping("/{raceId}/media/unpublish")
    public RaceMediaResponse unpublish(@PathVariable Long raceId, Principal principal) {
        return raceMediaService.unpublishAdminHighlight(raceId, principal.getName());
    }

    @PostMapping("/{raceId}/media/reverify")
    public RaceMediaResponse reverify(@PathVariable Long raceId) {
        return raceMediaService.reverifyAdminHighlight(raceId);
    }

    @DeleteMapping("/{raceId}/media")
    public ResponseEntity<Void> delete(@PathVariable Long raceId, Principal principal) {
        raceMediaService.deleteAdminHighlight(raceId, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
