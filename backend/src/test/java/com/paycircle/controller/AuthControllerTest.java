package com.paycircle.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.paycircle.dto.LoginRequest;
import com.paycircle.dto.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Should successfully authenticate existing seeded user")
    public void testLoginSuccess() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .usernameOrPhone("soham@paycircle.app")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("soham@paycircle.app"));
    }

    @Test
    @DisplayName("Should login using phone number")
    public void testLoginWithPhone() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .usernameOrPhone("+919876543210")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.phone").value("+919876543210"));
    }

    @Test
    @DisplayName("Should successfully register a new user")
    public void testRegisterSuccess() throws Exception {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .name("New User")
                .email("newuser" + System.currentTimeMillis() + "@paycircle.app")
                .phone("+91" + (System.currentTimeMillis() % 10000000000L))
                .password("password123")
                .upiId("newuser@okaxis")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.name").value("New User"));
    }
}
