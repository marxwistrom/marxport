# Authentication Microservice

Scalable authentication service with JWT tokens, OAuth integration, role-based access control, and session management for distributed systems.

## 🎯 Project Overview

This project demonstrates a comprehensive authentication microservice built with Spring Boot, designed for distributed systems and microservice architectures. The service provides secure authentication, authorization, and user management capabilities with enterprise-grade security features.

## 🛠 Technologies Used

- **Framework**: Java Spring Boot
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **OAuth**: OAuth2 integration (Google, GitHub)
- **Security**: Spring Security
- **Containerization**: Docker
- **API Documentation**: Swagger/OpenAPI

## ✨ Key Features

### Authentication
- **JWT Tokens**: Stateless authentication with refresh tokens
- **OAuth2 Integration**: Third-party authentication (Google, GitHub)
- **Multi-factor Authentication**: TOTP-based 2FA support
- **Password Security**: bcrypt hashing with salt

### Authorization
- **Role-Based Access Control**: Hierarchical permission system
- **Resource-Based Permissions**: Fine-grained access control
- **API Key Management**: Service-to-service authentication
- **Token Validation**: Centralized token verification

### User Management
- **User Registration**: Account creation with email verification
- **Profile Management**: User profile and preferences
- **Password Reset**: Secure password recovery flow
- **Account Lockout**: Brute force protection

### Session Management
- **Token Refresh**: Automatic token renewal
- **Session Tracking**: Active session monitoring
- **Device Management**: Multi-device session handling
- **Logout Functionality**: Secure session termination

## 🏗 Architecture

### Microservice Design
```
Client → API Gateway → Auth Service → Database
                    ↓
              Other Microservices
```

### Core Components
- **Authentication Controller**: Login/logout endpoints
- **User Management Service**: User CRUD operations
- **Token Service**: JWT generation and validation
- **OAuth Service**: Third-party authentication
- **Security Configuration**: Spring Security setup

## 🚀 Implementation Highlights

### JWT Token Generation
```java
@Service
public class JwtTokenService {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration}")
    private int jwtExpirationMs;
    
    public String generateToken(UserPrincipal userPrincipal) {
        Date expiryDate = new Date(System.currentTimeMillis() + jwtExpirationMs);
        
        return Jwts.builder()
                .setSubject(userPrincipal.getId().toString())
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .claim("roles", userPrincipal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList()))
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

### OAuth2 Configuration
```java
@Configuration
@EnableOAuth2Client
public class OAuth2Config {
    
    @Bean
    public OAuth2RestTemplate oauth2RestTemplate() {
        return new OAuth2RestTemplate(googleResource(), oauth2ClientContext);
    }
    
    @Bean
    @ConfigurationProperties("google.client")
    public AuthorizationCodeResourceDetails googleResource() {
        return new AuthorizationCodeResourceDetails();
    }
    
    @RequestMapping("/auth/google")
    public ResponseEntity<?> googleAuth(@RequestParam String code) {
        // Exchange authorization code for access token
        OAuth2AccessToken token = oauth2RestTemplate.getAccessToken();
        
        // Get user info from Google
        String userInfoUri = "https://www.googleapis.com/oauth2/v2/userinfo";
        GoogleUserInfo userInfo = restTemplate.getForObject(userInfoUri, GoogleUserInfo.class);
        
        // Create or update user in database
        User user = userService.createOrUpdateOAuthUser(userInfo);
        
        // Generate JWT token
        String jwtToken = jwtTokenService.generateToken(new UserPrincipal(user));
        
        return ResponseEntity.ok(new JwtAuthenticationResponse(jwtToken));
    }
}
```

### Role-Based Security
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String email;
    
    private String password;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();
    
    private boolean enabled = true;
    private boolean accountNonExpired = true;
    private boolean accountNonLocked = true;
    private boolean credentialsNonExpired = true;
}

@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    private RoleName name;
    
    @ManyToMany(mappedBy = "roles")
    private Set<User> users = new HashSet<>();
}
```

## 📊 API Endpoints

