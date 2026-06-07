package com.example.horseracingtournamentsystem.auth.email;

public interface EmailSender {

    void sendEmailVerification(String email, String rawToken);

    void sendPasswordReset(String email, String rawToken);
}
