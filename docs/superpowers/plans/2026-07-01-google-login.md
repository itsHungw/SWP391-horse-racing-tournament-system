# Google Login Integration Implementation Plan

Implement Google Login (Sign-In with Google) using an extensible OAuth2 provider abstraction. This allows users to authenticate seamlessly via Google and automatically registers new users with the `SPECTATOR` role and `ACTIVE` status.

## User Review Required

> [!IMPORTANT]
> The system requires a `GOOGLE_CLIENT_ID` configuration. You must set `GOOGLE_CLIENT_ID` in your backend `.env` or system environment, and `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`.

## Open Questions

None. The user has approved Option 1 (specifying SPECTATOR role, ACTIVE status, and linking existing users by email).

---

## Proposed Changes

### Database Migration

#### [NEW] [V21__add_oauth_provider.sql](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/resources/db/migration/V21__add_oauth_provider.sql)
Create database columns `auth_provider` and `provider_id` in `users` table to track OAuth authentication type.

### Backend - Common & Entities

#### [NEW] [AuthProvider.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/auth/enums/AuthProvider.java)
Define enum for auth providers (`LOCAL`, `GOOGLE`, `FACEBOOK`, `APPLE`).

#### [MODIFY] [User.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/User.java)
Add `authProvider` and `providerId` fields, along with helper methods to link account and update avatars.

### Backend - Google API Dependency

#### [MODIFY] [pom.xml](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/pom.xml)
Add Maven dependencies `google-api-client` and `google-http-client-gson`.

### Backend - Extensible OAuth2 Infrastructure

#### [NEW] [OAuth2UserInfo.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/auth/dto/response/OAuth2UserInfo.java)
Common DTO representing extracted OAuth user profile information.

#### [NEW] [OAuth2ProviderService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/OAuth2ProviderService.java)
Interface for verifying tokens and returning profile details.

#### [NEW] [OAuth2ProviderRegistry.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/OAuth2ProviderRegistry.java)
Registry component to map providers to their service implementations.

#### [NEW] [GoogleOAuth2ProviderService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/GoogleOAuth2ProviderService.java)
Implementation verifying Google ID Tokens locally using Google libraries.

#### [MODIFY] [application.yml](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/resources/application.yml)
Bind Google client ID config properties.

### Backend - Auth Integration

#### [NEW] [OAuth2LoginRequest.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/auth/dto/request/OAuth2LoginRequest.java)
Generic login request body containing `idToken`.

#### [MODIFY] [AuthService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/AuthService.java)
Implement `loginWithOAuth` linking and dynamic registration logic.

#### [MODIFY] [AuthController.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/auth/controller/AuthController.java)
Add `POST /api/v1/auth/oauth/{provider}` controller endpoint.

### Frontend Integration

#### [MODIFY] [authApi.ts](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/api/authApi.ts)
Add Axios call handler `oauthLogin`.

#### [MODIFY] [index.html](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/index.html)
Add Google Identity Services client script.

#### [MODIFY] [AuthPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/auth/AuthPage.tsx)
Render branded Google Login button and handle auth redirect callback.

---

## Detailed Step-by-Step Plan

### Task 1: Database Migration
- [ ] **Step 1:** Create file `backend/src/main/resources/db/migration/V21__add_oauth_provider.sql`:
  ```sql
  ALTER TABLE users ADD COLUMN auth_provider VARCHAR(30) DEFAULT 'LOCAL' NOT NULL;
  ALTER TABLE users ADD COLUMN provider_id VARCHAR(255);
  CREATE INDEX idx_users_provider ON users(auth_provider, provider_id);
  ```
- [ ] **Step 2:** Run migration locally:
  Run command: `mvn flyway:migrate` or rebuild backend.
- [ ] **Step 3:** Commit database migration.

### Task 2: Update User Domain Model & AuthProvider Enum
- [ ] **Step 1:** Create `backend/src/main/java/com/example/horseracingtournamentsystem/auth/enums/AuthProvider.java`:
  ```java
  package com.example.horseracingtournamentsystem.auth.enums;
  public enum AuthProvider { LOCAL, GOOGLE, FACEBOOK, APPLE }
  ```
- [ ] **Step 2:** Modify `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/User.java` to add columns and link methods:
  ```java
  @Enumerated(EnumType.STRING)
  @Column(name = "auth_provider", nullable = false, length = 30)
  private AuthProvider authProvider = AuthProvider.LOCAL;

  @Column(name = "provider_id", length = 255)
  private String providerId;

  public AuthProvider getAuthProvider() { return authProvider; }
  public String getProviderId() { return providerId; }

  public void linkOAuthProvider(AuthProvider provider, String providerId) {
      this.authProvider = provider;
      this.providerId = providerId;
      this.updatedAt = LocalDateTime.now();
  }

  public void updateAvatar(String avatarUrl) {
      if (avatarUrl != null && !avatarUrl.isBlank()) {
          this.avatarUrl = avatarUrl;
          this.updatedAt = LocalDateTime.now();
      }
  }
  ```
