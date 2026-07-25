package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.wallet.dto.AdminWithdrawalReviewResponse;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import java.util.UUID;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class WithdrawalPaymentService {

    private final WithdrawalRequestRepository withdrawalRepository;
    private final WithdrawalReceiptService receiptService;
    private final WithdrawalService withdrawalService;
    private final AdminWithdrawalReviewService reviewService;

    public AdminWithdrawalReviewResponse confirm(
            Long id,
            String adminEmail,
            String transferReference,
            String internalNote,
            boolean mismatchAcknowledged,
            String idempotencyKey,
            MultipartFile receipt
    ) {
        validateIdempotencyKey(idempotencyKey);
        WithdrawalRequest existing = withdrawalRepository
                .findByPaymentIdempotencyKey(idempotencyKey)
                .orElse(null);
        if (existing != null) {
            if (!existing.getId().equals(id)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Idempotency key belongs to another withdrawal");
            }
            return reviewService.get(id);
        }

        validateReferenceAndMismatch(transferReference, internalNote, mismatchAcknowledged);
        String normalizedReference = transferReference.trim().toUpperCase(Locale.ROOT);
        if (withdrawalRepository.existsByTransferReference(normalizedReference)) {
            throw duplicateEvidence();
        }
        WithdrawalReceiptService.StoredReceipt stored = receiptService.store(receipt, adminEmail);
        if (withdrawalRepository.existsByPaymentReceiptChecksum(stored.checksum())) {
            receiptService.delete(stored.filename());
            throw duplicateEvidence();
        }
        WithdrawalRequest result;
        try {
            result = withdrawalService.markPaid(
                    id,
                    adminEmail,
                    normalizedReference,
                    internalNote,
                    stored.filename(),
                    stored.checksum(),
                    idempotencyKey);
        } catch (DataIntegrityViolationException exception) {
            receiptService.delete(stored.filename());
            throw duplicateEvidence();
        } catch (RuntimeException exception) {
            receiptService.delete(stored.filename());
            throw exception;
        }

        if (!stored.filename().equals(result.getPaymentReceiptFilename())) {
            receiptService.delete(stored.filename());
        }
        return reviewService.get(id);
    }

    private ResponseStatusException duplicateEvidence() {
        return new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This transfer reference or receipt is already attached to another withdrawal");
    }

    private void validateIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid idempotency key");
        }
        try {
            UUID.fromString(idempotencyKey);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid idempotency key");
        }
    }

    private void validateReferenceAndMismatch(
            String transferReference,
            String internalNote,
            boolean mismatchAcknowledged
    ) {
        if (transferReference == null || transferReference.isBlank()
                || transferReference.trim().length() > 120) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Transfer reference is required");
        }
        if (internalNote != null && internalNote.length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Internal note is too long");
        }
        if (mismatchAcknowledged && (internalNote == null || internalNote.isBlank())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Receipt mismatches require an internal note");
        }
    }
}