### Authentication Endpoints
```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getEmail(),
                loginRequest.getPassword()
            )
        );
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String jwt = tokenProvider.generateToken(userPrincipal);
        
        return ResponseEntity.ok(new JwtAuthenticationResponse(jwt));
    }
    
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignUpRequest signUpRequest) {
        if(userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse(false, "Email Address already in use!"));
        }
        
        User user = new User(signUpRequest.getName(), 
                           signUpRequest.getEmail(),
                           passwordEncoder.encode(signUpRequest.getPassword()));
        
        user.setRoles(Collections.singleton(roleRepository.findByName(RoleName.ROLE_USER)));
        
        User result = userRepository.save(user);
        
        return ResponseEntity.ok(new ApiResponse(true, "User registered successfully"));
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        
        return refreshTokenService.findByToken(requestRefreshToken)
            .map(refreshTokenService::verifyExpiration)
            .map(RefreshToken::getUser)
            .map(user -> {
                String token = jwtUtils.generateTokenFromUsername(user.getEmail());
                return ResponseEntity.ok(new TokenRefreshResponse(token, requestRefreshToken));
            })
            .orElseThrow(() -> new TokenRefreshException(requestRefreshToken,
                "Refresh token is not in database!"));
    }
}
```

## 🔒 Security Features

### Password Security
```java
@Configuration
public class SecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
    
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors().and().csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), 
                           UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

### Rate Limiting
```java
@Component
public class RateLimitingFilter implements Filter {
    
    private final RedisTemplate<String, String> redisTemplate;
    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String clientIp = getClientIpAddress(httpRequest);
        String key = "rate_limit:" + clientIp;
        
        String currentRequests = redisTemplate.opsForValue().get(key);
        
        if (currentRequests == null) {
            redisTemplate.opsForValue().set(key, "1", Duration.ofMinutes(1));
        } else if (Integer.parseInt(currentRequests) >= MAX_REQUESTS_PER_MINUTE) {
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            return;
        } else {
            redisTemplate.opsForValue().increment(key);
        }
        
        chain.doFilter(request, response);
    }
}
```

## 📈 Advanced Features

### Multi-Factor Authentication
```java
@Service
public class TwoFactorAuthService {
    
    public String generateSecretKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[20];
        random.nextBytes(bytes);
        return new String(Base32.encode(bytes));
    }
    
    public boolean verifyCode(String secret, int code) {
        long timeWindow = System.currentTimeMillis() / 30000;
        
        for (int i = -1; i <= 1; i++) {
            long hash = generateTOTP(secret, timeWindow + i);
            if (hash == code) {
                return true;
            }
        }
        return false;
    }
    
    private long generateTOTP(String secret, long timeWindow) {
        byte[] decodedKey = Base32.decode(secret);
        byte[] data = ByteBuffer.allocate(8).putLong(timeWindow).array();
        
        SecretKeySpec signKey = new SecretKeySpec(decodedKey, "HmacSHA1");
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(signKey);
        byte[] hash = mac.doFinal(data);
        
        int offset = hash[hash.length - 1] & 0xf;
        long truncatedHash = 0;
        for (int i = 0; i < 4; ++i) {
            truncatedHash <<= 8;
            truncatedHash |= (hash[offset + i] & 0xFF);
        }
        
        truncatedHash &= 0x7FFFFFFF;
        truncatedHash %= 1000000;
        
        return truncatedHash;
    }
}
```

### Token Blacklisting
```java
@Service
public class TokenBlacklistService {
    
    private final RedisTemplate<String, String> redisTemplate;
    
    public void blacklistToken(String token) {
        Claims claims = jwtTokenService.getClaimsFromToken(token);
        Date expiration = claims.getExpiration();
        long ttl = expiration.getTime() - System.currentTimeMillis();
        
        if (ttl > 0) {
            redisTemplate.opsForValue().set(
                "blacklist:" + token, 
                "true", 
                Duration.ofMillis(ttl)
            );
        }
    }
    
    public boolean isTokenBlacklisted(String token) {
        return redisTemplate.hasKey("blacklist:" + token);
    }
}
```

## 📚 Learning Outcomes

This project demonstrates:
- **Microservice Architecture**: Scalable service design
- **Spring Security**: Enterprise security implementation
- **JWT Authentication**: Stateless authentication
- **OAuth2 Integration**: Third-party authentication
- **Role-Based Authorization**: Fine-grained permissions
- **Security Best Practices**: Password hashing, rate limiting
- **Database Design**: User and role management
- **API Design**: RESTful authentication endpoints

## 🔗 Repository

**GitHub**: [Authentication Microservice](https://github.com/marxwistrom/auth-service)

---

*Part of Marx Wiström's Backend Development Portfolio*
