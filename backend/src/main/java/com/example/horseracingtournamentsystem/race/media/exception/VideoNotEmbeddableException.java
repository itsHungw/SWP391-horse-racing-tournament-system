package com.example.horseracingtournamentsystem.race.media.exception;

public class VideoNotEmbeddableException extends RuntimeException {
    private final String errorCode;

    public VideoNotEmbeddableException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String errorCode() {
        return errorCode;
    }
}
