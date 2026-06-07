package com.example.horseracingtournamentsystem.race.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class RaceResponse {
    private Long id;
    private Long tournamentId;
    private String tournamentName;
    private String name;
    private String code;
    private LocalDateTime raceDateTime;
    private Integer distanceMeters;
    private Integer maxParticipants;
    private String status;
    private Long refereeId;
    private String refereeName;
    private String creatorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
