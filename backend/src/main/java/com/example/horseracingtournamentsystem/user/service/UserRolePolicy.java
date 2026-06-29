package com.example.horseracingtournamentsystem.user.service;

import com.example.horseracingtournamentsystem.user.entity.User;
import java.util.Set;

public final class UserRolePolicy {

    public static final String ORGANIZER_SEPARATION_MESSAGE =
            "Personal participation accounts cannot register organizer workspaces. Use a separate account for organizing.";

    private static final Set<String> PERSONAL_ROLES = Set.of("HORSE_OWNER", "OWNER", "JOCKEY", "REFEREE");
    private static final Set<String> BUSINESS_ROLES = Set.of("ORGANIZER");

    private UserRolePolicy() {
    }

    public static Set<String> personalRoles() {
        return PERSONAL_ROLES;
    }

    public static boolean isPersonalRole(String roleName) {
        return roleName != null && PERSONAL_ROLES.contains(roleName.trim().toUpperCase());
    }

    public static boolean hasActiveBusinessRole(User user) {
        return user.getActiveRoleNames().stream().anyMatch(UserRolePolicy::isBusinessRole);
    }

    public static boolean hasActivePersonalRole(User user) {
        return user.getActiveRoleNames().stream().anyMatch(UserRolePolicy::isPersonalRole);
    }

    private static boolean isBusinessRole(String roleName) {
        return roleName != null && BUSINESS_ROLES.contains(roleName.trim().toUpperCase());
    }
}
