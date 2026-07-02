package com.example.horseracingtournamentsystem.auth.service;

import com.example.horseracingtournamentsystem.auth.dto.response.OAuth2UserInfo;
import com.example.horseracingtournamentsystem.auth.enums.AuthProvider;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.Collections;

@Service
public class GoogleOAuth2ProviderService implements OAuth2ProviderService {

    // Optional: empty when Google login isn't configured (e.g. tests, or a deploy
    // without GOOGLE_CLIENT_ID). Empty means the app still boots; only Google
    // token verification is unavailable. Matches ${GOOGLE_CLIENT_ID:} in application.yml.
    @Value("${app.auth.google-client-id:}")
    private String googleClientId;

    @Override
    public AuthProvider getProvider() {
        return AuthProvider.GOOGLE;
    }

    @Override
    public OAuth2UserInfo verifyToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    new GsonFactory()
            )
            .setAudience(Collections.singletonList(googleClientId))
            .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new IllegalArgumentException("INVALID_GOOGLE_ID_TOKEN");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            return new OAuth2UserInfo(
                payload.getSubject(),
                payload.getEmail(),
                (String) payload.get("name"),
                (String) payload.get("picture")
            );
        } catch (Exception e) {
            throw new IllegalArgumentException("GOOGLE_AUTH_VERIFICATION_FAILED", e);
        }
    }
}
