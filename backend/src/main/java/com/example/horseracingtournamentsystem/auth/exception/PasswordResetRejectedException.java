package com.example.horseracingtournamentsystem.auth.exception;

public class PasswordResetRejectedException extends IllegalArgumentException {

    public PasswordResetRejectedException(String message) {
        super(message);
    }
}
