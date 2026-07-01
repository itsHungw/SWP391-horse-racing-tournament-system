package com.example.horseracingtournamentsystem.auth.dto.response;

public record OAuth2UserInfo(
    String providerId,
    String email,
    String fullName,
    String avatarUrl
) {}
