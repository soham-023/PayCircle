package com.paycircle.dto;

import com.paycircle.enums.GroupCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupResponse {
    private Long id;
    private String name;
    private String description;
    private GroupCategory category;
    private UserSummaryResponse createdBy;
    private List<GroupMemberResponse> members;
    private BigDecimal totalExpenses;
    private int memberCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
