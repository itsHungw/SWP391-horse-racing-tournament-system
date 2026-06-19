package com.example.horseracingtournamentsystem.championship.service;

import com.example.horseracingtournamentsystem.championship.dto.request.OwnerContractRequest;
import com.example.horseracingtournamentsystem.championship.dto.request.RejectJockeyContractRequest;
import com.example.horseracingtournamentsystem.championship.dto.response.JockeyInvitationResponse;
import com.example.horseracingtournamentsystem.championship.dto.response.LockParticipantsResponse;
import com.example.horseracingtournamentsystem.championship.dto.response.TournamentParticipantResponse;
import com.example.horseracingtournamentsystem.championship.entity.JockeyInvitation;
import com.example.horseracingtournamentsystem.championship.entity.JockeyTournamentApplication;
import com.example.horseracingtournamentsystem.championship.entity.TournamentParticipant;
import com.example.horseracingtournamentsystem.championship.enums.JockeyApplicationStatus;
import com.example.horseracingtournamentsystem.championship.enums.JockeyInvitationStatus;
import com.example.horseracingtournamentsystem.championship.repository.JockeyInvitationRepository;
import com.example.horseracingtournamentsystem.championship.repository.JockeyTournamentApplicationRepository;
import com.example.horseracingtournamentsystem.championship.repository.TournamentParticipantRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.tournamentregistration.entity.TournamentRegistration;
import com.example.horseracingtournamentsystem.tournamentregistration.enums.RegistrationStatus;
import com.example.horseracingtournamentsystem.tournamentregistration.repository.TournamentRegistrationRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class JockeyInvitationContractService {

    private static final List<JockeyInvitationStatus> ACTIVE_CONTRACT_STATUSES = List.of(
            JockeyInvitationStatus.PENDING,
            JockeyInvitationStatus.ACCEPTED
    );

    private final JockeyInvitationRepository invitationRepository;
    private final TournamentRepository tournamentRepository;
    private final TournamentRegistrationRepository registrationRepository;
    private final JockeyTournamentApplicationRepository applicationRepository;
    private final TournamentParticipantRepository participantRepository;
    private final RaceRepository raceRepository;
    private final RaceParticipantRepository raceParticipantRepository;
    private final UserRepository userRepository;

    @Transactional
    public JockeyInvitationResponse sendContract(
            Long championshipId,
            String ownerEmail,
            OwnerContractRequest request
    ) {
        ensureTournamentExists(championshipId);
        TournamentRegistration registration = getRegistration(request.horseRegistrationId());
        validateHorseRegistration(championshipId, ownerEmail, registration);

        JockeyTournamentApplication application = getJockeyApplication(request.jockeyApplicationId());
        validateJockeyApplication(championshipId, application);
        validateContractConflicts(championshipId, registration, application);

        JockeyInvitation invitation = JockeyInvitation.pending(
                registration,
                application,
                request.message(),
                request.agreementUrl(),
                request.agreementFileName()
        );
        return mapToResponse(invitationRepository.save(invitation));
    }

    @Transactional(readOnly = true)
    public List<JockeyInvitationResponse> listOwnerContracts(Long championshipId, String ownerEmail) {
        ensureTournamentExists(championshipId);
        return invitationRepository.findAllByOwner_EmailAndTournament_IdOrderByCreatedAtDesc(ownerEmail, championshipId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<JockeyInvitationResponse> listJockeyContracts(String jockeyEmail) {
        User jockey = getUserWithRoles(jockeyEmail);
        requireRole(jockey, "JOCKEY", "Only approved jockeys can view assignment contracts");
        return invitationRepository.findAllByJockey_EmailOrderByCreatedAtDesc(jockeyEmail)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public JockeyInvitationResponse acceptContract(Long contractId, String jockeyEmail) {
        JockeyInvitation invitation = getContractForJockey(contractId, jockeyEmail);
        if (participantRepository.existsByTournament_IdAndJockey_Id(
                invitation.getTournament().getId(),
                invitation.getJockey().getId()
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This jockey is already committed in this championship");
        }
        invitation.accept(jockeyEmail);
        return mapToResponse(invitation);
    }

    @Transactional
    public JockeyInvitationResponse rejectContract(
            Long contractId,
            String jockeyEmail,
            RejectJockeyContractRequest request
    ) {
        JockeyInvitation invitation = getContractForJockey(contractId, jockeyEmail);
        invitation.reject(jockeyEmail, request.reason());
        return mapToResponse(invitation);
    }

    @Transactional
    public LockParticipantsResponse lockParticipants(Long championshipId) {
        Tournament tournament = ensureTournamentExists(championshipId);
        int createdParticipants = 0;
        List<JockeyInvitation> acceptedContracts = invitationRepository
                .findAllByTournament_IdAndStatusOrderByAcceptedAtAsc(
                        championshipId,
                        JockeyInvitationStatus.ACCEPTED
                );

        for (JockeyInvitation contract : acceptedContracts) {
            Long tournamentId = contract.getTournament().getId();
            Long horseId = contract.getHorse().getId();
            Long jockeyId = contract.getJockey().getId();
            if (participantRepository.existsByTournament_IdAndHorse_Id(tournamentId, horseId)
                    || participantRepository.existsByTournament_IdAndJockey_Id(tournamentId, jockeyId)) {
                continue;
            }
            TournamentParticipant participant = participantRepository.save(TournamentParticipant.active(
                    contract.getTournamentRegistration(),
                    contract.getJockey(),
                    contract.getId()
            ));
            syncParticipantToExistingRounds(participant, contract);
            createdParticipants++;
        }
        tournament.lockParticipants();
        return new LockParticipantsResponse(championshipId, createdParticipants);
    }

    @Transactional(readOnly = true)
    public List<TournamentParticipantResponse> listParticipants(Long championshipId) {
        ensureTournamentExists(championshipId);
        List<TournamentParticipantResponse> officialParticipants = new java.util.ArrayList<>(participantRepository.findAllByTournament_IdOrderByCreatedAtDesc(championshipId)
                .stream()
                .map(this::mapParticipantToResponse)
                .toList());

        List<JockeyInvitation> acceptedContracts = invitationRepository
                .findAllByTournament_IdAndStatusOrderByAcceptedAtAsc(
                        championshipId,
                        JockeyInvitationStatus.ACCEPTED
                );

        for (JockeyInvitation contract : acceptedContracts) {
            boolean alreadyLocked = officialParticipants.stream()
                    .anyMatch(p -> contract.getId().equals(p.jockeyInvitationId()));
            if (!alreadyLocked) {
                officialParticipants.add(mapInvitationToParticipantResponse(contract));
            }
        }
        return officialParticipants;
    }

    private TournamentParticipantResponse mapInvitationToParticipantResponse(JockeyInvitation invitation) {
        Tournament tournament = invitation.getTournament();
        TournamentRegistration registration = invitation.getTournamentRegistration();
        User owner = invitation.getOwner();
        User jockey = invitation.getJockey();
        return TournamentParticipantResponse.builder()
                .id(-invitation.getId())
                .championshipId(tournament.getId())
                .championshipName(tournament.getName())
                .horseRegistrationId(registration.getId())
                .horseId(invitation.getHorse().getId())
                .horseName(invitation.getHorse().getName())
                .ownerId(owner.getId())
                .ownerName(owner.getFullName())
                .jockeyId(jockey.getId())
                .jockeyName(jockey.getFullName())
                .jockeyInvitationId(invitation.getId())
                .status("PENDING_LOCK")
                .points(0)
                .createdAt(invitation.getCreatedAt())
                .updatedAt(invitation.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<TournamentParticipantResponse> listJockeyParticipants(String jockeyEmail) {
        User jockey = getUserWithRoles(jockeyEmail);
        requireRole(jockey, "JOCKEY", "Only approved jockeys can view official participants");
        return participantRepository.findAllByJockey_EmailOrderByCreatedAtDesc(jockeyEmail)
                .stream()
                .map(this::mapParticipantToResponse)
                .toList();
    }

    private void validateHorseRegistration(
            Long championshipId,
            String ownerEmail,
            TournamentRegistration registration
    ) {
        if (!Objects.equals(registration.getTournament().getId(), championshipId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Horse registration does not belong to this championship");
        }
        if (!registration.getOwner().getEmail().equals(ownerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Horse registration does not belong to current owner");
        }
        if (RegistrationStatus.APPROVED != registration.getStatus()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Horse registration must be approved before sending a contract");
        }
    }

    private void validateJockeyApplication(Long championshipId, JockeyTournamentApplication application) {
        if (!Objects.equals(application.getTournament().getId(), championshipId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Jockey application does not belong to this championship");
        }
        if (JockeyApplicationStatus.APPROVED_FOR_POOL != application.getStatus()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Jockey must be approved for the championship pool before receiving a contract");
        }
    }

    private void validateContractConflicts(
            Long championshipId,
            TournamentRegistration registration,
            JockeyTournamentApplication application
    ) {
        if (invitationRepository.existsByTournament_IdAndTournamentRegistration_IdAndStatusIn(
                championshipId,
                registration.getId(),
                ACTIVE_CONTRACT_STATUSES
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This horse registration already has an active contract");
        }
        if (participantRepository.existsByTournament_IdAndHorse_Id(championshipId, registration.getHorse().getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This horse already has an official participant");
        }
        if (participantRepository.existsByTournament_IdAndJockey_Id(championshipId, application.getJockey().getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This jockey is already committed in this championship");
        }
        if (invitationRepository.existsByTournament_IdAndJockey_IdAndStatusIn(
                championshipId,
                application.getJockey().getId(),
                ACTIVE_CONTRACT_STATUSES
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This jockey already has an active contract in this championship");
        }
    }

    private Tournament ensureTournamentExists(Long championshipId) {
        return tournamentRepository.findByIdAndDeletedAtIsNull(championshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Championship not found"));
    }

    private TournamentRegistration getRegistration(Long registrationId) {
        return registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Horse registration not found"));
    }

    private JockeyTournamentApplication getJockeyApplication(Long applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Jockey pool application not found"));
    }

    private JockeyInvitation getContractForJockey(Long contractId, String jockeyEmail) {
        return invitationRepository.findByIdAndJockey_Email(contractId, jockeyEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
    }

    private User getUserWithRoles(String email) {
        return userRepository.findWithUserRolesByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void syncParticipantToExistingRounds(TournamentParticipant participant, JockeyInvitation contract) {
        List<Race> races = raceRepository.findAllByTournamentIdAndDeletedAtIsNullOrderByRaceAtAsc(
                participant.getTournament().getId()
        );
        for (Race race : races) {
            if (raceParticipantRepository.existsByRace_IdAndHorse_Id(race.getId(), participant.getHorse().getId())) {
                continue;
            }
            raceParticipantRepository.save(RaceParticipant.registered(race, participant, contract));
        }
    }

    private void requireRole(User user, String role, String message) {
        if (!user.getActiveRoleNames().contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, message);
        }
    }

    private JockeyInvitationResponse mapToResponse(JockeyInvitation invitation) {
        Tournament tournament = invitation.getTournament();
        TournamentRegistration registration = invitation.getTournamentRegistration();
        User owner = invitation.getOwner();
        User jockey = invitation.getJockey();
        return JockeyInvitationResponse.builder()
                .id(invitation.getId())
                .championshipId(tournament.getId())
                .championshipName(tournament.getName())
                .horseRegistrationId(registration.getId())
                .horseId(invitation.getHorse().getId())
                .horseName(invitation.getHorse().getName())
                .ownerId(owner.getId())
                .ownerName(owner.getFullName())
                .jockeyId(jockey.getId())
                .jockeyName(jockey.getFullName())
                .jockeyApplicationId(invitation.getJockeyApplication().getId())
                .message(invitation.getMessage())
                .agreementUrl(invitation.getAgreementUrl())
                .agreementFileName(invitation.getAgreementFileName())
                .status(invitation.getStatus().name())
                .readAt(invitation.getReadAt())
                .acceptedAt(invitation.getAcceptedAt())
                .rejectedAt(invitation.getRejectedAt())
                .rejectionReason(invitation.getRejectionReason())
                .createdAt(invitation.getCreatedAt())
                .updatedAt(invitation.getUpdatedAt())
                .build();
    }

    private TournamentParticipantResponse mapParticipantToResponse(TournamentParticipant participant) {
        Tournament tournament = participant.getTournament();
        TournamentRegistration registration = participant.getTournamentRegistration();
        User owner = participant.getOwner();
        User jockey = participant.getJockey();
        return TournamentParticipantResponse.builder()
                .id(participant.getId())
                .championshipId(tournament.getId())
                .championshipName(tournament.getName())
                .horseRegistrationId(registration.getId())
                .horseId(participant.getHorse().getId())
                .horseName(participant.getHorse().getName())
                .ownerId(owner.getId())
                .ownerName(owner.getFullName())
                .jockeyId(jockey.getId())
                .jockeyName(jockey.getFullName())
                .jockeyInvitationId(participant.getJockeyInvitationId())
                .status(participant.getStatus().name())
                .points(participant.getPoints())
                .createdAt(participant.getCreatedAt())
                .updatedAt(participant.getUpdatedAt())
                .build();
    }
}
