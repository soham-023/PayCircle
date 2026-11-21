package com.paycircle.controller;

import com.paycircle.dto.*;
import com.paycircle.service.GroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@Tag(name = "Group Management", description = "Endpoints for creating groups, managing members by phone, and group metadata")
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    @Operation(summary = "Create a new group", description = "Current user becomes admin; optionally invite members by phone number")
    public ResponseEntity<GroupResponse> createGroup(@Valid @RequestBody CreateGroupRequest request) {
        return new ResponseEntity<>(groupService.createGroup(request), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "Get all groups for current user")
    public ResponseEntity<List<GroupResponse>> getUserGroups() {
        return ResponseEntity.ok(groupService.getUserGroups());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get group details by ID with members list")
    public ResponseEntity<GroupResponse> getGroupById(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update group metadata (name, description, category)")
    public ResponseEntity<GroupResponse> updateGroup(@PathVariable Long id, @Valid @RequestBody UpdateGroupRequest request) {
        return ResponseEntity.ok(groupService.updateGroup(id, request));
    }

    @PostMapping("/{id}/members")
    @Operation(summary = "Add a member to group using their registered phone number")
    public ResponseEntity<GroupMemberResponse> addMemberByPhone(@PathVariable Long id, @Valid @RequestBody AddMemberRequest request) {
        return new ResponseEntity<>(groupService.addMemberByPhone(id, request), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}/members/{userId}")
    @Operation(summary = "Remove a member from group (or leave group)")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        groupService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }
}
