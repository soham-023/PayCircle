package com.paycircle.service;

import com.paycircle.dto.*;
import com.paycircle.entity.Expense;
import com.paycircle.entity.Group;
import com.paycircle.entity.GroupMember;
import com.paycircle.entity.User;
import com.paycircle.enums.ActivityType;
import com.paycircle.enums.GroupRole;
import com.paycircle.enums.NotificationType;
import com.paycircle.exception.BadRequestException;
import com.paycircle.exception.ResourceNotFoundException;
import com.paycircle.exception.UnauthorizedException;
import com.paycircle.repository.ExpenseRepository;
import com.paycircle.repository.GroupMemberRepository;
import com.paycircle.repository.GroupRepository;
import com.paycircle.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final UserService userService;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    @Transactional
    public GroupResponse createGroup(CreateGroupRequest request) {
        User creator = userService.getCurrentAuthenticatedUser();

        Group group = Group.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .category(request.getCategory())
                .createdBy(creator)
                .build();

        Group savedGroup = groupRepository.save(group);

        // Add creator as ADMIN
        GroupMember adminMember = GroupMember.builder()
                .group(savedGroup)
                .user(creator)
                .role(GroupRole.ADMIN)
                .build();
        groupMemberRepository.save(adminMember);
        savedGroup.getMembers().add(adminMember);

        // Add initial members if provided by phone
        if (request.getInitialMemberPhones() != null) {
            for (String phone : request.getInitialMemberPhones()) {
                String cleanPhone = phone.trim();
                if (!cleanPhone.equalsIgnoreCase(creator.getPhone())) {
                    userRepository.findByPhone(cleanPhone).ifPresent(user -> {
                        if (!groupMemberRepository.existsByGroupIdAndUserId(savedGroup.getId(), user.getId())) {
                            GroupMember member = GroupMember.builder()
                                    .group(savedGroup)
                                    .user(user)
                                    .role(GroupRole.MEMBER)
                                    .build();
                            groupMemberRepository.save(member);
                            savedGroup.getMembers().add(member);

                            notificationService.send(
                                    user,
                                    "Added to Group",
                                    creator.getName() + " added you to the group '" + savedGroup.getName() + "'",
                                    NotificationType.MEMBER_JOINED,
                                    savedGroup.getId()
                            );
                        }
                    });
                }
            }
        }

        activityService.log(savedGroup, creator, ActivityType.GROUP_CREATED,
                creator.getName() + " created group '" + savedGroup.getName() + "'");

        return mapToResponse(savedGroup);
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getUserGroups() {
        User currentUser = userService.getCurrentAuthenticatedUser();
        List<Group> groups = groupRepository.findAllByUserId(currentUser.getId());
        return groups.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GroupResponse getGroupById(Long groupId) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        validateMembership(groupId, currentUser.getId());

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));

        return mapToResponse(group);
    }

    @Transactional
    public GroupResponse updateGroup(Long groupId, UpdateGroupRequest request) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        validateMembership(groupId, currentUser.getId());

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));

        if (request.getName() != null && !request.getName().isBlank()) {
            group.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription().trim());
        }
        if (request.getCategory() != null) {
            group.setCategory(request.getCategory());
        }

        Group saved = groupRepository.save(group);
        return mapToResponse(saved);
    }

    @Transactional
    public GroupMemberResponse addMemberByPhone(Long groupId, AddMemberRequest request) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        validateMembership(groupId, currentUser.getId());

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));

        String cleanPhone = request.getPhone().trim();
        User newMemberUser = userRepository.findByPhone(cleanPhone)
                .orElseThrow(() -> new ResourceNotFoundException("No registered user found with phone: " + cleanPhone));

        if (groupMemberRepository.existsByGroupIdAndUserId(groupId, newMemberUser.getId())) {
            throw new BadRequestException("User with phone " + cleanPhone + " is already a member of this group");
        }

        GroupMember newMember = GroupMember.builder()
                .group(group)
                .user(newMemberUser)
                .role(request.getRole() != null ? request.getRole() : GroupRole.MEMBER)
                .build();

        GroupMember saved = groupMemberRepository.save(newMember);

        activityService.log(group, currentUser, ActivityType.MEMBER_ADDED,
                currentUser.getName() + " added " + newMemberUser.getName() + " to the group");

        notificationService.send(
                newMemberUser,
                "Added to Group",
                currentUser.getName() + " added you to '" + group.getName() + "'",
                NotificationType.MEMBER_JOINED,
                groupId
        );

        return mapToMemberResponse(saved);
    }

    @Transactional
    public void removeMember(Long groupId, Long memberUserId) {
        User currentUser = userService.getCurrentAuthenticatedUser();
        GroupMember currentMember = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this group"));

        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));

        if (group.getCreatedBy().getId().equals(memberUserId)) {
            throw new BadRequestException("Group creator cannot be removed from the group");
        }

        // Only group admin or the user themselves can remove
        if (!currentMember.getRole().equals(GroupRole.ADMIN) && !currentUser.getId().equals(memberUserId)) {
            throw new UnauthorizedException("Only group admins can remove other members");
        }

        User removedUser = userRepository.findById(memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + memberUserId));

        groupMemberRepository.deleteByGroupIdAndUserId(groupId, memberUserId);

        activityService.log(group, currentUser, ActivityType.MEMBER_REMOVED,
                currentUser.getName() + " removed " + removedUser.getName() + " from the group");
    }

    public void validateMembership(Long groupId, Long userId) {
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new UnauthorizedException("Access denied: You are not a member of group ID " + groupId);
        }
    }

    public GroupResponse mapToResponse(Group group) {
        List<GroupMember> members = groupMemberRepository.findByGroupId(group.getId());
        List<Expense> expenses = expenseRepository.findByGroupIdOrderByExpenseDateDescCreatedAtDesc(group.getId());

        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .category(group.getCategory())
                .createdBy(userService.mapToSummary(group.getCreatedBy()))
                .members(members.stream().map(this::mapToMemberResponse).collect(Collectors.toList()))
                .totalExpenses(totalExpenses)
                .memberCount(members.size())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }

    public GroupMemberResponse mapToMemberResponse(GroupMember gm) {
        return GroupMemberResponse.builder()
                .id(gm.getId())
                .user(userService.mapToSummary(gm.getUser()))
                .role(gm.getRole())
                .joinedAt(gm.getJoinedAt())
                .build();
    }
}
