package com.example.horseracingtournamentsystem.user.service;

import com.example.horseracingtournamentsystem.user.entity.User;
import java.util.Set;

final class UserRolePolicy {

    private static final Set<String> SPECIALIST_ROLES = Set.of("HORSE_OWNER", "OWNER", "JOCKEY", "REFEREE");

    private UserRolePolicy() {
    }

    static Set<String> specialistRoles() {
        return SPECIALIST_ROLES;
    }

    static boolean isSpecialistRole(String roleName) {
        return roleName != null && SPECIALIST_ROLES.contains(roleName.trim().toUpperCase());
    }

    static boolean hasActiveSpecialistRole(User user) {
        return user.getActiveRoleNames().stream().anyMatch(UserRolePolicy::isSpecialistRole);
    }
}
