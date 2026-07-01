package com.example.horseracingtournamentsystem.race.media.exception;

public class ProviderUnavailableException extends RuntimeException {
    private final String errorCode;

    public ProviderUnavailableException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String errorCode() {
        return errorCode;
    }
}
