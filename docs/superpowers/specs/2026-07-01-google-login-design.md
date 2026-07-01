# Design Spec: Google OAuth2 Authentication Integration

This specification details the design for integrating Google Login (Sign-In with Google) into the Horse Racing Tournament System. It follows the extensible **OAuth2 Provider Abstraction** pattern to make it straightforward to add other providers (like Facebook, Apple, GitHub) in the future without modifying core user and authentication services.

---

## 1. Database & Domain Model Updates

We will add fields to the `users` table to link OAuth provider accounts to system accounts. This prevents account takeover security issues and maps credentials correctly.

### Database Migration: `backend/src/main/resources/db/migration/V21__add_oauth_provider.sql`
```sql
-- V21: Add OAuth Provider fields to users table
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(30) DEFAULT 'LOCAL' NOT NULL;
ALTER TABLE users ADD COLUMN provider_id VARCHAR(255);

-- Create index for faster OAuth account resolution
CREATE INDEX idx_users_provider ON users(auth_provider, provider_id);
```

### Entity Update: `User.java`
We will add fields and helper methods to `User.java`:
```java
// Under backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/User.java

@Enumerated(EnumType.STRING)
@Column(name = "auth_provider", nullable = false, length = 30)
private AuthProvider authProvider = AuthProvider.LOCAL;

@Column(name = "provider_id", length = 255)
private String providerId;

public AuthProvider getAuthProvider() {
    return authProvider;
}

public String getProviderId() {
    return providerId;
}

// Helper to link OAuth account
public void linkOAuthProvider(AuthProvider provider, String providerId) {
    this.authProvider = provider;
    this.providerId = providerId;
    this.updatedAt = LocalDateTime.now();
}

// Helper to update avatar URL dynamically from OAuth response
public void updateAvatar(String avatarUrl) {
    if (avatarUrl != null && !avatarUrl.isBlank()) {
        this.avatarUrl = avatarUrl;
        this.updatedAt = LocalDateTime.now();
    }
}
```

---

## 2. Backend Design: Extensible OAuth2 Provider Architecture

We will implement an extensible interface-based registry. To add a new provider in the future, only a new implementation of `OAuth2ProviderService` needs to be created.

### 2.1 Provider Types & User Info DTOs
```java
// AuthProvider.java
package com.example.horseracingtournamentsystem.auth.enums;

public enum AuthProvider {
    LOCAL,
    GOOGLE,
    FACEBOOK,
    APPLE
}

// OAuth2UserInfo.java
package com.example.horseracingtournamentsystem.auth.dto.response;

public record OAuth2UserInfo(
    String providerId, // Unique ID from provider (e.g. Google subject/sub claim)
    String email,
    String fullName,
    String avatarUrl
) {}
```

### 2.2 Core Interfaces
```java
// OAuth2ProviderService.java
package com.example.horseracingtournamentsystem.auth.service;

import com.example.horseracingtournamentsystem.auth.dto.response.OAuth2UserInfo;
import com.example.horseracingtournamentsystem.auth.enums.AuthProvider;

public interface OAuth2ProviderService {
    AuthProvider getProvider();
    OAuth2UserInfo verifyToken(String idToken);
}
```

### 2.3 Provider Registry
Dynamically resolves provider services at runtime using Spring dependency injection.
```java
// OAuth2ProviderRegistry.java
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
```

### 2.4 Google Provider Service Implementation
Uses the official Google API Client to verify signature, audience, and issuer locally.
```java
// GoogleOAuth2ProviderService.java
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
    public AuthProvider getProvider() {
        return AuthProvider.GOOGLE;
    }

    @Override
    public OAuth2UserInfo verifyToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    new GsonFactory()
            )
            .setAudience(Collections.singletonList(googleClientId))
            .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new IllegalArgumentException("INVALID_GOOGLE_ID_TOKEN");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            return new OAuth2UserInfo(
                payload.getSubject(),
                payload.getEmail(),
                (String) payload.get("name"),
                (String) payload.get("picture")
            );
        } catch (Exception e) {
            throw new IllegalArgumentException("GOOGLE_AUTH_VERIFICATION_FAILED", e);
        }
    }
}
```

---

## 3. Backend Login Flow Integration

### 3.1 OAuth2 Login DTO
```java
// OAuth2LoginRequest.java
package com.example.horseracingtournamentsystem.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record OAuth2LoginRequest(
    @NotBlank(message = "OAUTH_TOKEN_REQUIRED") String idToken
) {}
```