- [ ] **Step 3:** Commit domain updates.

### Task 3: Maven Dependencies
- [ ] **Step 1:** Add Google client library dependencies to `backend/pom.xml` under `<dependencies>`:
  ```xml
  <dependency>
      <groupId>com.google.api-client</groupId>
      <artifactId>google-api-client</artifactId>
      <version>2.2.0</version>
  </dependency>
  <dependency>
      <groupId>com.google.http-client</groupId>
      <artifactId>google-http-client-gson</artifactId>
      <version>1.43.3</version>
  </dependency>
  ```
- [ ] **Step 2:** Run Maven compile: `mvn clean compile` in backend root.
- [ ] **Step 3:** Commit `pom.xml`.

### Task 4: Extensible OAuth2 Backend Infrastructure
- [ ] **Step 1:** Create DTO `backend/src/main/java/com/example/horseracingtournamentsystem/auth/dto/response/OAuth2UserInfo.java`:
  ```java
  package com.example.horseracingtournamentsystem.auth.dto.response;
  public record OAuth2UserInfo(String providerId, String email, String fullName, String avatarUrl) {}
  ```
- [ ] **Step 2:** Create Service Interface `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/OAuth2ProviderService.java`:
  ```java
  package com.example.horseracingtournamentsystem.auth.service;
  import com.example.horseracingtournamentsystem.auth.dto.response.OAuth2UserInfo;
  import com.example.horseracingtournamentsystem.auth.enums.AuthProvider;
  public interface OAuth2ProviderService {
      AuthProvider getProvider();
      OAuth2UserInfo verifyToken(String idToken);
  }
  ```
- [ ] **Step 3:** Create Registry `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/OAuth2ProviderRegistry.java`:
  ```java
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
          this.providerServices = services.stream().collect(Collectors.toUnmodifiableMap(OAuth2ProviderService::getProvider, Function.identity()));
      }
      public OAuth2ProviderService getService(AuthProvider provider) {
          OAuth2ProviderService service = providerServices.get(provider);
          if (service == null) { throw new IllegalArgumentException("UNSUPPORTED_AUTH_PROVIDER: " + provider); }
          return service;
      }
  }
  ```
- [ ] **Step 4:** Compile project.
- [ ] **Step 5:** Commit infrastructure classes.

### Task 5: Implement Google Provider Service
- [ ] **Step 1:** Modify `backend/src/main/resources/application.yml` under `app.auth` properties:
  ```yaml
  google-client-id: ${GOOGLE_CLIENT_ID}
  ```
- [ ] **Step 2:** Create `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/GoogleOAuth2ProviderService.java`:
  ```java
  package com.example.horseracingtournamentsystem.auth.service;
  import com.example.horseracingtournamentsystem.auth.dto.response.OAuth2UserInfo;
  import com.example.horseracingtournamentsystem.auth.enums.AuthProvider;
  import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
  import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
  import com.google.api.client.http.javanet.NetHttpTransport;
  import com.google.api.client.json.gson.GsonFactory;
  import org.springframework.beans.factory.annotation.Value;
  import org.springframework.stereotype.Service;
  import java.util.Collections;

  @Service
  public class GoogleOAuth2ProviderService implements OAuth2ProviderService {
      @Value("${app.auth.google-client-id}")
      private String googleClientId;

      @Override
      public AuthProvider getProvider() { return AuthProvider.GOOGLE; }

      @Override
      public OAuth2UserInfo verifyToken(String idTokenString) {
          try {
              GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                  .setAudience(Collections.singletonList(googleClientId))
                  .build();
              GoogleIdToken idToken = verifier.verify(idTokenString);
              if (idToken == null) { throw new IllegalArgumentException("INVALID_GOOGLE_ID_TOKEN"); }
              GoogleIdToken.Payload payload = idToken.getPayload();
              return new OAuth2UserInfo(payload.getSubject(), payload.getEmail(), (String) payload.get("name"), (String) payload.get("picture"));
          } catch (Exception e) {
              throw new IllegalArgumentException("GOOGLE_AUTH_VERIFICATION_FAILED", e);
          }
      }
  }
  ```
- [ ] **Step 3:** Commit Google Service.

### Task 6: Tích hợp vào AuthService
- [ ] **Step 1:** Create DTO `backend/src/main/java/com/example/horseracingtournamentsystem/auth/dto/request/OAuth2LoginRequest.java`:
  ```java
  package com.example.horseracingtournamentsystem.auth.dto.request;
  import jakarta.validation.constraints.NotBlank;
  public record OAuth2LoginRequest(@NotBlank(message = "OAUTH_TOKEN_REQUIRED") String idToken) {}
  ```
