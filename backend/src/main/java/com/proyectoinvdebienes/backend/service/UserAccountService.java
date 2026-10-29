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

    /** El propio usuario cambia su contraseña confirmando la actual. */
    public void changePassword(String username, String currentPassword, String newPassword) {
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        if (!passwordEncoder.matches(currentPassword, account.getPassword())) {
            throw new BusinessException("La contraseña actual no es correcta.");
        }
        if (currentPassword.equals(newPassword)) {
            throw new BusinessException("La nueva contraseña debe ser distinta de la actual.");
        }
        account.setPassword(passwordEncoder.encode(newPassword));
        userAccountRepository.save(account);
    }

    /** El administrador asigna una contraseña nueva a otra cuenta (p. ej. si la olvidó). */
    public UserAccount resetPassword(Long userId, String newPassword) {
        UserAccount account = userAccountRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        account.setPassword(passwordEncoder.encode(newPassword));
        return userAccountRepository.save(account);
    }

    public List<UserAccount> listUsers() {
        return userAccountRepository.findAll();
    }

    public Optional<UserAccount> findByUsername(String username) {
        return userAccountRepository.findByUsername(username);
    }
}
