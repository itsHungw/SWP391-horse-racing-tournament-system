package com.example.horseracingtournamentsystem.championship.dto.response;

import com.example.horseracingtournamentsystem.championship.entity.RefereeContract;
import java.time.LocalDateTime;

public record RefereeContractResponse(
        Long id,
        Long tournamentId,
        String tournamentName,
        Long refereeId,
        String refereeName,
        Long invitedById,
        String status,
        String agreementUrl,
        String reason,
        LocalDateTime createdAt,
        LocalDateTime respondedAt,
        LocalDateTime terminatedAt
) {
    public static RefereeContractResponse from(RefereeContract c) {
        return new RefereeContractResponse(
                c.getId(),
                c.getTournament().getId(),
                c.getTournament().getName(),
                c.getReferee().getId(),
                c.getReferee().getFullName(),
                c.getInvitedBy().getId(),
                c.getStatus(),
                c.getAgreementUrl(),
                c.getReason(),
                c.getCreatedAt(),
                c.getRespondedAt(),
                c.getTerminatedAt()
        );
    }
}
