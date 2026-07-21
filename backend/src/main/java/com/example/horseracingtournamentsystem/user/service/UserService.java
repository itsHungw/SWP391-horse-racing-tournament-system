package com.example.horseracingtournamentsystem.user.service;

import com.example.horseracingtournamentsystem.user.dto.request.CreateUserAdminRequest;
import com.example.horseracingtournamentsystem.user.dto.request.UpdateUserProfileAdminRequest;
import com.example.horseracingtournamentsystem.user.dto.request.UpdateUserRolesAdminRequest;
import com.example.horseracingtournamentsystem.user.dto.request.UpdateUserProfileRequest;
import com.example.horseracingtournamentsystem.user.dto.response.AdminUserDetailResponse;
import com.example.horseracingtournamentsystem.user.dto.response.UserProfileResponse;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.entity.UserRoleHistory;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleHistoryRepository;
import com.example.horseracingtournamentsystem.user.enums.UserRoleStatus;
import java.util.HashSet;
import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserRoleHistoryRepository userRoleHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = userRepository.findWithUserRolesByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return UserProfileResponse.from(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateUserProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.updateProfile(
                request.fullName(),
                request.phone(),
                request.gender(),
                request.dateOfBirth(),
                request.address(),
                request.avatarUrl()
        );

        User savedUser = userRepository.save(user);
        return UserProfileResponse.from(savedUser);
    }

    // ==========================================
    // ADMIN OPERATIONS (CRUD & ROLE CONTROL)
    // ==========================================

    @Transactional(readOnly = true)
    public Page<AdminUserDetailResponse> searchActiveUsers(String query, com.example.horseracingtournamentsystem.user.enums.UserStatus status, String role, Pageable pageable) {
        String searchQuery = query == null ? "" : query;
        Page<User> usersPage = userRepository.searchUsers(searchQuery, status, role, pageable);
        return usersPage.map(AdminUserDetailResponse::from);
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserDetailsForAdmin(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getDeletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "User has been deleted");
        }
        return AdminUserDetailResponse.from(user);
    }

    @Transactional(readOnly = true)
    public List<UserRoleHistory> getRecentRoleHistory(Long userId) {
        return userRoleHistoryRepository.findRecentHistoryByUserId(userId);
    }

    @Transactional
    public AdminUserDetailResponse createUserByAdmin(CreateUserAdminRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        String encodedPassword = passwordEncoder.encode(request.password());
        User user = User.pending(request.fullName(), request.email(), encodedPassword, request.phone());
        user.verifyEmail(); // Admin created accounts are verified automatically
        user.updateProfile(
            request.fullName(),
            request.phone(),
            request.gender(),
            request.dateOfBirth(),
            request.address(),
            null
        );

        User savedUser = userRepository.save(user);

        // Auto-assign SPECTATOR role
        Role spectator = roleRepository.findByName("SPECTATOR")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SPECTATOR role not configured"));
        UserRole spectatorUserRole = UserRole.active(savedUser, spectator, null);
        userRoleRepository.save(spectatorUserRole);

        // Assign Additional Roles
        if (request.roleIds() != null && !request.roleIds().isEmpty()) {
            if (request.roleIds().contains(spectator.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot explicitly assign SPECTATOR role");
            }
            if (request.roleIds().size() + 1 > 2) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A user can have at most 2 roles");
            }

            for (Long roleId : request.roleIds()) {
                Role role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role not found: " + roleId));
                if ("ORGANIZER".equals(role.getName())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "ORGANIZER role is managed through organization approval and cannot be assigned here");
                }
                UserRole userRole = UserRole.active(savedUser, role, null);
                userRoleRepository.save(userRole);
            }
        }

        return AdminUserDetailResponse.from(savedUser);
    }

    @Transactional
    public AdminUserDetailResponse updateUserProfileByAdmin(Long id, UpdateUserProfileAdminRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getDeletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "User has been deleted");
        }

        user.updateProfile(
                request.fullName(),
                request.phone(),
                request.gender(),
                request.dateOfBirth(),
                request.address(),
                user.getAvatarUrl()
        );

        User savedUser = userRepository.save(user);
        return AdminUserDetailResponse.from(savedUser);
    }

    @Transactional
    public AdminUserDetailResponse updateUserRolesByAdmin(Long id, UpdateUserRolesAdminRequest request, String currentAdminEmail) {
        User user = userRepository.findWithUserRolesByEmail(userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")).getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getDeletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "User has been deleted");
        }

        User adminUser = userRepository.findByEmail(currentAdminEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin user not found"));

        Set<String> currentRoleNames = user.getActiveRoleNames();
        Map<String, Role> targetRolesByName = resolveTargetRoles(request);
        Set<String> targetRoleNames = targetRolesByName.keySet();

        Role spectator = roleRepository.findByName("SPECTATOR")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SPECTATOR role not configured"));
        
        boolean currentlyHasSpectator = currentRoleNames.contains("SPECTATOR");
        boolean targetHasSpectator = targetRoleNames.contains(spectator.getName());
        if (currentlyHasSpectator != targetHasSpectator) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SPECTATOR role status cannot be modified by administrators");
        }

        boolean currentlyHasOrganizer = currentRoleNames.contains("ORGANIZER");
        boolean targetHasOrganizer = targetRoleNames.contains("ORGANIZER");
        if (currentlyHasOrganizer != targetHasOrganizer) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "ORGANIZER role is managed through organization approval and cannot be changed here");
        }

        boolean targetHasBusinessRole = targetHasOrganizer;
        boolean targetHasPersonalRole = targetRoleNames.stream().anyMatch(UserRolePolicy::isPersonalRole);
        if (targetHasBusinessRole && targetHasPersonalRole) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, UserRolePolicy.ORGANIZER_SEPARATION_MESSAGE);
        }

        // Prevent removing the last admin in the system
        if (currentRoleNames.contains("ADMIN") && !targetRoleNames.contains("ADMIN")) {
            if (userRepository.countActiveAdmins() <= 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot remove the last administrator from the system");
            }
        }

        String auditReason = request.reason() == null || request.reason().isBlank() ? "Updated by admin" : request.reason();

        Set<String> managedTargetRoleNames = new HashSet<>(targetRoleNames);
        managedTargetRoleNames.remove("SPECTATOR");

        user.getUserRoles().stream()
                .filter(userRole -> userRole.isActive())
                .filter(userRole -> !"SPECTATOR".equals(userRole.getRole().getName()))
                .filter(userRole -> !managedTargetRoleNames.contains(userRole.getRole().getName()))
                .forEach(userRole -> {
                    userRole.remove(adminUser);
                    userRoleRepository.save(userRole);
                    userRoleHistoryRepository.save(UserRoleHistory.record(
                            userRole, UserRoleStatus.ACTIVE, UserRoleStatus.REMOVED, adminUser, auditReason
                    ));
                });

        managedTargetRoleNames.forEach(roleName -> {
            UserRole existingUserRole = findUserRole(user, roleName).orElse(null);
            if (existingUserRole == null) {
                UserRole newUserRole = UserRole.active(user, targetRolesByName.get(roleName), adminUser);
                userRoleRepository.save(newUserRole);
                userRoleHistoryRepository.save(UserRoleHistory.record(
                        newUserRole, null, UserRoleStatus.ACTIVE, adminUser, auditReason
                ));
                return;
            }

            if (!existingUserRole.isActive()) {
                UserRoleStatus oldStatus = existingUserRole.getStatus();
                existingUserRole.reactivate(adminUser);
                userRoleRepository.save(existingUserRole);
                userRoleHistoryRepository.save(UserRoleHistory.record(
                        existingUserRole, oldStatus, UserRoleStatus.ACTIVE, adminUser, auditReason
                ));
            }
        });

        return AdminUserDetailResponse.from(userRepository.save(user));
    }

    private Map<String, Role> resolveTargetRoles(UpdateUserRolesAdminRequest request) {
        if (request.roleNames() != null) {
            return request.roleNames().stream()
                    .map(this::normalizeRoleName)
                    .map(roleName -> roleRepository.findByName(roleName)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role not found: " + roleName)))
                    .collect(Collectors.toMap(Role::getName, Function.identity(), (first, ignored) -> first));
        }

        Set<Long> roleIds = request.roleIds() == null ? Set.of() : request.roleIds();
        return roleIds.stream()
                .map(roleId -> roleRepository.findById(roleId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role not found: " + roleId)))
                .collect(Collectors.toMap(Role::getName, Function.identity(), (first, ignored) -> first));
    }

    private String normalizeRoleName(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role name is required");
        }
        return roleName.trim().toUpperCase(Locale.ROOT);
    }

    private Optional<UserRole> findUserRole(User user, String roleName) {
        return user.getUserRoles().stream()
                .filter(userRole -> roleName.equals(userRole.getRole().getName()))
                .filter(UserRole::isActive)
                .findFirst()
                .or(() -> user.getUserRoles().stream()
                        .filter(userRole -> roleName.equals(userRole.getRole().getName()))
                        .findFirst());
    }

    @Transactional
    public void softDeleteUser(Long id, String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrators cannot ban their own accounts");
        }

        // Prevent banning if it's the last admin
        if (user.getActiveRoleNames().contains("ADMIN")) {
            if (userRepository.countActiveAdmins() <= 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot ban the last administrator in the system");
            }
        }

        user.ban();

        userRepository.save(user);
    }
}
