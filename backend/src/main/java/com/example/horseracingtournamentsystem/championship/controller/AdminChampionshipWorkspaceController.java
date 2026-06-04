package com.example.horseracingtournamentsystem.championship.controller;

import com.example.horseracingtournamentsystem.championship.dto.response.ChampionshipWorkspaceResponse;
import com.example.horseracingtournamentsystem.championship.service.AdminChampionshipWorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/championships")
@RequiredArgsConstructor
public class AdminChampionshipWorkspaceController {

    private final AdminChampionshipWorkspaceService workspaceService;

    @GetMapping("/{id}/workspace")
    public ChampionshipWorkspaceResponse getWorkspace(@PathVariable Long id) {
        return workspaceService.getWorkspace(id);
    }
}
