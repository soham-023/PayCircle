package com.paycircle.dto;

import com.paycircle.enums.GroupRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMemberResponse {
    private Long id;
    private UserSummaryResponse user;
    private GroupRole role;
    private LocalDateTime joinedAt;
}
