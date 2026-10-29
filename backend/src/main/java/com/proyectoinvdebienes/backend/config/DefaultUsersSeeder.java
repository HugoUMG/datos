package com.proyectoinvdebienes.backend.config;

import com.proyectoinvdebienes.backend.domain.enums.RoleName;
import com.proyectoinvdebienes.backend.domain.model.UserAccount;
import com.proyectoinvdebienes.backend.repository.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crea los usuarios iniciales por rol. Las contraseñas se leen de variables de entorno
 * (SEED_ADMIN_PASSWORD, SEED_COMPRAS_PASSWORD, ...) y nunca se guardan en el repositorio;
 * si una variable no está definida, ese usuario no se crea (hallazgo R01 del SGC).
 */
@Component
public class DefaultUsersSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DefaultUsersSeeder.class);

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-password:}")
    private String adminPassword;
    @Value("${app.seed.compras-password:}")
    private String comprasPassword;
    @Value("${app.seed.inventario-password:}")
    private String inventarioPassword;
    @Value("${app.seed.finanzas-password:}")
    private String finanzasPassword;

    public DefaultUsersSeeder(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        ensureUser("admin", adminPassword, RoleName.ADMINISTRADOR);
        ensureUser("compras", comprasPassword, RoleName.COMPRAS);
        ensureUser("inventario", inventarioPassword, RoleName.INVENTARIO);
        ensureUser("finanzas", finanzasPassword, RoleName.FINANZAS);
    }

    private void ensureUser(String username, String plainPassword, RoleName role) {
        if (userAccountRepository.findByUsername(username).isPresent()) {
            return;
        }
        if (plainPassword == null || plainPassword.isBlank()) {
            log.warn("No se creó el usuario '{}': falta su contraseña en las variables de entorno.", username);
            return;
        }

        UserAccount user = new UserAccount();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(plainPassword));
        user.setRole(role);
        userAccountRepository.save(user);
    }
}
