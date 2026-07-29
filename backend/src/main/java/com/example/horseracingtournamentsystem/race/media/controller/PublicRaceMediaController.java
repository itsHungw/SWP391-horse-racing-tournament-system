package com.example.horseracingtournamentsystem.race.media.controller;

import com.example.horseracingtournamentsystem.race.media.dto.RaceMediaPublicResponse;
import com.example.horseracingtournamentsystem.race.media.service.RaceMediaService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/races")
@RequiredArgsConstructor
public class PublicRaceMediaController {

    private static final int MAX_BATCH_RACE_IDS = 50;

    private final RaceMediaService raceMediaService;

    @GetMapping("/{raceId}/highlight")
    public ResponseEntity<RaceMediaPublicResponse> getRaceHighlight(@PathVariable Long raceId) {
        return raceMediaService.getPublicHighlight(raceId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping(value = "/highlights", params = "tournamentId")
    public List<RaceMediaPublicResponse> getHighlights(@RequestParam Long tournamentId) {
        return raceMediaService.getPublicHighlightsForTournament(tournamentId);
    }

    // Batch theo raceIds — thay cho việc client gọi /{raceId}/highlight từng cái một.
    // Trang chủ chỉ cần biết "trong N race vừa xong, cái nào có replay", mà đa số trả 204;
    // gọi lẻ tốn N request và N query. Chặn trên MAX_BATCH_RACE_IDS để IN (...) không phình.
    @GetMapping(value = "/highlights", params = "raceIds")
    public List<RaceMediaPublicResponse> getHighlightsForRaces(@RequestParam List<Long> raceIds) {
        if (raceIds.size() > MAX_BATCH_RACE_IDS) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "raceIds accepts at most " + MAX_BATCH_RACE_IDS + " ids per request.");
        }
        return raceMediaService.getPublicHighlightsForRaces(raceIds);
    }

    // Live stream công khai của race (chỉ published+verified). FE tự gate hiển thị theo race.status == ONGOING.
    @GetMapping("/{raceId}/live-stream")
    public ResponseEntity<RaceMediaPublicResponse> getRaceLiveStream(@PathVariable Long raceId) {
        return raceMediaService.getPublicLiveStream(raceId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
