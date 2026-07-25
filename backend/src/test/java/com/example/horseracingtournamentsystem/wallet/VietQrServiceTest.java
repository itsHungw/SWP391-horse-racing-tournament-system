package com.example.horseracingtournamentsystem.wallet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.wallet.config.WithdrawalPaymentProperties;
import com.example.horseracingtournamentsystem.wallet.dto.WithdrawalPaymentInstructionResponse;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.service.VietQrService;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class VietQrServiceTest {

    private VietQrService service;

    @BeforeEach
    void setUp() {
        service = new VietQrService(new WithdrawalPaymentProperties(
                "WD{withdrawalId}",
                5_242_880,
                Set.of("image/jpeg", "image/png", "image/webp"),
                Duration.ofHours(24)));
    }

    @Test
    void buildsTrustedVietQrPayloadFromApprovedSnapshot() {
        WithdrawalRequest request = request(123L, "970436", "0123456789");

        WithdrawalPaymentInstructionResponse result = service.instructionFor(request);

        assertTrue(result.available());
        assertEquals("WD000123", result.transferContent());
        assertEquals("970436", tlv(result.payload(), "38", "01", "00"));
        assertEquals("0123456789", tlv(result.payload(), "38", "01", "01"));
        assertEquals("250000", tlv(result.payload(), "54"));
        assertEquals("704", tlv(result.payload(), "53"));
        assertTrue(validCrc(result.payload()));
    }

    @Test
    void returnsManualFallbackWithoutTrustedBin() {
        WithdrawalRequest request = request(124L, null, "0123456789");

        WithdrawalPaymentInstructionResponse result = service.instructionFor(request);

        assertFalse(result.available());
        assertEquals("BANK_BIN_UNAVAILABLE", result.unavailableReason());
        assertNull(result.payload());
        assertEquals("WD000124", result.transferContent());
    }

    private WithdrawalRequest request(Long id, String bin, String accountNumber) {
        WithdrawalRequest request = mock(WithdrawalRequest.class);
        when(request.getId()).thenReturn(id);
        when(request.getAmount()).thenReturn(250_000L);
        when(request.getBankBin()).thenReturn(bin);
        when(request.getBankCode()).thenReturn("VCB");
        when(request.getBankName()).thenReturn("Vietcombank");
        when(request.getAccountNumber()).thenReturn(accountNumber);
        when(request.getAccountHolder()).thenReturn("MAI TRAN");
        return request;
    }

    private String tlv(String payload, String... path) {
        String current = payload;
        for (String wanted : path) {
            int offset = 0;
            String found = null;
            while (offset + 4 <= current.length()) {
                String id = current.substring(offset, offset + 2);
                int length = Integer.parseInt(current.substring(offset + 2, offset + 4));
                String value = current.substring(offset + 4, offset + 4 + length);
                if (id.equals(wanted)) {
                    found = value;
                    break;
                }
                offset += 4 + length;
            }
            if (found == null) {
                throw new AssertionError("Missing TLV field " + wanted);
            }
            current = found;
        }
        return current;
    }

    private boolean validCrc(String payload) {
        String input = payload.substring(0, payload.length() - 4);
        return payload.endsWith(referenceCrc16(input));
    }

    private String referenceCrc16(String input) {
        int crc = 0xFFFF;
        for (byte item : input.getBytes(StandardCharsets.UTF_8)) {
            crc ^= (item & 0xFF) << 8;
            for (int bit = 0; bit < 8; bit++) {
                crc = (crc & 0x8000) == 0 ? crc << 1 : (crc << 1) ^ 0x1021;
                crc &= 0xFFFF;
            }
        }
        return "%04X".formatted(crc);
    }
}