### 3.2 AuthService updates (`AuthService.java`)
```java
// Inject dependencies
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
        
        // Link OAuth account if they signed up locally before
        if (user.getAuthProvider() == AuthProvider.LOCAL) {
            user.linkOAuthProvider(provider, userInfo.providerId());
        }
    } else {
        // Register new user dynamically
        String randomPassword = generateSecureRandomPassword();
        user = User.pending(
            userInfo.fullName().trim(),
            email,
            passwordEncoder.encode(randomPassword),
            null
        );
        user.verifyEmail(); // Google verified email already
        user.linkOAuthProvider(provider, userInfo.providerId());
        user.updateAvatar(userInfo.avatarUrl());
        
        user = userRepository.save(user);
        
        // Assign default SPECTATOR role
        Role spectator = roleRepository.findByName("SPECTATOR")
                .orElseThrow(() -> new IllegalStateException("SPECTATOR_ROLE_NOT_CONFIGURED"));
        userRoleRepository.save(UserRole.active(user, spectator, null));
    }
    
    user.recordLogin();
    userRepository.save(user);

    String accessToken = jwtService.generateToken(user.getEmail(), user.getActiveRoleNames());
    String refreshToken = createRefreshSession(user, userAgent, ipAddress);
    
    return new LoginResult(
        new LoginResponse(accessToken, user.getFullName(), user.getEmail()), 
        refreshToken
    );
}

private String generateSecureRandomPassword() {
    byte[] randomBytes = new byte[24];
    secureRandom.nextBytes(randomBytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
}
```

### 3.3 AuthController updates (`AuthController.java`)
We register the endpoint `POST /api/v1/auth/oauth/{provider}`:
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

---

## 4. Frontend Integration Design

### 4.1 Script Loader & Client ID Configuration
We will add Google client-side JavaScript SDK to the HTML document.
1. Add to `frontend/.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```
2. Dynamically load script in `AuthPage.tsx` or in `index.html`:
   ```html
   <!-- frontend/index.html -->
   <script src="https://accounts.google.com/gsi/client" async defer></script>
   ```

### 4.2 API call definition in `authApi.ts`
```typescript
// frontend/src/api/authApi.ts
export async function oauthLogin(provider: string, idToken: string): Promise<LoginResponse> {
  const response = await httpClient.post<LoginResponse>(`/auth/oauth/${provider}`, { idToken });
  return response.data;
}
```

### 4.3 Google Sign-In Button on `AuthPage.tsx`
Render the branded Google Sign-In button using native GIS (Google Identity Services) API.
1. Declare Global window.google types if necessary in `vite-env.d.ts`.
2. Add a callback handler in `AuthPage.tsx`:
```typescript
const handleGoogleLogin = async (response: any) => {
  try {
    setError(null);
    setLoading(true);
    const apiResponse = await oauthLogin("GOOGLE", response.credential);
    setClientSession(apiResponse.accessToken, apiResponse.fullName, apiResponse.email);
    
    // Redirect based on roles
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
```
3. Initialize Google Identity Services in `useEffect` hook:
```typescript
useEffect(() => {
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleLogin,
    });
    window.google.accounts.id.renderButton(
      document.getElementById("google-login-btn"),
      { theme: "outline", size: "large", width: "100%", logo_alignment: "center" }
    );
  }
}, [isLogin]);
```
4. HTML container element in `AuthPage.tsx` under the login form:
```tsx
<div className="relative flex py-5 items-center">
  <div className="flex-grow border-t border-gray-200"></div>
  <span className="flex-shrink mx-4 text-xs text-gray-400 font-bold uppercase tracking-widest">Or login with</span>
  <div className="flex-grow border-t border-gray-200"></div>
</div>
<div id="google-login-btn" className="w-full flex justify-center" />
```

---

## 5. Verification Plan

### 5.1 Backend Unit / Integration Tests
- Test user search/link logic when user already exists with `auth_provider = LOCAL`.
- Test user auto-registration when user does not exist.
- Verify security access rules to allow `/api/v1/auth/oauth/**`.

### 5.2 Manual Verification
- Run backend and frontend locally.
- Click "Login with Google".
- Complete the consent screen and verify redirect to application dashboard.
- Verify DB states: user created, role set to `SPECTATOR`, status set to `ACTIVE`, and `auth_provider` set to `GOOGLE`.
