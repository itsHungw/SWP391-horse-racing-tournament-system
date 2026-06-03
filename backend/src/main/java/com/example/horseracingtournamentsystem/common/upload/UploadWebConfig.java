package com.example.horseracingtournamentsystem.common.upload;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class UploadWebConfig implements WebMvcConfigurer {
    private final UploadProperties uploadProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String rootUri = uploadProperties.getRoot().toAbsolutePath().normalize().toUri().toString();
        if (!rootUri.endsWith("/")) {
            rootUri = rootUri + "/";
        }
        registry.addResourceHandler("/uploads/**").addResourceLocations(rootUri);
    }
}
