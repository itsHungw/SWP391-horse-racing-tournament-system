package com.example.horseracingtournamentsystem.user.service;

import com.example.horseracingtournamentsystem.user.dto.request.SubmitRoleRequestRequest;
import com.example.horseracingtournamentsystem.user.dto.response.UserRoleRequestResponse;
import com.example.horseracingtournamentsystem.user.entity.RoleRequest;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.RoleRequestRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserRoleRequestService {

    private final RoleRequestRepository roleRequestRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserRoleRequestResponse> listMine(String email) {
        return roleRequestRepository.findByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(UserRoleRequestResponse::from)
                .toList();
    }

    @Transactional
    public UserRoleRequestResponse submit(String email, SubmitRoleRequestRequest request) {
        User user = userRepository.findWithUserRolesByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!user.isProfileCompleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Complete your profile before requesting a role");
        }

        String requestedRole = request.requestedRole().trim().toUpperCase();
        if (UserRolePolicy.isPersonalRole(requestedRole) && UserRolePolicy.hasActiveBusinessRole(user)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Organizer accounts cannot request personal participation roles");
        }

        boolean alreadyPending = roleRequestRepository.existsByUserEmailAndRequestedRoleAndStatus(
                email,
                requestedRole,
                com.example.horseracingtournamentsystem.user.enums.RoleRequestStatus.PENDING
        );
        if (alreadyPending) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A pending request for this role already exists");
        }

        RoleRequest roleRequest = RoleRequest.pending(
                user,
                requestedRole,
                request.reason().trim(),
                request.resumeUrl().trim()
        );
        return UserRoleRequestResponse.from(roleRequestRepository.save(roleRequest));
    }
}
