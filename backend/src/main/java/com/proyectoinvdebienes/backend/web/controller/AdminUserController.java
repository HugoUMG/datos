package com.proyectoinvdebienes.backend.web.controller;

import com.proyectoinvdebienes.backend.domain.model.UserAccount;
import com.proyectoinvdebienes.backend.service.UserAccountService;
import com.proyectoinvdebienes.backend.web.dto.CreateUserRequest;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserAccountService userAccountService;

    public AdminUserController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummary createUser(@Valid @RequestBody CreateUserRequest request) {
        UserAccount created = userAccountService.createUser(request);
        return UserSummary.from(created);
    }

    @GetMapping
    public List<UserSummary> listUsers() {
        return userAccountService.listUsers().stream().map(UserSummary::from).toList();
    }

    public record UserSummary(Long id, String username, String role, Long employeeId, LocalDateTime createdAt) {
        static UserSummary from(UserAccount account) {
            Long employeeId = account.getEmployee() != null ? account.getEmployee().getId() : null;
            return new UserSummary(account.getId(), account.getUsername(), account.getRole().name(), employeeId, account.getCreatedAt());
        }
    }
}
