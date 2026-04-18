package com.proyectoinvdebienes.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/").permitAll()
                .requestMatchers("/api/inventory/assets/*/qr.png").permitAll()
                .requestMatchers("/api/employee/me/assets/*/qr.png").permitAll()
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers("/api/admin/**").hasRole("ADMINISTRADOR")
                .requestMatchers("/api/employee/me/export").hasAnyRole("EMPLEADO", "ADMINISTRADOR")
                .requestMatchers("/api/reports/**").hasAnyRole("ADMINISTRADOR", "FINANZAS", "INVENTARIO")
                .requestMatchers("/api/acquisitions/**").hasAnyRole("ADMINISTRADOR", "COMPRAS", "INVENTARIO")
                .requestMatchers("/api/data/**").hasAnyRole("ADMINISTRADOR", "COMPRAS", "INVENTARIO")
                .requestMatchers("/api/inventory/**").hasAnyRole("ADMINISTRADOR", "INVENTARIO")
                .requestMatchers("/api/assignments/**").hasAnyRole("ADMINISTRADOR", "INVENTARIO")
                .requestMatchers("/api/disposals/**").hasAnyRole("ADMINISTRADOR", "INVENTARIO")
                .requestMatchers("/api/employee/**").hasAnyRole("EMPLEADO", "ADMINISTRADOR")
                .anyRequest().authenticated())
            .httpBasic(basic -> basic.authenticationEntryPoint(
                (req, res, ex) -> res.sendError(401)));
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("https://datos-1-4rmw.onrender.com"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
