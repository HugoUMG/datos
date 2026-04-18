package com.proyectoinvdebienes.backend.web.controller;

import com.proyectoinvdebienes.backend.service.UserAccountService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserAccountService userAccountService;

    public AuthController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @GetMapping("/me")
    public AuthUser me(Authentication authentication) {
        return userAccountService.findByUsername(authentication.getName())
                .map(user -> new AuthUser(
                        user.getUsername(),
                        user.getRole().name(),
                        user.getEmployee() != null ? user.getEmployee().getId() : null
                ))
                .orElseThrow(() -> new IllegalStateException("Usuario autenticado no encontrado"));
    }

    public record AuthUser(String username, String role, Long employeeId) {
    }
}
