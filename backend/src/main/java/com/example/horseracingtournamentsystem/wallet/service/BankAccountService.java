package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.wallet.dto.CreateBankAccountRequest;
import com.example.horseracingtournamentsystem.wallet.entity.BankDirectory;
import com.example.horseracingtournamentsystem.wallet.entity.UserBankAccount;
import com.example.horseracingtournamentsystem.wallet.repository.BankDirectoryRepository;
import com.example.horseracingtournamentsystem.wallet.repository.UserBankAccountRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class BankAccountService {

    private static final int MAX_ACCOUNTS = 10;

    private final UserBankAccountRepository repository;
    private final BankDirectoryRepository bankDirectoryRepository;

    @Transactional(readOnly = true)
    public List<UserBankAccount> listMine(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public UserBankAccount add(User user, CreateBankAccountRequest request) {
        String bankCode = trimmed(request.bankCode());
        String accountNumber = request.accountNumber() == null ? "" : request.accountNumber().replaceAll("\\s", "");
        String accountHolder = trimmed(request.accountHolder());

        if (bankCode.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bank is required");
        }
        BankDirectory bank = bankDirectoryRepository.findByCodeIgnoreCaseAndActiveTrue(bankCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Bank is not supported"));
        if (accountNumber.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid account number");
        }
        if (accountHolder.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter the account holder name");
        }
        if (repository.countByUserId(user.getId()) >= MAX_ACCOUNTS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You have reached the saved-account limit");
        }

        String label = request.label() == null || request.label().isBlank() ? null : request.label().trim();
        return repository.save(UserBankAccount.create(
                user, bank, accountNumber, accountHolder.toUpperCase(), label));
    }

    @Transactional(readOnly = true)
    public List<BankDirectory> listActiveBanks() {
        return bankDirectoryRepository.findByActiveTrueOrderByDisplayNameAsc();
    }

    @Transactional
    public void delete(Long id, String userEmail) {
        UserBankAccount account = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bank account not found"));
        if (!account.ownedBy(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only remove your own bank accounts");
        }
        repository.delete(account);
    }

    private String trimmed(String value) {
        return value == null ? "" : value.trim();
    }
}
