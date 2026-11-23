package com.paycircle.controller;

import com.paycircle.dto.ActivityLogResponse;
import com.paycircle.service.ActivityService;

import com.paycircle.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity")
    
@RequiredArgsConstructor
@Tag(name = "Activity History", description = "Endpoints for audit logs and activity history timeline")
public class ActivityController {

    private final ActivityService activityService;
    
    private final UserService userService;

    @GetMapping("/group/{groupId}")
    
    @Operation(summary = "Get activity logs for a group")
    
    public ResponseEntity<List<ActivityLogResponse>> getGroupActivities(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "30") int limit) {
        return ResponseEntity.ok(activityService.getGroupActivities(groupId, limit));
    }

    @GetMapping("/feed")
    @Operation(summary = "Get aggregated activity feed for current user across all their groups")
    public ResponseEntity<List<ActivityLogResponse>> getUserFeed(
            @RequestParam(defaultValue = "30") int limit) {
        Long userId = userService.getCurrentAuthenticatedUser().getId();
        return ResponseEntity.ok(activityService.getUserFeed(userId, limit));
    }
}
