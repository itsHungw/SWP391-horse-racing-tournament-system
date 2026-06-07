package com.example.horseracingtournamentsystem.point.controller;

import com.example.horseracingtournamentsystem.point.dto.PointSettingResponse;
import com.example.horseracingtournamentsystem.point.dto.UpdatePointSettingsRequest;
import com.example.horseracingtournamentsystem.point.service.PointSettingsService;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/point-settings")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPointSettingsController {

    private final PointSettingsService pointSettingsService;

    @GetMapping
    public PointSettingResponse getSettings() {
        return pointSettingsService.getSettings();
    }

    @PutMapping
    public PointSettingResponse updateSettings(
            @Valid @RequestBody UpdatePointSettingsRequest request,
            Principal principal
    ) {
        return pointSettingsService.updateSettings(request, principal.getName());
    }
}
