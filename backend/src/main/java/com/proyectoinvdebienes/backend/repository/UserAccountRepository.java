package com.proyectoinvdebienes.backend.repository;

import com.proyectoinvdebienes.backend.domain.model.UserAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    @EntityGraph(attributePaths = {"employee"})
    Optional<UserAccount> findByUsername(String username);
}
