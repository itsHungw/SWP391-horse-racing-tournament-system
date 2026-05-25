package com.example.horseracingtournamentsystem.horse.controller;

import com.example.horseracingtournamentsystem.horse.dto.response.HorseResponse;
import com.example.horseracingtournamentsystem.horse.service.HorseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/horses")
@RequiredArgsConstructor
public class HorseController {

    private final HorseService horseService;

    @GetMapping
    public List<HorseResponse> listPublic() {
        return horseService.getPublicHorses();
    }

    @GetMapping("/{id}")
    public HorseResponse getPublicDetail(@PathVariable Long id) {
        return horseService.getPublicHorseDetail(id);
    }
}
