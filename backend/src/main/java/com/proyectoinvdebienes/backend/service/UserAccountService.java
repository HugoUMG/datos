package com.proyectoinvdebienes.backend.service;

import com.proyectoinvdebienes.backend.domain.enums.RoleName;
import com.proyectoinvdebienes.backend.domain.model.Employee;
import com.proyectoinvdebienes.backend.domain.model.UserAccount;
import com.proyectoinvdebienes.backend.repository.EmployeeRepository;
import com.proyectoinvdebienes.backend.repository.UserAccountRepository;
import com.proyectoinvdebienes.backend.web.dto.CreateUserRequest;
import java.util.List;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAccountService(UserAccountRepository userAccountRepository, EmployeeRepository employeeRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserAccount createUser(CreateUserRequest request) {
        userAccountRepository.findByUsername(request.username())
                .ifPresent(existing -> {
                    throw new BusinessException("El nombre de usuario ya existe");
                });

        UserAccount account = new UserAccount();
        account.setUsername(request.username());
        account.setPassword(passwordEncoder.encode(request.password()));
        account.setRole(request.role());
        account.setEmployee(resolveEmployee(request));

        return userAccountRepository.save(account);
    }

    private Employee resolveEmployee(CreateUserRequest request) {
        if (request.employeeId() == null) {
            if (request.role() == RoleName.EMPLEADO) {
                throw new BusinessException("Para rol EMPLEADO debes seleccionar employeeId.");
            }
            return null;
        }

        return employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new NotFoundException("Empleado no encontrado para la cuenta de usuario"));
    }

    public List<UserAccount> listUsers() {
        return userAccountRepository.findAll();
    }

    public Optional<UserAccount> findByUsername(String username) {
        return userAccountRepository.findByUsername(username);
    }
}
