package com.example.horseracingtournamentsystem.race.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;

@Data
@Builder
@NoArgsConstructor
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
    private RaceStatus status;
    private Long refereeId;
    private String refereeName;
    private String creatorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
