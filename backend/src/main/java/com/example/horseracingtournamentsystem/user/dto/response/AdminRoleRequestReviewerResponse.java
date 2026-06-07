package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.User;

public record AdminRoleRequestReviewerResponse(
        Long id,
        String fullName,
        String email
) {
    public static AdminRoleRequestReviewerResponse from(User user) {
        if (user == null) {
            return null;
        }
        return new AdminRoleRequestReviewerResponse(user.getId(), user.getFullName(), user.getEmail());
    }
}
