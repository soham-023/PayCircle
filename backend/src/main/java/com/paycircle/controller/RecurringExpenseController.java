package com.paycircle.controller;

import com.paycircle.dto.CreateRecurringExpenseRequest;
import com.paycircle.dto.RecurringExpenseResponse;
import com.paycircle.service.RecurringExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring-expenses")
@RequiredArgsConstructor
@Tag(name = "Recurring Expenses", description = "Endpoints for subscriptions, monthly rent, and recurring group expenses")
public class RecurringExpenseController {

    private final RecurringExpenseService recurringExpenseService;

    @PostMapping
    @Operation(summary = "Set up a recurring expense schedule")
    public ResponseEntity<RecurringExpenseResponse> createRecurringExpense(@Valid @RequestBody CreateRecurringExpenseRequest request) {
        return new ResponseEntity<>(recurringExpenseService.createRecurringExpense(request), HttpStatus.CREATED);
    }

    @GetMapping("/group/{groupId}")
    @Operation(summary = "Get all recurring expenses configured for a group")
    public ResponseEntity<List<RecurringExpenseResponse>> getGroupRecurringExpenses(@PathVariable Long groupId) {
        return ResponseEntity.ok(recurringExpenseService.getGroupRecurringExpenses(groupId));
    }

    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Toggle active/paused status of a recurring expense")
    public ResponseEntity<RecurringExpenseResponse> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(recurringExpenseService.toggleStatus(id));
    }

    @PostMapping("/{id}/trigger")
    @Operation(summary = "Manually trigger creation of an expense from this recurring template and update next due date")
    public ResponseEntity<Void> triggerExpense(@PathVariable Long id) {
        recurringExpenseService.triggerDueRecurringExpense(id);
        return ResponseEntity.ok().build();
    }
}
