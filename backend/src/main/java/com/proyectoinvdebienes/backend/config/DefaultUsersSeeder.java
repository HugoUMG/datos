package com.proyectoinvdebienes.backend.config;

import com.proyectoinvdebienes.backend.domain.enums.RoleName;
import com.proyectoinvdebienes.backend.domain.model.UserAccount;
import com.proyectoinvdebienes.backend.repository.UserAccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DefaultUsersSeeder implements CommandLineRunner {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public DefaultUsersSeeder(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        ensureUser("admin", "admin123", RoleName.ADMINISTRADOR);
        ensureUser("compras", "compras123", RoleName.COMPRAS);
        ensureUser("inventario", "inventario123", RoleName.INVENTARIO);
        ensureUser("finanzas", "finanzas123", RoleName.FINANZAS);
    }

    private void ensureUser(String username, String plainPassword, RoleName role) {
        if (userAccountRepository.findByUsername(username).isPresent()) {
            return;
        }

        UserAccount user = new UserAccount();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(plainPassword));
        user.setRole(role);
        userAccountRepository.save(user);
    }
}
