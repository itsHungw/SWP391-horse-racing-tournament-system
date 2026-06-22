package com.example.horseracingtournamentsystem.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Horse Racing Tournament System API")
                        .version("1.0.0")
                        .description("""
                                REST API for the Horse Racing Tournament System (B2B2C platform).

                                **Demo the business flow top-to-bottom** — the groups below are numbered in order. \
                                Click **Authorize** and paste the `accessToken` from `POST /api/v1/auth/login` (no `Bearer ` prefix).

                                1. **Auth** — register, verify email, login (JWT).
                                2. **Organizer onboarding (KYB)** — submit organization; Admin approves (Gate 1) → ORGANIZER role (re-login).
                                3. **Tournament** — organizer creates + submits; Admin approves launch (Gate 2); organizer opens registration.
                                4. **Entries** — owner registers a horse; jockey applies to the pool; organizer approves both.
                                5. **Field** — owner contracts a jockey → jockey accepts → organizer locks the field.
                                6. **Officials** — organizer hires referees → referee accepts.
                                7. **Race card** — organizer creates rounds + assigns referees, then publishes the schedule.
                                8. **Race day** — the assigned referee runs each round (checks → start → finish → submit results).
                                9. **Results** — organizer confirms then publishes → predictions settle + championship standings update.

                                Admin is governance + monitoring only (3 gates: onboarding, tournament approval, dispute review).
                                """))
                .components(new Components()
                        .addSecuritySchemes("bearer-jwt", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));
    }
}
