package com.example.horseracingtournamentsystem.referee.dto;

public record ViolationRequest(
        Long offenderId,
        String severity,
        String description,
        String violationType,
        String penalty
) {
}
