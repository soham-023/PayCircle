package com.paycircle.controller;

import com.paycircle.dto.GroupBalanceSummaryResponse;
import com.paycircle.dto.OverallBalanceSummaryResponse;
import com.paycircle.dto.RecordSettlementRequest;
import com.paycircle.dto.SettlementResponse;
import com.paycircle.service.SettlementEngineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settlements")
@RequiredArgsConstructor
@Tag(name = "Settlement Engine", description = "Calculate balances, min-cash-flow optimal debt simplification, and record settlements")
public class SettlementController {

    private final SettlementEngineService settlementEngineService;

    @GetMapping("/group/{groupId}/balances")
    @Operation(summary = "Calculate group balances and suggested settlements",
            description = "Computes net balances per member and simplifies debts via Min-Cash-Flow algorithm")
    public ResponseEntity<GroupBalanceSummaryResponse> getGroupBalances(@PathVariable Long groupId) {
        return ResponseEntity.ok(settlementEngineService.calculateGroupBalances(groupId));
    }

    @GetMapping("/overall")
    @Operation(summary = "Get overall balance summary across all friends and groups for current user")
    public ResponseEntity<OverallBalanceSummaryResponse> getOverallBalances() {
        return ResponseEntity.ok(settlementEngineService.calculateOverallUserBalances());
    }

    @PostMapping
    @Operation(summary = "Record a settlement payment between two users")
    public ResponseEntity<SettlementResponse> recordSettlement(@Valid @RequestBody RecordSettlementRequest request) {
        return new ResponseEntity<>(settlementEngineService.recordSettlement(request), HttpStatus.CREATED);
    }

    @GetMapping("/group/{groupId}")
    @Operation(summary = "Get settlement history for a group")
    public ResponseEntity<List<SettlementResponse>> getGroupSettlements(@PathVariable Long groupId) {
        return ResponseEntity.ok(settlementEngineService.getGroupSettlements(groupId));
    }

    @GetMapping("/my")
    @Operation(summary = "Get all settlement history involving current user")
    public ResponseEntity<List<SettlementResponse>> getUserSettlements() {
        return ResponseEntity.ok(settlementEngineService.getUserSettlements());
    }
}
