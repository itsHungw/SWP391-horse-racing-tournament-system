package com.example.horseracingtournamentsystem.horse.controller;

import com.example.horseracingtournamentsystem.horse.dto.request.OwnerHorseRequest;
import com.example.horseracingtournamentsystem.horse.dto.response.HorseResponse;
import com.example.horseracingtournamentsystem.horse.service.HorseService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/owner/horses")
@RequiredArgsConstructor
public class OwnerHorseController {

    private final HorseService horseService;

    @GetMapping
    public List<HorseResponse> listMine(Authentication authentication) {
        return horseService.getOwnerHorses(authentication.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HorseResponse create(Authentication authentication, @Valid @RequestBody OwnerHorseRequest request) {
        return horseService.createOwnerHorse(authentication.getName(), request);
    }
}
