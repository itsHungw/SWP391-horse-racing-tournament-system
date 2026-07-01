package com.example.horseracingtournamentsystem.race.media.controller;

import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaRequest;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaResponse;
import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaValidateResponse;
import com.example.horseracingtournamentsystem.race.media.service.RaceMediaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/organizer/races")
@RequiredArgsConstructor
public class OrganizerRaceMediaController {

    private final RaceMediaService raceMediaService;

    @GetMapping("/{raceId}/media")
    public ResponseEntity<RaceMediaResponse> get(@PathVariable Long raceId, Authentication authentication) {
        return raceMediaService.getOrganizerHighlight(raceId, authentication.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/{raceId}/media/validate")
    public RaceMediaValidateResponse validate(
            @PathVariable Long raceId,
            @Valid @RequestBody RaceMediaRequest request,
            Authentication authentication
    ) {
        return raceMediaService.validateOrganizerHighlight(raceId, request, authentication.getName());
    }

    @PutMapping("/{raceId}/media")
    public RaceMediaResponse upsert(
            @PathVariable Long raceId,
            @Valid @RequestBody RaceMediaRequest request,
            Authentication authentication
    ) {
        return raceMediaService.upsertOrganizerHighlight(raceId, request, authentication.getName());
    }

    @PostMapping("/{raceId}/media/publish")
    public RaceMediaResponse publish(@PathVariable Long raceId, Authentication authentication) {
        return raceMediaService.publishOrganizerHighlight(raceId, authentication.getName());
    }

    @PostMapping("/{raceId}/media/unpublish")
    public RaceMediaResponse unpublish(@PathVariable Long raceId, Authentication authentication) {
        return raceMediaService.unpublishOrganizerHighlight(raceId, authentication.getName());
    }

    @PostMapping("/{raceId}/media/reverify")
    public RaceMediaResponse reverify(@PathVariable Long raceId, Authentication authentication) {
        return raceMediaService.reverifyOrganizerHighlight(raceId, authentication.getName());
    }

    @DeleteMapping("/{raceId}/media")
    public ResponseEntity<Void> delete(@PathVariable Long raceId, Authentication authentication) {
        raceMediaService.deleteOrganizerHighlight(raceId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
