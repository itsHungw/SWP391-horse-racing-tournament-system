package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.filestorage.FileStorageService;
import com.example.horseracingtournamentsystem.wallet.config.WithdrawalPaymentProperties;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class WithdrawalReceiptService {

    private final FileStorageService fileStorageService;
    private final WithdrawalPaymentProperties properties;

    public StoredReceipt store(MultipartFile file, String adminEmail) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receipt is required");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receipt cannot be read");
        }

        String detected = detect(bytes);
        String declared = file.getContentType() == null
                ? ""
                : file.getContentType().trim().toLowerCase(Locale.ROOT);
        if (!properties.allowedReceiptTypes().contains(detected)
                || !detected.equals(declared)
                || bytes.length > properties.receiptMaxBytes()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Receipt must be a supported image under the configured limit");
        }

        FileStorageService.StoredFile stored = fileStorageService.storeFile(
                file, "WITHDRAWAL_RECEIPT", adminEmail);
        return new StoredReceipt(stored.filename(), sha256(bytes));
    }

    public void delete(String filename) {
        fileStorageService.deleteStoredFile(filename);
    }

    private String detect(byte[] bytes) {
        if (isPng(bytes)) {
            return "image/png";
        }
        if (isJpeg(bytes)) {
            return "image/jpeg";
        }
        if (isWebp(bytes)) {
            return "image/webp";
        }
        return "application/octet-stream";
    }

    private boolean isPng(byte[] value) {
        byte[] signature = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        return value.length >= signature.length
                && IntStream.range(0, signature.length)
                .allMatch(index -> value[index] == signature[index]);
    }

    private boolean isJpeg(byte[] value) {
        return value.length >= 3
                && value[0] == (byte) 0xFF
                && value[1] == (byte) 0xD8
                && value[2] == (byte) 0xFF;
    }

    private boolean isWebp(byte[] value) {
        return value.length >= 12
                && new String(value, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
                && new String(value, 8, 4, StandardCharsets.US_ASCII).equals("WEBP");
    }

    private String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    public record StoredReceipt(String filename, String checksum) {
    }
}
