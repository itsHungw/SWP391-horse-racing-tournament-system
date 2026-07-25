package com.example.horseracingtournamentsystem.dispute.service;

import com.example.horseracingtournamentsystem.dispute.dto.AccountAppealResponse;
import com.example.horseracingtournamentsystem.dispute.dto.CreateAccountAppealRequest;
import com.example.horseracingtournamentsystem.dispute.dto.DisputeResponse;
import com.example.horseracingtournamentsystem.dispute.entity.Dispute;
import com.example.horseracingtournamentsystem.dispute.enums.DisputeReferenceType;
import com.example.horseracingtournamentsystem.dispute.repository.DisputeRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserStatusHistory;
import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AccountAppealService {

    private final UserRepository userRepository;
    private final UserStatusHistoryRepository historyRepository;
    private final DisputeRepository disputeRepository;
    private final DisputeService disputeService;

    @Transactional(readOnly = true)
    public AccountAppealResponse getCurrent(User user) {
        requireRestricted(user);
        UserStatusHistory decision = latestDecision(user.getId(), false);
        Dispute appeal = disputeRepository.findByRequesterIdAndReferenceTypeAndReferenceId(
                user.getId(), DisputeReferenceType.ACCOUNT_ENFORCEMENT, decision.getId()).orElse(null);
        return response(decision, appeal == null ? null : disputeService.toResponse(appeal));
    }

    @Transactional
    public AccountAppealResponse create(User authenticatedUser, CreateAccountAppealRequest request) {
        User user = userRepository.findByIdForUpdate(authenticatedUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        requireRestricted(user);
        UserStatusHistory decision = latestDecision(user.getId(), true);
        if (disputeRepository.existsByRequesterIdAndReferenceTypeAndReferenceId(
                user.getId(), DisputeReferenceType.ACCOUNT_ENFORCEMENT, decision.getId())) {
            throw conflict("An appeal already exists for this decision");
        }
        try {
            DisputeResponse appeal = disputeService.createAccountAppeal(
                    user, decision.getId(), decision.getNewStatus().name(), request);
            return response(decision, appeal);
        } catch (DataIntegrityViolationException exception) {
            throw conflict("An appeal already exists for this decision");
        }
    }

    private UserStatusHistory latestDecision(Long userId, boolean lock) {
        return (lock
                ? historyRepository.findLatestByUserIdForUpdate(userId, PageRequest.of(0, 1))
                : historyRepository.findByUserIdOrderByChangedAtDescIdDesc(userId))
                .stream().findFirst()
                .filter(history -> isRestricted(history.getNewStatus()))
                .orElseThrow(() -> conflict("No restricted account decision is available to appeal"));
    }

    private void requireRestricted(User user) {
        if (!isRestricted(user.getStatus())) {
            throw conflict("Only suspended or banned accounts can appeal");
        }
    }

    private boolean isRestricted(UserStatus status) {
        return status == UserStatus.SUSPENDED || status == UserStatus.BANNED;
    }

    private AccountAppealResponse response(UserStatusHistory decision, DisputeResponse appeal) {
        return new AccountAppealResponse(decision.getId(), decision.getNewStatus(),
                decision.getPublicReason(), decision.getChangedAt(), appeal);
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
