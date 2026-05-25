package com.example.horseracingtournamentsystem.user.service;

import com.example.horseracingtournamentsystem.user.dto.request.UpdateUserProfileRequest;
import com.example.horseracingtournamentsystem.user.dto.response.UserProfileResponse;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

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
}
