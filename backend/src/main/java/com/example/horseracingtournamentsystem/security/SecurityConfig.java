package com.example.horseracingtournamentsystem.security;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.ObjectMapper;


@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties({ CorsProperties.class, AppSecurityProperties.class })
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthFilter;
        // private final RateLimitingFilter rateLimitingFilter;
        private final AppSecurityProperties securityProperties;
        private final ObjectMapper objectMapper;

        @Bean
        public RateLimitingFilter rateLimitingFilter() {
                return new RateLimitingFilter(securityProperties, objectMapper);
        }

        @Bean
        SecurityFilterChain securityFilterChain(
                        HttpSecurity http,
                        RestAuthenticationEntryPoint authenticationEntryPoint,
                        RestAccessDeniedHandler accessDeniedHandler) throws Exception {
                return http
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(Customizer.withDefaults())
                                .formLogin(AbstractHttpConfigurer::disable)
                                .httpBasic(AbstractHttpConfigurer::disable)
                                .logout(AbstractHttpConfigurer::disable)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .headers(headers -> headers
                                                .contentSecurityPolicy(csp -> csp.policyDirectives(
                                                                securityProperties.getContentSecurityPolicy()))
                                                .referrerPolicy(referrer -> referrer.policy(
                                                                org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                                                .frameOptions(frameOptions -> frameOptions.deny())
                                                .permissionsPolicyHeader(policy -> policy
                                                                .policy("camera=(), microphone=(), geolocation=()")))
                                .exceptionHandling(exceptions -> exceptions
                                                .authenticationEntryPoint(authenticationEntryPoint)
                                                .accessDeniedHandler(accessDeniedHandler))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/error",
                                                                "/uploads/**",
                                                                "/api/v1/auth/**",
                                                                "/api/v1/files/download/**",
                                                                "/v3/api-docs",
                                                                "/v3/api-docs/**",
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html")
                                                .permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/v1/horses/**",
                                                                "/api/v1/tournaments/**", "/api/v1/races/**", "/api/v1/blogs/**",
                                                                "/api/v1/standings/**", "/api/v1/championships/*/standings",
                                                                "/api/v1/leaderboard/**")
                                                .permitAll()
                                                
                                                       
                                                       
                                                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/v1/owner/**").hasRole("HORSE_OWNER")
                                                .requestMatchers("/api/v1/jockey/**").hasRole("JOCKEY")
                                                .requestMatchers("/api/v1/referee/**").hasRole("REFEREE")
                                                .anyRequest().authenticated())
                                .addFilterBefore(rateLimitingFilter(), UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                                .build();
        }

        @Bean
        PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }


        @Bean
        CorsConfigurationSource corsConfigurationSource(CorsProperties properties) {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(properties.getAllowedOrigins());
                configuration.setAllowedMethods(properties.getAllowedMethods());
                configuration.setAllowedHeaders(properties.getAllowedHeaders());
                configuration.setAllowCredentials(properties.isAllowCredentials());
                configuration.setMaxAge(3600L);


                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}
