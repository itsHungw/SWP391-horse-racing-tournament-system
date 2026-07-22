package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.wallet.config.WithdrawalPaymentProperties;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalPaymentInstructionResponse;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VietQrService {

    private static final String NAPAS_GUID = "A000000727";
    private static final String ACCOUNT_TRANSFER_SERVICE = "QRIBFTTA";

    private final WithdrawalPaymentProperties properties;

    public WithdrawalPaymentInstructionResponse instructionFor(WithdrawalRequest request) {
        String transferContent = properties.transferContentTemplate()
                .replace("{withdrawalId}", "%06d".formatted(request.getId()));
        if (request.getBankBin() == null || request.getBankBin().isBlank()
                || request.getAccountNumber() == null || request.getAccountNumber().isBlank()) {
            return WithdrawalPaymentInstructionResponse.manual(
                    "BANK_BIN_UNAVAILABLE", transferContent, request);
        }

        String beneficiary = field("00", request.getBankBin())
                + field("01", request.getAccountNumber());
        String merchantAccount = field("00", NAPAS_GUID)
                + field("01", beneficiary)
                + field("02", ACCOUNT_TRANSFER_SERVICE);
        String withoutCrc = field("00", "01")
                + field("01", "12")
                + field("38", merchantAccount)
                + field("53", "704")
                + field("54", Long.toString(request.getAmount()))
                + field("58", "VN")
                + field("62", field("08", transferContent))
                + "6304";
        return WithdrawalPaymentInstructionResponse.qr(
                withoutCrc + crc16(withoutCrc), transferContent, request);
    }

    private String field(String id, String value) {
        int length = value.getBytes(StandardCharsets.UTF_8).length;
        if (length > 99) {
            throw new IllegalArgumentException("VietQR field is too long: " + id);
        }
        return id + "%02d".formatted(length) + value;
    }

    private String crc16(String value) {
        int crc = 0xFFFF;
        for (byte item : value.getBytes(StandardCharsets.UTF_8)) {
            crc ^= (item & 0xFF) << 8;
            for (int bit = 0; bit < 8; bit++) {
                crc = (crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1;
                crc &= 0xFFFF;
            }
        }
        return "%04X".formatted(crc);
    }
}
