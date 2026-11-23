package com.paycircle.controller;

import com.paycircle.dto.GroupAnalyticsResponse;
import com.paycircle.dto.PersonalAnalyticsResponse;
import com.paycircle.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
    
@RequiredArgsConstructor
@Tag(name = "Analytics & Reports", description = "Endpoints for spending breakdown by category, member contributions, and trends")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/group/{groupId}")
    @Operation(summary = "Get spending breakdown and trend charts for a specific group")
    public ResponseEntity<GroupAnalyticsResponse> getGroupAnalytics(@PathVariable Long groupId) {
        return ResponseEntity.ok(analyticsService.getGroupAnalytics(groupId));
    }

    @GetMapping("/personal")
    @Operation(summary = "Get overall personal expense statistics, category breakdown, and monthly trend")
    
    public ResponseEntity<PersonalAnalyticsResponse> getPersonalAnalytics() {
        
        return ResponseEntity.ok(analyticsService.getPersonalAnalytics());
    }
}
