package com.example.horseracingtournamentsystem.security;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findWithUserRolesByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        var authorities = new java.util.ArrayList<>(user.getActiveRoleNames().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList());
        authorities.add(new SimpleGrantedAuthority("ACCOUNT_" + user.getStatus().name()));
        return new AccountAwareUserDetails(
                user.getId(), user.getEmail(), user.getPasswordHash(), user.getStatus(), List.copyOf(authorities));
    }
}
