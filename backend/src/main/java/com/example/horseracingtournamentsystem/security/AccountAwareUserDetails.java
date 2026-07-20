package com.example.horseracingtournamentsystem.security;

import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import java.util.Collection;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record AccountAwareUserDetails(
        Long userId,
        String username,
        String password,
        UserStatus accountStatus,
        Collection<? extends GrantedAuthority> authorities
) implements UserDetails {

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isEnabled() {
        return accountStatus == UserStatus.ACTIVE
                || accountStatus == UserStatus.SUSPENDED
                || accountStatus == UserStatus.BANNED;
    }
}
