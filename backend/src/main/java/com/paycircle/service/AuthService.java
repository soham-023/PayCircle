package com.paycircle.service;

import com.paycircle.dto.AuthResponse;
import com.paycircle.dto.LoginRequest;
import com.paycircle.dto.RegisterRequest;
import com.paycircle.dto.UserSummaryResponse;
import com.paycircle.entity.User;
import com.paycircle.enums.ActivityType;
import com.paycircle.exception.BadRequestException;
import com.paycircle.repository.UserRepository;
import com.paycircle.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        if (userRepository.existsByPhone(request.getPhone().trim())) {
            throw new BadRequestException("Phone number is already registered: " + request.getPhone());
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phone(request.getPhone().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .upiId(request.getUpiId() != null ? request.getUpiId().trim() : null)
                .avatarUrl(request.getAvatarUrl())
                .build();

        User savedUser = userRepository.save(user);

        String token = tokenProvider.generateTokenFromUserId(savedUser.getId(), savedUser.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(mapToSummary(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsernameOrPhone().trim();
        
        // Find by email or phone
        User user = userRepository.findByEmail(identifier.toLowerCase())
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new BadRequestException("Invalid credentials: user not found"));

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
        );

        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(mapToSummary(user))
                .build();
    }

    public UserSummaryResponse mapToSummary(User user) {
        return UserSummaryResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .upiId(user.getUpiId())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
