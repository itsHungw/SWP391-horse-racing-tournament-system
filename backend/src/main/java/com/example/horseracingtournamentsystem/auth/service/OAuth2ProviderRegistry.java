package com.example.horseracingtournamentsystem.auth.service;

import com.example.horseracingtournamentsystem.auth.enums.AuthProvider;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class OAuth2ProviderRegistry {

    private final Map<AuthProvider, OAuth2ProviderService> providerServices;

    public OAuth2ProviderRegistry(List<OAuth2ProviderService> services) {
        this.providerServices = services.stream()
            .collect(Collectors.toUnmodifiableMap(
                OAuth2ProviderService::getProvider,
                Function.identity()
            ));
    }

    public OAuth2ProviderService getService(AuthProvider provider) {
        OAuth2ProviderService service = providerServices.get(provider);
        if (service == null) {
            throw new IllegalArgumentException("UNSUPPORTED_AUTH_PROVIDER: " + provider);
        }
        return service;
    }
}
