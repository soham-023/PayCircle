package com.paycircle.controller;

import com.paycircle.dto.CreateExpenseRequest;
import com.paycircle.dto.ExpenseResponse;
import com.paycircle.service.ExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
    
@RequiredArgsConstructor
@Tag(name = "Expense Management", description = "Endpoints for creating and managing expenses with Equal, Exact, Percentage, and Shares splits")
public class ExpenseController {

    private final ExpenseService expenseService;
    

    @PostMapping
    @Operation(summary = "Add a new expense", description = "Supports EQUAL, EXACT, PERCENTAGE, and SHARES split types")
    public ResponseEntity<ExpenseResponse> createExpense(@Valid @RequestBody CreateExpenseRequest request) {
        
        return new ResponseEntity<>(expenseService.createExpense(request), HttpStatus.CREATED);
    }

    @GetMapping("/group/{groupId}")
    @Operation(summary = "Get all expenses for a group ordered newest first")
    public ResponseEntity<List<ExpenseResponse>> getGroupExpenses(@PathVariable Long groupId) {
        return ResponseEntity.ok(expenseService.getGroupExpenses(groupId));
    }

    @GetMapping("/my")
    @Operation(summary = "Get all expenses involving current user (as payer or participant)")
    public ResponseEntity<List<ExpenseResponse>> getUserExpenses() {
        return ResponseEntity.ok(expenseService.getUserExpenses());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get expense details by ID")
    public ResponseEntity<ExpenseResponse> getExpenseById(@PathVariable Long id) {
        return ResponseEntity.ok(expenseService.getExpenseById(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an expense (payer only)")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }
}
