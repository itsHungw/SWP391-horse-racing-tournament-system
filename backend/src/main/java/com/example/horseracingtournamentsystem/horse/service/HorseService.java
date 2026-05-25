package com.example.horseracingtournamentsystem.horse.service;

import com.example.horseracingtournamentsystem.horse.dto.request.HorseRequest;
import com.example.horseracingtournamentsystem.horse.dto.response.HorseResponse;
import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HorseService {

    private final HorseRepository horseRepository;
    private final UserRepository userRepository;

    @Transactional
    public HorseResponse createHorse(HorseRequest req) {
        User owner = userRepository.findById(req.getOwnerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

        String code = "HORSE_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Horse horse = Horse.create(
                owner, req.getName(), code, req.getBreed(),
                req.getGender().toUpperCase(), req.getDateOfBirth(), req.getColor()
        );

        horseRepository.save(horse);
        return mapToResponse(horse);
    }

    @Transactional
    public HorseResponse updateHorse(Long id, HorseRequest req) {
        Horse horse = horseRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));

        User owner = userRepository.findById(req.getOwnerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

        horse.update(req.getName(), req.getBreed(), req.getGender().toUpperCase(), req.getDateOfBirth(), req.getColor());
        horseRepository.save(horse);
        return mapToResponse(horse);
    }

    @Transactional
    public void deleteHorse(Long id) {
        Horse horse = horseRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));
        horse.setInactive();
        horse.softDelete();
        horseRepository.save(horse);
    }

    public HorseResponse getHorseDetail(Long id) {
        Horse horse = horseRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));
        return mapToResponse(horse);
    }

    public List<HorseResponse> getAdminHorses() {
        return horseRepository.findAllByDeletedAtIsNull().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<HorseResponse> getPublicHorses() {
        return horseRepository.findAllByStatusAndDeletedAtIsNull("APPROVED").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public HorseResponse getPublicHorseDetail(Long id) {
        Horse horse = horseRepository.findByIdAndStatusAndDeletedAtIsNull(id, "APPROVED")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Active horse not found"));
        return mapToResponse(horse);
    }

    private HorseResponse mapToResponse(Horse h) {
        return HorseResponse.builder()
                .id(h.getId())
                .ownerId(h.getOwner().getId())
                .ownerName(h.getOwner().getFullName())
                .name(h.getName())
                .registrationCode(h.getRegistrationCode())
                .breed(h.getBreed())
                .gender(h.getGender())
                .dateOfBirth(h.getDateOfBirth())
                .color(h.getColor())
                .status(h.getStatus())
                .createdAt(h.getCreatedAt())
                .updatedAt(h.getUpdatedAt())
                .build();
    }
}
