package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.user.dto.request.AccountStatusTransitionRequest;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.wallet.dto.WalletControlResponse;
import com.example.horseracingtournamentsystem.wallet.dto.WalletStatusHistoryResponse;
import com.example.horseracingtournamentsystem.wallet.entity.Wallet;
import com.example.horseracingtournamentsystem.wallet.entity.WalletStatus;
import com.example.horseracingtournamentsystem.wallet.entity.WalletStatusHistory;
import com.example.horseracingtournamentsystem.wallet.repository.WalletRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WalletStatusHistoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class WalletEnforcementService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletStatusHistoryRepository historyRepository;

    @Transactional(readOnly = true)
    public WalletControlResponse getControl(Long userId) {
        User target = target(userId);
        WalletStatus status = walletRepository.findById(target.getId())
                .map(Wallet::getStatus).orElse(WalletStatus.ACTIVE);
        return WalletControlResponse.of(target.getId(), status);
    }

    @Transactional
    public WalletControlResponse lock(Long userId, AccountStatusTransitionRequest request, String actorEmail) {
        User target = target(userId);
        User actor = actor(actorEmail);
        validateNotSelf(target, actor);
        return lockInternal(target, actor, request.reason(), request.internalNote());
    }

    @Transactional
    public WalletControlResponse unlock(Long userId, AccountStatusTransitionRequest request, String actorEmail) {
        User target = target(userId);
        User actor = actor(actorEmail);
        validateNotSelf(target, actor);
        Wallet wallet = walletRepository.lockByUserId(target.getId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.CONFLICT, "Wallet is already active"));
        if (!wallet.isLocked()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Wallet is already active");
        }
        wallet.unlock();
        historyRepository.save(WalletStatusHistory.record(
                target, WalletStatus.LOCKED, WalletStatus.ACTIVE, actor, request.reason(), request.internalNote()));
        return WalletControlResponse.of(target.getId(), WalletStatus.ACTIVE);
    }

    @Transactional
    public WalletControlResponse lockForSuspension(
            User target, User actor, String reason, String internalNote) {
        return lockInternal(target, actor, reason, internalNote);
    }

    @Transactional(readOnly = true)
    public List<WalletStatusHistoryResponse> history(Long userId) {
        target(userId);
        return historyRepository.findByUserIdOrderByChangedAtDescIdDesc(userId).stream()
                .map(WalletStatusHistoryResponse::from)
                .toList();
    }

    private WalletControlResponse lockInternal(
            User target, User actor, String reason, String internalNote) {
        Wallet wallet = walletRepository.lockByUserId(target.getId()).orElse(null);
        if (wallet == null) {
            wallet = walletRepository.save(Wallet.create(target));
        }
        if (wallet.isLocked()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Wallet is already locked");
        }
        wallet.lock();
        historyRepository.save(WalletStatusHistory.record(
                target, WalletStatus.ACTIVE, WalletStatus.LOCKED, actor, reason, internalNote));
        return WalletControlResponse.of(target.getId(), WalletStatus.LOCKED);
    }

    private User target(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getDeletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "User has been deleted");
        }
        return user;
    }

    private User actor(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin user not found"));
    }

    private void validateNotSelf(User target, User actor) {
        if (target.getId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrators cannot enforce their own wallet");
        }
    }
}
