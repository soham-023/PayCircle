package com.paycircle.dto;

import com.paycircle.enums.ActivityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogResponse {
    private Long id;
    private Long groupId;
    private String groupName;
    private UserSummaryResponse user;
    private ActivityType type;
    private String description;
    private LocalDateTime createdAt;
}
