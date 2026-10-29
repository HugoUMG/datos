package com.proyectoinvdebienes.backend.web.controller;

import com.proyectoinvdebienes.backend.service.UserAccountService;
import org.springframework.security.core.Authentication;
import com.proyectoinvdebienes.backend.web.dto.ChangePasswordRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
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

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        userAccountService.changePassword(authentication.getName(), request.currentPassword(), request.newPassword());
    }

    public record AuthUser(String username, String role, Long employeeId) {
    }
}
