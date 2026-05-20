package com.example.horseracingtournamentsystem.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

class CustomUserDetailsServiceTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final CustomUserDetailsService userDetailsService = new CustomUserDetailsService(userRepository);

    @Test
    void shouldLoadUserByEmailSuccessfully() {
        User dummyUser = User.pending("Nguyen A", "a@example.com", "hashpwd");
        dummyUser.verifyEmail(); // Active user
        when(userRepository.findByEmail("a@example.com")).thenReturn(Optional.of(dummyUser));

        UserDetails userDetails = userDetailsService.loadUserByUsername("a@example.com");

        assertNotNull(userDetails);
        assertEquals("a@example.com", userDetails.getUsername());
        assertEquals("hashpwd", userDetails.getPassword());
        assertTrue(userDetails.isEnabled());
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> {
            userDetailsService.loadUserByUsername("unknown@example.com");
        });
    }
}
