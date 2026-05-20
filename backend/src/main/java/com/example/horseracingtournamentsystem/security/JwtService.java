package com.example.horseracingtournamentsystem.security;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final byte[] secretKeyBytes;
    private final long expirationMinutes;

    public JwtService(
            @Value("${app.auth.jwt-secret}") String secretKey,
            @Value("${app.auth.access-token-ttl-minutes}") long expirationMinutes
      ) {
        this.secretKeyBytes = secretKey.getBytes();
        this.expirationMinutes = expirationMinutes;
    }

    public String generateToken(String email, Set<String> roles) {
        try {
            JWSSigner signer = new MACSigner(secretKeyBytes);
            Instant now = Instant.now();
            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(email)
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
                    .claim("roles", List.copyOf(roles))
                    .build();

            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimsSet);
            signedJWT.sign(signer);
            return signedJWT.serialize();
        } catch (Exception e) {
            throw new IllegalStateException("JWT_SIGNING_FAILED", e);
        }
    }

    public boolean validateToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new MACVerifier(secretKeyBytes);
            if (!signedJWT.verify(verifier)) {
                return false;
            }
            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            return expirationTime != null && expirationTime.after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public String extractEmail(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (Exception e) {
            throw new IllegalArgumentException("INVALID_TOKEN", e);
        }
    }

    @SuppressWarnings("unchecked")
    public Set<String> extractRoles(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            List<String> rolesList = (List<String>) signedJWT.getJWTClaimsSet().getClaim("roles");
            return rolesList == null ? Set.of() : Set.copyOf(rolesList);
        } catch (Exception e) {
            throw new IllegalArgumentException("INVALID_TOKEN", e);
        }
    }
}
