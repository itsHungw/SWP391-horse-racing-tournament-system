package com.example.horseracingtournamentsystem.championship.service;

import com.example.horseracingtournamentsystem.championship.dto.request.InviteRefereeRequest;
import com.example.horseracingtournamentsystem.championship.dto.response.RefereeContractResponse;
import com.example.horseracingtournamentsystem.championship.dto.response.RefereeDirectoryResponse;
import com.example.horseracingtournamentsystem.championship.entity.RefereeContract;
import com.example.horseracingtournamentsystem.championship.repository.RefereeContractRepository;
import com.example.horseracingtournamentsystem.organization.entity.Organization;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.RefereeProfile;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.RefereeProfileRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.notification.service.NotificationService;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Thuê trọng tài theo giải (BR-06/07/08/14). Organizer (chủ tổ chức sở hữu giải)
 * mời referee đã được nền tảng cấp phép; referee accept/decline; organizer terminate.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RefereeContractService {

    private static final String REFEREE_ROLE = "REFEREE";
    private static final List<String> ACTIVE_INVITE_STATUSES =
            List.of(RefereeContract.STATUS_PENDING, RefereeContract.STATUS_ACTIVE);
    private static final Set<RaceStatus> UPCOMING_RACE_STATUSES = Set.of(RaceStatus.SCHEDULED);

    private final RefereeContractRepository refereeContractRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final RaceRepository raceRepository;
    private final RefereeProfileRepository refereeProfileRepository;
    private final NotificationService notificationService;

    @Transactional
    public RefereeContractResponse invite(String organizerEmail, Long tournamentId, InviteRefereeRequest request) {
        Tournament tournament = requireManagedTournament(tournamentId, organizerEmail);
        tournament.assertOrganizationOperational();
        User inviter = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        User referee = userRepository.findById(request.refereeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Referee not found"));
        User refereeWithRoles = userRepository.findWithUserRolesByEmail(referee.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Referee not found"));
        if (!refereeWithRoles.getActiveRoleNames().contains(REFEREE_ROLE)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected user is not a licensed referee");
        }

        if (refereeContractRepository.existsByTournament_IdAndReferee_IdAndStatusIn(
                tournamentId, referee.getId(), ACTIVE_INVITE_STATUSES)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Referee already has a pending or active contract for this tournament");
        }

        RefereeContract contract = RefereeContract.invite(
                tournament, referee, inviter, normalize(request.agreementUrl()), normalize(request.message()));
        RefereeContract saved = refereeContractRepository.save(contract);
        notificationService.notify(referee, "REFEREE_INVITED", "New refereeing invitation",
                "You’ve been invited to officiate “" + tournament.getName() + "”.",
                "TOURNAMENT", tournament.getId());
        return RefereeContractResponse.from(saved);
    }

    public List<RefereeContractResponse> listForTournament(String organizerEmail, Long tournamentId) {
        requireManagedTournament(tournamentId, organizerEmail);
        return refereeContractRepository.findAllByTournament_IdOrderByCreatedAtDesc(tournamentId)
                .stream().map(RefereeContractResponse::from).toList();
    }

    public List<RefereeContractResponse> listMine(String refereeEmail) {
        return refereeContractRepository.findAllByReferee_EmailOrderByCreatedAtDesc(refereeEmail)
                .stream().map(RefereeContractResponse::from).toList();
    }

    /** Danh bạ referee đã cấp phép (role REFEREE active) để organizer chọn mời. */
    public List<RefereeDirectoryResponse> listLicensedReferees() {
        return userRepository.findActiveByRoleName(REFEREE_ROLE).stream()
                .map(user -> {
                    RefereeProfile profile = refereeProfileRepository.findByUserId(user.getId()).orElse(null);
                    return new RefereeDirectoryResponse(
                            user.getId(),
                            user.getFullName(),
                            user.getEmail(),
                            profile == null ? null : profile.getLicenseNumber(),
                            profile == null ? null : profile.getExperienceYears(),
                            profile == null ? null : profile.getCertification());
                })
                .toList();
    }

    @Transactional
    public RefereeContractResponse accept(Long contractId, String refereeEmail) {
        RefereeContract contract = getForReferee(contractId, refereeEmail);
        contract.accept(refereeEmail);
        RefereeContract saved = refereeContractRepository.save(contract);
        notificationService.notify(contract.getInvitedBy(), "CONTRACT_ACCEPTED", "Referee accepted",
                contract.getReferee().getFullName() + " accepted your invitation for “"
                        + contract.getTournament().getName() + "”.",
                "TOURNAMENT", contract.getTournament().getId());
        return RefereeContractResponse.from(saved);
    }

    @Transactional
    public RefereeContractResponse decline(Long contractId, String refereeEmail, String reason) {
        RefereeContract contract = getForReferee(contractId, refereeEmail);
        contract.decline(refereeEmail, normalize(reason));
        RefereeContract saved = refereeContractRepository.save(contract);
        notificationService.notify(contract.getInvitedBy(), "CONTRACT_DECLINED", "Referee declined",
                contract.getReferee().getFullName() + " declined your invitation for “"
                        + contract.getTournament().getName() + "”.",
                "TOURNAMENT", contract.getTournament().getId());
        return RefereeContractResponse.from(saved);
    }

    @Transactional
    public RefereeContractResponse terminate(Long contractId, String organizerEmail, String reason) {
        RefereeContract contract = refereeContractRepository.findById(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
        requireManagedTournament(contract.getTournament().getId(), organizerEmail).assertOrganizationOperational();
        User actor = userRepository.findByEmail(organizerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        contract.terminate(actor, normalize(reason));

        // BR-14: gỡ referee khỏi các race CHƯA diễn ra; giữ nguyên race đã chạy để bảo toàn lịch sử.
        raceRepository.findAllByTournamentIdAndRefereeIdAndDeletedAtIsNull(
                        contract.getTournament().getId(), contract.getReferee().getId())
                .stream()
                .filter(race -> UPCOMING_RACE_STATUSES.contains(race.getStatus()))
                .forEach(race -> {
                    race.assignReferee(null);
                    raceRepository.save(race);
                });

        RefereeContract saved = refereeContractRepository.save(contract);
        notificationService.notify(contract.getReferee(), "CONTRACT_TERMINATED", "Contract ended",
                "Your contract for “" + contract.getTournament().getName() + "” was terminated.",
                "TOURNAMENT", contract.getTournament().getId());
        return RefereeContractResponse.from(saved);
    }

    private Tournament requireManagedTournament(Long tournamentId, String organizerEmail) {
        Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(tournamentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
        Organization organization = tournament.getOrganization();
        if (organization == null || organization.getOwner() == null
                || !organization.getOwner().getEmail().equals(organizerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not manage this tournament");
        }
        return tournament;
    }

    private RefereeContract getForReferee(Long contractId, String refereeEmail) {
        return refereeContractRepository.findByIdAndReferee_Email(contractId, refereeEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
