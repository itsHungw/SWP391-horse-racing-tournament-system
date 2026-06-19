package com.example.horseracingtournamentsystem.user.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.util.Set;
import org.junit.jupiter.api.Test;
import com.example.horseracingtournamentsystem.user.enums.UserStatus;

class UserEntityMappingTest {

    @Test
    void pendingUserCanBeCreated() {
        User user = User.pending("Spectator One", "spectator@example.com", "hashed-password");

        assertEquals(UserStatus.PENDING_EMAIL_VERIFY, user.getStatus());
        assertFalse(user.isEmailVerified());
    }

    @Test
    void activeSpectatorRoleIsVisibleThroughActiveRoleNames() {
        User user = User.pending("Spectator One", "spectator@example.com", "hashed-password");
        Role spectator = Role.of("SPECTATOR", "Can watch races");
        Role suspendedRole = Role.of("OWNER", "Can manage horses");

        UserRole.active(user, spectator, null);
        UserRole inactiveRole = UserRole.active(user, suspendedRole, null);
        inactiveRole.suspend();

        assertEquals(Set.of("SPECTATOR"), user.getActiveRoleNames());
    }
}
