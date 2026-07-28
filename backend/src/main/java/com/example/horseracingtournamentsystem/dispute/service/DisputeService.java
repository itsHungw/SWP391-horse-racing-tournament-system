package com.example.horseracingtournamentsystem.dispute.service;

import com.example.horseracingtournamentsystem.dispute.dto.CreateAccountAppealRequest;
import com.example.horseracingtournamentsystem.dispute.dto.CreateDisputeRequest;
import com.example.horseracingtournamentsystem.dispute.dto.DisputeAttachmentResponse;
import com.example.horseracingtournamentsystem.dispute.dto.DisputeResponse;
import com.example.horseracingtournamentsystem.dispute.entity.Dispute;
import com.example.horseracingtournamentsystem.dispute.entity.DisputeAttachment;
import com.example.horseracingtournamentsystem.dispute.enums.DisputeRole;
import com.example.horseracingtournamentsystem.dispute.enums.DisputeCategory;
import com.example.horseracingtournamentsystem.dispute.enums.DisputeReferenceType;
import com.example.horseracingtournamentsystem.dispute.repository.DisputeRepository;
import com.example.horseracingtournamentsystem.organization.entity.Organization;
import com.example.horseracingtournamentsystem.organization.repository.OrganizationRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.notification.service.NotificationService;
import com.example.horseracingtournamentsystem.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final OrganizationRepository organizationRepository;
    private final TournamentRepository tournamentRepository;
    private final NotificationService notificationService;

    @Transactional
    public DisputeResponse createDispute(User requester, DisputeRole requesterRole, DisputeRole handlerRole, CreateDisputeRequest request) {
        Organization organization = null;
        if (request.getOrganizationId() != null) {
            organization = organizationRepository.findById(request.getOrganizationId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found"));
        }

        Tournament tournament = null;
        if (request.getTournamentId() != null) {
            tournament = tournamentRepository.findById(request.getTournamentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
        }

        Dispute dispute = Dispute.builder()
                .requester(requester)
                .requesterRole(requesterRole)
                .handlerRole(handlerRole)
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId())
                .category(request.getCategory())
                .title(request.getTitle())
                .description(request.getDescription())
                .organization(organization)
                .tournament(tournament)
                .build();

        if (request.getEvidenceUrls() != null && !request.getEvidenceUrls().isEmpty()) {
            for (String url : request.getEvidenceUrls()) {
                dispute.addAttachment(DisputeAttachment.builder().fileUrl(url).build());
            }
        }

        Dispute savedDispute = disputeRepository.save(dispute);
        return mapToResponse(savedDispute);
    }

    @Transactional
    public DisputeResponse createAccountAppeal(
            User requester, Long decisionId, String decisionStatus, CreateAccountAppealRequest request) {
        Dispute dispute = Dispute.builder()
                .requester(requester)
                .requesterRole(DisputeRole.ACCOUNT_HOLDER)
                .handlerRole(DisputeRole.ADMIN)
                .referenceType(DisputeReferenceType.ACCOUNT_ENFORCEMENT)
                .referenceId(decisionId)
                .category(DisputeCategory.DISCIPLINARY)
                .title("Appeal of " + decisionStatus + " decision")
                .description(request.description().trim())
                .build();
        if (request.evidenceUrls() != null) {
            request.evidenceUrls().forEach(url ->
                    dispute.addAttachment(DisputeAttachment.builder().fileUrl(url).build()));
        }
        return toResponse(disputeRepository.saveAndFlush(dispute));
    }

    @Transactional(readOnly = true)
    public List<DisputeResponse> getDisputesByRequester(Long requesterId) {
        List<Dispute> disputes = disputeRepository.findByRequesterIdOrderByCreatedAtDesc(requesterId);
        return disputes.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DisputeResponse> getAllDisputes() {
        List<Dispute> disputes = disputeRepository.findAllByOrderByCreatedAtDesc();
        return disputes.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public DisputeResponse updateDisputeStatus(Long id, com.example.horseracingtournamentsystem.dispute.dto.UpdateDisputeStatusRequest request, User admin) {
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispute not found"));

        dispute.setStatus(request.getStatus());
        if (request.getPriority() != null) {
            dispute.setPriority(request.getPriority());
        }
        if (request.getResolutionNote() != null) {
            dispute.setResolutionNote(request.getResolutionNote());
        }
        
        if (request.getStatus() == com.example.horseracingtournamentsystem.dispute.enums.DisputeStatus.RESOLVED || 
            request.getStatus() == com.example.horseracingtournamentsystem.dispute.enums.DisputeStatus.REJECTED) {
            if (dispute.getResolvedAt() == null) {
                dispute.setResolvedAt(java.time.LocalDateTime.now());
            }
            dispute.setHandler(admin);
            
            notificationService.notify(
                    dispute.getRequester(),
                    "DISPUTE_UPDATED",
                    "Dispute " + request.getStatus().name(),
                    "Your dispute '" + dispute.getTitle() + "' has been updated to " + request.getStatus().name() + ".",
                    "DISPUTE",
                    dispute.getId()
            );
        }

        Dispute savedDispute = disputeRepository.save(dispute);
        return mapToResponse(savedDispute);
    }

    public DisputeResponse toResponse(Dispute dispute) {
        return DisputeResponse.builder()
                .id(dispute.getId())
                .requesterId(dispute.getRequester().getId())
                .requesterName(dispute.getRequester().getFullName())
                .requesterEmail(dispute.getRequester().getEmail())
                .requesterRole(dispute.getRequesterRole())
                .handlerRole(dispute.getHandlerRole())
                .tournamentId(dispute.getTournament() != null ? dispute.getTournament().getId() : null)
                .organizationId(dispute.getOrganization() != null ? dispute.getOrganization().getId() : null)
                .referenceType(dispute.getReferenceType())
                .referenceId(dispute.getReferenceId())
                .category(dispute.getCategory())
                .title(dispute.getTitle())
                .description(dispute.getDescription())
                .status(dispute.getStatus())
                .priority(dispute.getPriority())
                .resolutionNote(dispute.getResolutionNote())
                .resolvedAt(dispute.getResolvedAt())
                .createdAt(dispute.getCreatedAt())
                .updatedAt(dispute.getUpdatedAt())
                .attachments(dispute.getAttachments().stream().map(a -> DisputeAttachmentResponse.builder()
                        .id(a.getId())
                        .fileUrl(a.getFileUrl())
                        .createdAt(a.getCreatedAt())
                        .build()).collect(Collectors.toList()))
                .build();
    }

    private DisputeResponse mapToResponse(Dispute dispute) {
        return toResponse(dispute);
    }
}
