package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.filestorage.FileStorageService;
import com.example.horseracingtournamentsystem.filestorage.StoredFileMetadataRepository;
import com.example.horseracingtournamentsystem.wallet.config.WithdrawalPaymentProperties;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WithdrawalReceiptCleanupService {

    private final StoredFileMetadataRepository metadataRepository;
    private final FileStorageService fileStorageService;
    private final WithdrawalPaymentProperties properties;

    @Scheduled(cron = "${wallet.withdrawal.payment.orphan-cleanup-cron:0 30 3 * * *}")
    public void deleteOrphans() {
        LocalDateTime before = LocalDateTime.now().minus(properties.orphanReceiptExpiry());
        metadataRepository.findOrphanWithdrawalReceipts(before)
                .forEach(file -> fileStorageService.deleteStoredFile(file.getFilename()));
    }
}
