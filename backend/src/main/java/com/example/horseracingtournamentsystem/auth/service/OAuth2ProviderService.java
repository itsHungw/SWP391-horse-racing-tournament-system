package com.example.horseracingtournamentsystem.auth.service;

import com.example.horseracingtournamentsystem.auth.dto.response.OAuth2UserInfo;
import com.example.horseracingtournamentsystem.auth.enums.AuthProvider;

public interface OAuth2ProviderService {
    AuthProvider getProvider();
    OAuth2UserInfo verifyToken(String idToken);
}
