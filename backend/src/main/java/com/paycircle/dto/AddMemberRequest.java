package com.paycircle.dto;

import com.paycircle.enums.GroupRole;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddMemberRequest {

    @NotBlank(message = "Phone number is required")
    private String phone;

    @Builder.Default
    private GroupRole role = GroupRole.MEMBER;
}
