package com.paycircle.controller;

import com.paycircle.dto.BudgetResponse;
import com.paycircle.dto.CreateBudgetRequest;
import com.paycircle.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@Tag(name = "Budgets", description = "Endpoints for setting and tracking spending limits for groups and personal categories")
public class BudgetController {

    private final BudgetService budgetService;
    

    @PostMapping
    @Operation(summary = "Create a spending budget", description = "Can be set for a group or personal category for a specific month/year")
    public ResponseEntity<BudgetResponse> createBudget(@Valid @RequestBody CreateBudgetRequest request) {
        return new ResponseEntity<>(budgetService.createBudget(request), HttpStatus.CREATED);
    }

    @GetMapping("/group/{groupId}")
    @Operation(summary = "Get budgets and real-time spending status for a group")
    public ResponseEntity<List<BudgetResponse>> getGroupBudgets(
            @PathVariable Long groupId,
        
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(budgetService.getGroupBudgets(groupId, month, year));
    }

    @GetMapping("/my")
    @Operation(summary = "Get personal budgets and spending status")
    public ResponseEntity<List<BudgetResponse>> getUserBudgets(
        
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(budgetService.getUserBudgets(month, year));
    }
}
