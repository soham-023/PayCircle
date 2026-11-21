package com.paycircle.config;

import com.paycircle.dto.CreateExpenseRequest;
import com.paycircle.dto.CreateGroupRequest;
import com.paycircle.dto.ExpenseSplitRequest;
import com.paycircle.dto.GroupResponse;
import com.paycircle.entity.*;
import com.paycircle.enums.*;
import com.paycircle.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final BudgetRepository budgetRepository;
    private final RecurringExpenseRepository recurringExpenseRepository;
    private final ActivityLogRepository activityLogRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already initialized with users, skipping seed data.");
            return;
        }

        log.info("Seeding initial demo data for PayCircle...");

        // 1. Create Users
        User soham = userRepository.save(User.builder()
                .name("Soham Chintawar")
                .email("soham@paycircle.app")
                .phone("+919876543210")
                .password(passwordEncoder.encode("password123"))
                .upiId("soham@oksbi")
                .avatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150")
                .build());

        User priya = userRepository.save(User.builder()
                .name("Priya Sharma")
                .email("priya@paycircle.app")
                .phone("+919876543211")
                .password(passwordEncoder.encode("password123"))
                .upiId("priya@okicici")
                .avatarUrl("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150")
                .build());

        User rahul = userRepository.save(User.builder()
                .name("Rahul Verma")
                .email("rahul@paycircle.app")
                .phone("+919876543212")
                .password(passwordEncoder.encode("password123"))
                .upiId("rahul@okhdfc")
                .avatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150")
                .build());

        User ananya = userRepository.save(User.builder()
                .name("Ananya Iyer")
                .email("ananya@paycircle.app")
                .phone("+919876543213")
                .password(passwordEncoder.encode("password123"))
                .upiId("ananya@paytm")
                .avatarUrl("https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150")
                .build());

        // 2. Create Groups
        Group goaTrip = groupRepository.save(Group.builder()
                .name("Goa Trip 2026")
                .description("Beach resort, bike rentals, seafood shacks, and water sports")
                .category(GroupCategory.TRIP)
                .createdBy(soham)
                .build());

        Group roommates = groupRepository.save(Group.builder()
                .name("Flat 402 Roommates")
                .description("Monthly rent, maid, groceries, electricity, and WiFi")
                .category(GroupCategory.HOME)
                .createdBy(priya)
                .build());

        // 3. Add Members
        groupMemberRepository.save(GroupMember.builder().group(goaTrip).user(soham).role(GroupRole.ADMIN).build());
        groupMemberRepository.save(GroupMember.builder().group(goaTrip).user(priya).role(GroupRole.MEMBER).build());
        groupMemberRepository.save(GroupMember.builder().group(goaTrip).user(rahul).role(GroupRole.MEMBER).build());
        groupMemberRepository.save(GroupMember.builder().group(goaTrip).user(ananya).role(GroupRole.MEMBER).build());

        groupMemberRepository.save(GroupMember.builder().group(roommates).user(priya).role(GroupRole.ADMIN).build());
        groupMemberRepository.save(GroupMember.builder().group(roommates).user(soham).role(GroupRole.MEMBER).build());
        groupMemberRepository.save(GroupMember.builder().group(roommates).user(rahul).role(GroupRole.MEMBER).build());

        // 4. Create Expenses with splits
        // Expense 1: Beach Villa Booking in Goa Trip
        Expense villaExp = expenseRepository.save(Expense.builder()
                .group(goaTrip)
                .title("Beachfront Luxury Villa Stay")
                .description("3 nights stay in Anjuna beach villa")
                .amount(new BigDecimal("12000.00"))
                .category(ExpenseCategory.HOUSING_AND_RENT)
                .splitType(SplitType.EQUAL)
                .paidBy(soham)
                .expenseDate(LocalDate.now().minusDays(3))
                .build());

        BigDecimal share3000 = new BigDecimal("3000.00");
        expenseSplitRepository.save(ExpenseSplit.builder().expense(villaExp).user(soham).amount(share3000).build());
        expenseSplitRepository.save(ExpenseSplit.builder().expense(villaExp).user(priya).amount(share3000).build());
        expenseSplitRepository.save(ExpenseSplit.builder().expense(villaExp).user(rahul).amount(share3000).build());
        expenseSplitRepository.save(ExpenseSplit.builder().expense(villaExp).user(ananya).amount(share3000).build());

        // Expense 2: Seafood Shack Dinner
        Expense dinnerExp = expenseRepository.save(Expense.builder()
                .group(goaTrip)
                .title("Curlies Shack Beach Dinner")
                .description("Grilled seafood, mocktails and snacks")
                .amount(new BigDecimal("4800.00"))
                .category(ExpenseCategory.FOOD_AND_DRINK)
                .splitType(SplitType.EQUAL)
                .paidBy(priya)
                .expenseDate(LocalDate.now().minusDays(2))
                .build());

        BigDecimal share1200 = new BigDecimal("1200.00");
        expenseSplitRepository.save(ExpenseSplit.builder().expense(dinnerExp).user(soham).amount(share1200).build());
        expenseSplitRepository.save(ExpenseSplit.builder().expense(dinnerExp).user(priya).amount(share1200).build());
        expenseSplitRepository.save(ExpenseSplit.builder().expense(dinnerExp).user(rahul).amount(share1200).build());
        expenseSplitRepository.save(ExpenseSplit.builder().expense(dinnerExp).user(ananya).amount(share1200).build());

        // Expense 3: Scooters Rental
        Expense rentalExp = expenseRepository.save(Expense.builder()
                .group(goaTrip)
                .title("Activa Scooters Rental (4 bikes)")
                .description("Rental for 3 days including helmets")
                .amount(new BigDecimal("3600.00"))
                .category(ExpenseCategory.TRANSPORTATION)
                .splitType(SplitType.EQUAL)
                .paidBy(rahul)
                .expenseDate(LocalDate.now().minusDays(1))
                .build());

        BigDecimal share900 = new BigDecimal("900.00");
        expenseSplitRepository.save(ExpenseSplit.builder().expense(rentalExp).user(soham).amount(share900).build());
        expenseSplitRepository.save(ExpenseSplit.builder().expense(rentalExp).user(priya).amount(share900).build());
        expenseSplitRepository.save(ExpenseSplit.builder().expense(rentalExp).user(rahul).amount(share900).build());
        expenseSplitRepository.save(ExpenseSplit.builder().expense(rentalExp).user(ananya).amount(share900).build());

        // Expense 4: Roommates Groceries
        Expense grocExp = expenseRepository.save(Expense.builder()
                .group(roommates)
                .title("BigBasket Monthly Groceries")
                .description("Provisions, snacks, dairy, spices")
                .amount(new BigDecimal("4500.00"))
                .category(ExpenseCategory.GROCERIES)
                .splitType(SplitType.EQUAL)
                .paidBy(soham)
                .expenseDate(LocalDate.now().minusDays(4))
                .build());

        BigDecimal share1500 = new BigDecimal("1500.00");
        expenseSplitRepository.save(ExpenseSplit.builder().expense(grocExp).user(soham).amount(share1500).build());
        expenseSplitRepository.save(ExpenseSplit.builder().expense(grocExp).user(priya).amount(share1500).build());
        expenseSplitRepository.save(ExpenseSplit.builder().expense(grocExp).user(rahul).amount(share1500).build());

        // 5. Create Budget
        budgetRepository.save(Budget.builder()
                .group(goaTrip)
                .category(null)
                .limitAmount(new BigDecimal("30000.00"))
                .month(LocalDate.now().getMonthValue())
                .year(LocalDate.now().getYear())
                .alertThresholdPercent(80)
                .build());

        budgetRepository.save(Budget.builder()
                .group(roommates)
                .category(ExpenseCategory.GROCERIES)
                .limitAmount(new BigDecimal("8000.00"))
                .month(LocalDate.now().getMonthValue())
                .year(LocalDate.now().getYear())
                .alertThresholdPercent(75)
                .build());

        // 6. Create Recurring Expense
        recurringExpenseRepository.save(RecurringExpense.builder()
                .group(roommates)
                .title("Airtel Fiber 300 Mbps Internet")
                .amount(new BigDecimal("1179.00"))
                .category(ExpenseCategory.UTILITIES)
                .frequency(RecurringFrequency.MONTHLY)
                .paidBy(priya)
                .splitType(SplitType.EQUAL)
                .nextDueDate(LocalDate.now().plusDays(10))
                .isActive(true)
                .build());

        // 7. Activity Logs
        activityLogRepository.save(ActivityLog.builder()
                .group(goaTrip)
                .user(soham)
                .type(ActivityType.GROUP_CREATED)
                .description("Soham created the group 'Goa Trip 2026'")
                .build());
        activityLogRepository.save(ActivityLog.builder()
                .group(goaTrip)
                .user(soham)
                .type(ActivityType.EXPENSE_ADDED)
                .description("Soham added expense 'Beachfront Luxury Villa Stay' of ₹12000.00")
                .build());

        // 8. Welcome Notification
        notificationRepository.save(Notification.builder()
                .recipient(soham)
                .title("Welcome to PayCircle!")
                .message("Start tracking shared expenses, simplifying debts, and settling up via phone numbers & UPI.")
                .type(NotificationType.SYSTEM)
                .isRead(false)
                .build());

        log.info("Demo data seeded successfully! 4 users created with credentials: soham@paycircle.app / password123");
    }
}
