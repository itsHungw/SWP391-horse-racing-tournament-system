package com.example.horseracingtournamentsystem.security;

import jakarta.annotation.PostConstruct;
import java.util.Arrays;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ProductionCookiePropertiesValidator {

    private final Environment environment;
    private final boolean refreshCookieSecure;

    public ProductionCookiePropertiesValidator(
            Environment environment,
            @Value("${app.auth.refresh-cookie-secure:false}") boolean refreshCookieSecure
    ) {
        this.environment = environment;
        this.refreshCookieSecure = refreshCookieSecure;
    }

    @PostConstruct
    void validate() {
        boolean productionProfile = Arrays.stream(environment.getActiveProfiles())
                .anyMatch("prod"::equalsIgnoreCase);
        if (productionProfile && !refreshCookieSecure) {
            throw new IllegalStateException("app.auth.refresh-cookie-secure must be true when the prod profile is active");
        }
    }
}
