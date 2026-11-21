package com.paycircle.service;

import com.paycircle.dto.UpdateProfileRequest;
import com.paycircle.dto.UserProfileResponse;
import com.paycircle.dto.UserSummaryResponse;
import com.paycircle.entity.User;
import com.paycircle.exception.BadRequestException;
import com.paycircle.exception.ResourceNotFoundException;
import com.paycircle.repository.UserRepository;
import com.paycircle.security.CustomUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getCurrentAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserPrincipal principal)) {
            throw new BadRequestException("No authenticated user found in security context");
        }
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in database"));
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        User user = (userId != null)
                ? userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId))
                : getCurrentAuthenticatedUser();

        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .upiId(user.getUpiId())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request) {
        User user = getCurrentAuthenticatedUser();

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank() && !request.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(request.getPhone().trim())) {
                throw new BadRequestException("Phone number already in use by another account");
            }
            user.setPhone(request.getPhone().trim());
        }
        if (request.getUpiId() != null) {
            user.setUpiId(request.getUpiId().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        User updated = userRepository.save(user);
        return getProfile(updated.getId());
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> searchUsers(String query) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }
        return userRepository.searchUsers(query.trim()).stream()
                .map(this::mapToSummary)
                .collect(Collectors.toList());
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
