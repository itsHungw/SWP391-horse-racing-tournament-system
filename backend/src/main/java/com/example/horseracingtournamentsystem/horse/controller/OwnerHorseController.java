package com.example.horseracingtournamentsystem.horse.controller;

import com.example.horseracingtournamentsystem.horse.dto.request.OwnerHorseDocumentMultipartRequest;
import com.example.horseracingtournamentsystem.horse.dto.request.OwnerHorseMultipartRequest;
import com.example.horseracingtournamentsystem.horse.dto.response.HorseDocumentResponse;
import com.example.horseracingtournamentsystem.horse.dto.response.HorseResponse;
import com.example.horseracingtournamentsystem.horse.service.HorseService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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

    @GetMapping("/{id}")
    public HorseResponse getMine(Authentication authentication, @PathVariable Long id) {
        return horseService.getOwnerHorseDetail(authentication.getName(), id);
    }

    @GetMapping("/{id}/documents")
    public List<HorseDocumentResponse> listDocuments(Authentication authentication, @PathVariable Long id) {
        return horseService.getOwnerHorseDocuments(authentication.getName(), id);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public HorseResponse create(Authentication authentication, @Valid @ModelAttribute OwnerHorseMultipartRequest request) {
        return horseService.createOwnerHorse(authentication.getName(), request);
    }

    @PostMapping(path = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public HorseDocumentResponse createDocument(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @ModelAttribute OwnerHorseDocumentMultipartRequest request
    ) {
        return horseService.createOwnerHorseDocument(authentication.getName(), id, request);
    }
}
