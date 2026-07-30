package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.wallet.dto.WalletTransactionDetailResponse;
import com.example.horseracingtournamentsystem.wallet.entity.TopUpOrder;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.repository.TopUpOrderRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Chi tiết một bút toán cho chính chủ ví. Chỉ đọc — sổ cái là append-only. */
@Service
@RequiredArgsConstructor
public class WalletTransactionDetailService {

    private final WalletTransactionRepository transactionRepository;
    private final TopUpOrderRepository topUpOrderRepository;

    /**
     * Bút toán của người khác trả 404 chứ không phải 403: 403 vẫn xác nhận bút toán đó có tồn
     * tại, cho phép dò id để biết người khác có giao dịch hay không.
     */
    @Transactional(readOnly = true)
    public WalletTransactionDetailResponse detailForUser(Long transactionId, Long userId) {
        WalletTransaction transaction = transactionRepository.findById(transactionId)
                .filter(candidate -> candidate.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));

        TopUpOrder order = null;
        if (WalletTransaction.REF_TOPUP_ORDER.equals(transaction.getReferenceType())
                && transaction.getReferenceId() != null) {
            order = topUpOrderRepository.findById(transaction.getReferenceId()).orElse(null);
        }
        return WalletTransactionDetailResponse.of(transaction, order);
    }
}
