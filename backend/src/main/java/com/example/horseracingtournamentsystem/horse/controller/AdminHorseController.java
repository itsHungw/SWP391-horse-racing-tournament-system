package com.example.horseracingtournamentsystem.horse.controller;

import com.example.horseracingtournamentsystem.horse.dto.request.HorseRequest;
import com.example.horseracingtournamentsystem.horse.dto.response.HorseResponse;
import com.example.horseracingtournamentsystem.horse.service.HorseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/horses")
@RequiredArgsConstructor
public class AdminHorseController {

    private final HorseService horseService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HorseResponse createHorse(@Valid @RequestBody HorseRequest req) {
        return horseService.createHorse(req);
    }

    @PutMapping("/{id}")
    public HorseResponse updateHorse(@PathVariable Long id, @Valid @RequestBody HorseRequest req) {
        return horseService.updateHorse(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteHorse(@PathVariable Long id) {
        horseService.deleteHorse(id);
    }

    @GetMapping
    public List<HorseResponse> listAll() {
        return horseService.getAdminHorses();
    }

    @GetMapping("/{id}")
    public HorseResponse getDetail(@PathVariable Long id) {
        return horseService.getHorseDetail(id);
    }
}
