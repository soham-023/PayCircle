package com.paycircle.service;

import com.paycircle.dto.ActivityLogResponse;
import com.paycircle.dto.UserSummaryResponse;
import com.paycircle.entity.ActivityLog;
import com.paycircle.entity.Group;
import com.paycircle.entity.User;
import com.paycircle.enums.ActivityType;
import com.paycircle.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityLogRepository activityLogRepository;

    @Transactional
    public void log(Group group, User user, ActivityType type, String description) {
        ActivityLog log = ActivityLog.builder()
                .group(group)
                .user(user)
                .type(type)
                .description(description)
                .build();
        activityLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getGroupActivities(Long groupId, int limit) {
        return activityLogRepository.findByGroupIdOrderByCreatedAtDesc(groupId, PageRequest.of(0, limit))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getUserFeed(Long userId, int limit) {
        return activityLogRepository.findUserFeed(userId, PageRequest.of(0, limit))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ActivityLogResponse mapToResponse(ActivityLog log) {
        return ActivityLogResponse.builder()
                .id(log.getId())
                .groupId(log.getGroup() != null ? log.getGroup().getId() : null)
                .groupName(log.getGroup() != null ? log.getGroup().getName() : null)
                .user(UserSummaryResponse.builder()
                        .id(log.getUser().getId())
                        .name(log.getUser().getName())
                        .email(log.getUser().getEmail())
                        .phone(log.getUser().getPhone())
                        .upiId(log.getUser().getUpiId())
                        .avatarUrl(log.getUser().getAvatarUrl())
                        .build())
                .type(log.getType())
                .description(log.getDescription())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
