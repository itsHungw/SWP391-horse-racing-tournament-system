package com.example.horseracingtournamentsystem.filestorage;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StoredFileMetadataRepository extends JpaRepository<StoredFileMetadata, Long> {

    Optional<StoredFileMetadata> findByFilename(String filename);

    @Query("""
            select file from StoredFileMetadata file
            where file.category = 'WITHDRAWAL_RECEIPT'
              and file.createdAt < :before
              and not exists (
                  select withdrawal.id from WithdrawalRequest withdrawal
                  where withdrawal.paymentReceiptFilename = file.filename
              )
            """)
    List<StoredFileMetadata> findOrphanWithdrawalReceipts(
            @Param("before") LocalDateTime before);
}
