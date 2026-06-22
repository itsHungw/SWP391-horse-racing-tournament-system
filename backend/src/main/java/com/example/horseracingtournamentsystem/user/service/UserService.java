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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
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

        // Update status field using reflection or direct setter if available. Since there's no setter, we set via reflection or adapt.
        // Wait, User has a private status. Let's see if we can set it.
        // In User.java:
        // private String status;
        // There is no setStatus() method. Let's check how we change status.
        // In User.java: verifyEmail() sets this.status = STATUS_ACTIVE.
        // user.setStatus(status);
        // Let's modify User.java to add a method for changing status!
        try {
            java.lang.reflect.Field field = User.class.getDeclaredField("status");
            field.setAccessible(true);
            field.set(user, request.status());
        } catch (Exception e) {
            throw new RuntimeException("Failed to update status field on User entity", e);
        }

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
        Set<Long> targetRoleIds = request.roleIds();

        if (targetRoleIds != null && targetRoleIds.size() > 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A user can have at most 2 roles");
        }

        Role spectator = roleRepository.findByName("SPECTATOR")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "SPECTATOR role not configured"));
        
        boolean currentlyHasSpectator = currentRoleNames.contains("SPECTATOR");
        boolean targetHasSpectator = targetRoleIds != null && targetRoleIds.contains(spectator.getId());
        if (currentlyHasSpectator != targetHasSpectator) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SPECTATOR role status cannot be modified by administrators");
        }

        // Prevent removing the last admin in the system
        if (currentRoleNames.contains("ADMIN") && (targetRoleIds == null || !targetRoleIds.stream().anyMatch(roleId -> {
            Role r = roleRepository.findById(roleId).orElse(null);
            return r != null && "ADMIN".equals(r.getName());
        }))) {
            if (userRepository.countActiveAdmins() <= 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot remove the last administrator from the system");
            }
        }

        String auditReason = request.reason() == null || request.reason().isBlank() ? "Updated by admin" : request.reason();

        // Find the active non-SPECTATOR UserRole
        UserRole activeNonSpectatorUserRole = user.getUserRoles().stream()
                .filter(ur -> ur.isActive() && !ur.getRole().getName().equals("SPECTATOR"))
                .findFirst()
                .orElse(null);

        // Find the target non-SPECTATOR Role ID
        Long targetNonSpectatorRoleId = targetRoleIds.stream()
                .filter(rid -> !rid.equals(spectator.getId()))
                .findFirst()
                .orElse(null);

        if (activeNonSpectatorUserRole != null && targetNonSpectatorRoleId != null) {
            // If they changed the role, update the existing record
            if (!activeNonSpectatorUserRole.getRole().getId().equals(targetNonSpectatorRoleId)) {
                Role newRole = roleRepository.findById(targetNonSpectatorRoleId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role not found: " + targetNonSpectatorRoleId));
                
                String oldRoleName = activeNonSpectatorUserRole.getRole().getName();
                
                activeNonSpectatorUserRole.changeRole(newRole, adminUser);
                userRoleRepository.save(activeNonSpectatorUserRole);
                
                String transitionReason = String.format("Changed role from %s to %s. Reason: %s", oldRoleName, newRole.getName(), auditReason);
                UserRoleHistory history = UserRoleHistory.record(activeNonSpectatorUserRole, com.example.horseracingtournamentsystem.user.enums.UserRoleStatus.ACTIVE, com.example.horseracingtournamentsystem.user.enums.UserRoleStatus.ACTIVE, adminUser, transitionReason);
                userRoleHistoryRepository.save(history);
            }
        } else if (activeNonSpectatorUserRole != null) {
            // User had a non-spectator role, but now it was unassigned
            activeNonSpectatorUserRole.remove(adminUser);
            userRoleRepository.save(activeNonSpectatorUserRole);
            
            UserRoleHistory history = UserRoleHistory.record(activeNonSpectatorUserRole, com.example.horseracingtournamentsystem.user.enums.UserRoleStatus.ACTIVE, com.example.horseracingtournamentsystem.user.enums.UserRoleStatus.REMOVED, adminUser, auditReason);
            userRoleHistoryRepository.save(history);
        } else if (targetNonSpectatorRoleId != null) {
            // User did not have a non-spectator role, and now we are adding one
            // Check if there is an inactive/removed UserRole for this role that we can reactivate
            UserRole existingUserRole = user.getUserRoles().stream()
                    .filter(ur -> ur.getRole().getId().equals(targetNonSpectatorRoleId))
                    .findFirst()
                    .orElse(null);

            if (existingUserRole != null) {
                com.example.horseracingtournamentsystem.user.enums.UserRoleStatus oldStatus = existingUserRole.getStatus();
                existingUserRole.reactivate(adminUser);
                userRoleRepository.save(existingUserRole);
                
                UserRoleHistory history = UserRoleHistory.record(existingUserRole, oldStatus, com.example.horseracingtournamentsystem.user.enums.UserRoleStatus.ACTIVE, adminUser, auditReason);
                userRoleHistoryRepository.save(history);
            } else {
                Role role = roleRepository.findById(targetNonSpectatorRoleId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role not found: " + targetNonSpectatorRoleId));
                UserRole newUserRole = UserRole.active(user, role, adminUser);
                userRoleRepository.save(newUserRole);
                
                UserRoleHistory history = UserRoleHistory.record(newUserRole, null, com.example.horseracingtournamentsystem.user.enums.UserRoleStatus.ACTIVE, adminUser, auditReason);
                userRoleHistoryRepository.save(history);
            }
        }

        return AdminUserDetailResponse.from(userRepository.save(user));
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

        try {
            java.lang.reflect.Field field = User.class.getDeclaredField("status");
            field.setAccessible(true);
            field.set(user, com.example.horseracingtournamentsystem.user.enums.UserStatus.BANNED);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update status field on User entity", e);
        }

        userRepository.save(user);
    }
}