- [ ] **Step 2:** Modify `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/AuthService.java` to inject `OAuth2ProviderRegistry` and add OAuth2 login method:
  ```java
  private final OAuth2ProviderRegistry oauth2ProviderRegistry;

  @Transactional
  public LoginResult loginWithOAuth(AuthProvider provider, String idToken, String userAgent, String ipAddress) {
      OAuth2ProviderService providerService = oauth2ProviderRegistry.getService(provider);
      OAuth2UserInfo userInfo = providerService.verifyToken(idToken);
      
      String email = normalizeEmail(userInfo.email());
      User user = userRepository.findByEmailForUpdate(email).orElse(null);
      
      if (user != null) {
          if (UserStatus.ACTIVE != user.getStatus()) {
              throw new IllegalArgumentException("USER_ACCOUNT_DISABLED");
          }
          if (user.getAuthProvider() == AuthProvider.LOCAL) {
              user.linkOAuthProvider(provider, userInfo.providerId());
          }
      } else {
          String randomPassword = generateSecureRandomPassword();
          user = User.pending(
              userInfo.fullName().trim(),
              email,
              passwordEncoder.encode(randomPassword),
              null
          );
          user.verifyEmail();
          user.linkOAuthProvider(provider, userInfo.providerId());
          user.updateAvatar(userInfo.avatarUrl());
          
          user = userRepository.save(user);
          
          Role spectator = roleRepository.findByName("SPECTATOR")
                  .orElseThrow(() -> new IllegalStateException("SPECTATOR_ROLE_NOT_CONFIGURED"));
          userRoleRepository.save(UserRole.active(user, spectator, null));
      }
      
      user.recordLogin();
      userRepository.save(user);

      String accessToken = jwtService.generateToken(user.getEmail(), user.getActiveRoleNames());
      String refreshToken = createRefreshSession(user, userAgent, ipAddress);
      
      return new LoginResult(new LoginResponse(accessToken, user.getFullName(), user.getEmail()), refreshToken);
  }

  private String generateSecureRandomPassword() {
      byte[] randomBytes = new byte[24];
      secureRandom.nextBytes(randomBytes);
      return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
  }
  ```
- [ ] **Step 3:** Commit AuthService integration.

### Task 7: Controller & Security Config
- [ ] **Step 1:** Modify `backend/src/main/java/com/example/horseracingtournamentsystem/auth/controller/AuthController.java` to add mapping:
  ```java
  @PostMapping("/oauth/{provider}")
  public ResponseEntity<LoginResponse> loginWithOAuth(
          @PathVariable AuthProvider provider,
          @Valid @RequestBody OAuth2LoginRequest request,
          HttpServletRequest servletRequest
  ) {
      AuthService.LoginResult result = authService.loginWithOAuth(
              provider,
              request.idToken(),
              servletRequest.getHeader(HttpHeaders.USER_AGENT),
              servletRequest.getRemoteAddr()
      );
      return ResponseEntity.ok()
              .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(result.refreshToken()).toString())
              .body(result.response());
  }
  ```
- [ ] **Step 2:** Compile and run tests.
- [ ] **Step 3:** Commit Controller updates.

### Task 8: Frontend API calls
- [ ] **Step 1:** Modify `frontend/src/api/authApi.ts` to add `oauthLogin`:
  ```typescript
  export async function oauthLogin(provider: string, idToken: string): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>(`/auth/oauth/${provider}`, { idToken });
    return response.data;
  }
  ```
- [ ] **Step 2:** Commit api code.

### Task 9: Frontend UI Integration
- [ ] **Step 1:** Modify `frontend/index.html` to add Google GIS client-side library in head:
  ```html
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  ```
- [ ] **Step 2:** Modify `frontend/src/pages/auth/AuthPage.tsx` to handle button rendering and login callback:
  ```typescript
  // Callbacks and effects for Google
  const handleGoogleLogin = async (response: any) => {
    try {
      setError(null);
      setLoading(true);
      const apiResponse = await oauthLogin("GOOGLE", response.credential);
      setClientSession(apiResponse.accessToken, apiResponse.fullName, apiResponse.email);
      const roles = getRolesFromAccessToken(apiResponse.accessToken);
      if (roles.includes("ADMIN")) {
        navigate("/admin", { replace: true });
      } else if (roles.includes("REFEREE")) {
        navigate("/referee", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Google Login failed."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLogin && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });
      (window as any).google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }, [isLogin]);
  ```
  And render the container in JSX under login form:
  ```tsx
  {isLogin && (
    <>
      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-gray-100"></div>
        <span className="flex-shrink mx-4 text-xs text-gray-400 font-bold uppercase tracking-widest">Or Login With</span>
        <div className="flex-grow border-t border-gray-100"></div>
      </div>
      <div id="google-login-btn" className="w-full flex justify-center mb-4" />
    </>
  )}
  ```
- [ ] **Step 3:** Test locally.
- [ ] **Step 4:** Commit UI updates.

---

## Verification Plan

### Automated Tests
- Build both frontend and backend to verify zero compile/lint errors:
  - Backend: `mvn clean compile`
  - Frontend: `npm run build`

### Manual Verification
1. Configure `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` env variables.
2. Click "Login with Google" on UI, log in, and ensure user redirects to home dashboard.
3. Check `users` table to ensure `auth_provider` is set to `GOOGLE` and `provider_id` contains Google User ID.
