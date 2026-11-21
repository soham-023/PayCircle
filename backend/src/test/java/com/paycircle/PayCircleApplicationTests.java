package com.paycircle;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class PayCircleApplicationTests {

    @Test
    @DisplayName("Spring Application Context Loads Successfully")
    void contextLoads() {
    }
}
