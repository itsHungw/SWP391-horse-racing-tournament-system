package com.example.horseracingtournamentsystem.security;

import static org.junit.jupiter.api.Assertions.*;

import com.example.horseracingtournamentsystem.user.entity.User;
import java.util.Set;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String DUMMY_SECRET = "this-is-a-very-long-secret-key-containing-at-least-256-bits-which-is-required-for-hs256";
    private final JwtService jwtService = new JwtService(DUMMY_SECRET, 15);

    @Test
    void shouldGenerateAndExtractTokenSuccessfully() {
        User user = User.pending("Hung Vinh", "vinhung@example.com", "hash");
        
        String token = jwtService.generateToken(user.getEmail(), Set.of("SPECTATOR"));
        assertNotNull(token);

        assertTrue(jwtService.validateToken(token));
        assertEquals("vinhung@example.com", jwtService.extractEmail(token));
        
        Set<String> roles = jwtService.extractRoles(token);
        assertTrue(roles.contains("SPECTATOR"));
    }

    @Test
    void shouldReturnFalseForInvalidToken() {
        assertFalse(jwtService.validateToken("invalid-token-string"));
    }
}
