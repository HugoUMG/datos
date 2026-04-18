package com.proyectoinvdebienes.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/").permitAll()
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers("/api/admin/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/reports/employee/me/export").hasAnyRole("EMPLEADO", "ADMINISTRADOR")
                        .requestMatchers("/api/reports/**").hasAnyRole("ADMINISTRADOR", "FINANZAS", "INVENTARIO")
                        .requestMatchers("/api/acquisitions/**").hasAnyRole("ADMINISTRADOR", "COMPRAS", "INVENTARIO")
                        .requestMatchers("/api/data/**").hasAnyRole("ADMINISTRADOR", "COMPRAS", "INVENTARIO")
                        .requestMatchers("/api/inventory/**").hasAnyRole("ADMINISTRADOR", "INVENTARIO")
                        .requestMatchers("/api/assignments/**").hasAnyRole("ADMINISTRADOR", "INVENTARIO")
                        .requestMatchers("/api/disposals/**").hasAnyRole("ADMINISTRADOR", "INVENTARIO")
                        .requestMatchers("/api/employee/**").hasAnyRole("EMPLEADO", "ADMINISTRADOR")
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
