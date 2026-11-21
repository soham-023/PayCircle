package com.paycircle.dto;

import com.paycircle.enums.GroupCategory;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGroupRequest {
    @Size(min = 2, max = 100)
    private String name;
    private String description;
    private GroupCategory category;
}
