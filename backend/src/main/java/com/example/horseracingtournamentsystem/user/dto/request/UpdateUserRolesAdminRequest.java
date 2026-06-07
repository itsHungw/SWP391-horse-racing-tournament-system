package com.example.horseracingtournamentsystem.user.dto.request;

import java.util.Set;

public record UpdateUserRolesAdminRequest(
    Set<Long> roleIds,
    String reason
) {}
