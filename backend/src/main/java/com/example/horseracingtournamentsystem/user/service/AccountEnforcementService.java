package com.example.horseracingtournamentsystem.user.service;

import com.example.horseracingtournamentsystem.user.dto.request.AccountStatusTransitionRequest;
import com.example.horseracingtournamentsystem.user.dto.request.SuspendAccountRequest;
import com.example.horseracingtournamentsystem.user.dto.response.AdminUserDetailResponse;
import com.example.horseracingtournamentsystem.user.dto.response.UserStatusHistoryResponse;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserStatusHistory;
import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserStatusHistoryRepository;
import com.example.horseracingtournamentsystem.wallet.entity.Wallet;
import com.example.horseracingtournamentsystem.wallet.repository.WalletRepository;
import com.example.horseracingtournamentsystem.wallet.service.WalletEnforcementService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AccountEnforcementService {

    private final UserRepository userRepository;
    private final UserStatusHistoryRepository historyRepository;
    private final WalletRepository walletRepository;
    private final WalletEnforcementService walletEnforcementService;

    @Transactional
    public AdminUserDetailResponse suspend(Long userId, SuspendAccountRequest request, String actorEmail) {
        User target = targetWithRoles(userId);
        User actor = actor(actorEmail);
        validateActor(target, actor);
        requireStatus(target, UserStatus.ACTIVE, "Only an active account can be suspended");
        protectLastActiveAdmin(target);

        boolean walletLocked = walletIsLocked(target);
        if (request.lockWallet() && !walletLocked) {
            walletEnforcementService.lockForSuspension(
                    target, actor, request.reason(), request.internalNote());
            walletLocked = true;
        }
        return transition(target, actor, UserStatus.SUSPENDED, request.reason(), request.internalNote(), walletLocked);
    }

    @Transactional
    public AdminUserDetailResponse restore(Long userId, AccountStatusTransitionRequest request, String actorEmail) {
        User target = targetWithRoles(userId);
        User actor = actor(actorEmail);
        validateActor(target, actor);
        requireStatus(target, UserStatus.SUSPENDED, "Only a suspended account can be restored");
        return transition(target, actor, UserStatus.ACTIVE, request.reason(), request.internalNote(), walletIsLocked(target));
    }

    @Transactional
    public AdminUserDetailResponse ban(Long userId, AccountStatusTransitionRequest request, String actorEmail) {
        User target = targetWithRoles(userId);
        User actor = actor(actorEmail);
        validateActor(target, actor);
        requireStatus(target, UserStatus.SUSPENDED, "An account must be suspended before it can be banned");
        return transition(target, actor, UserStatus.BANNED, request.reason(), request.internalNote(), walletIsLocked(target));
    }

    @Transactional
    public AdminUserDetailResponse reopen(Long userId, AccountStatusTransitionRequest request, String actorEmail) {
        User target = targetWithRoles(userId);
        User actor = actor(actorEmail);
        validateActor(target, actor);
        requireStatus(target, UserStatus.BANNED, "Only a banned account can be reopened for review");
        return transition(target, actor, UserStatus.SUSPENDED, request.reason(), request.internalNote(), walletIsLocked(target));
    }

    @Transactional(readOnly = true)
    public List<UserStatusHistoryResponse> history(Long userId) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (target.getDeletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "User has been deleted");
        }
        return historyRepository.findByUserIdOrderByChangedAtDescIdDesc(userId).stream()
                .map(UserStatusHistoryResponse::from)
                .toList();
    }

    private AdminUserDetailResponse transition(
            User target, User actor, UserStatus nextStatus, String reason, String internalNote, boolean walletLocked) {
        UserStatus oldStatus = target.getStatus();
        target.changeStatus(nextStatus);
        historyRepository.save(UserStatusHistory.record(
                target, oldStatus, nextStatus, actor, reason, internalNote, walletLocked));
        return AdminUserDetailResponse.from(target);
    }

    private User targetWithRoles(Long userId) {
        User basic = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (basic.getDeletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "User has been deleted");
        }
        return userRepository.findWithUserRolesByEmail(basic.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private User actor(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin user not found"));
    }

    private void validateActor(User target, User actor) {
        if (target.getId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrators cannot enforce their own account");
        }
    }

    private void protectLastActiveAdmin(User target) {
        if (target.getActiveRoleNames().contains("ADMIN") && userRepository.countActiveAdmins() <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot suspend the last active administrator");
        }
    }

    private void requireStatus(User target, UserStatus expected, String message) {
        if (target.getStatus() != expected) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, message);
        }
    }

    private boolean walletIsLocked(User target) {
        return walletRepository.findById(target.getId()).map(Wallet::isLocked).orElse(false);
    }
}
