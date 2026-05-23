package com.example.horseracingtournamentsystem.user.controller;

import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {

    @GetMapping
    public Map<String, Object> me(Authentication authentication) {
        return Map.of("subject", authentication.getName());
    }
}
