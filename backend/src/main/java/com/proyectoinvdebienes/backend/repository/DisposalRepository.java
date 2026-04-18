package com.proyectoinvdebienes.backend.repository;

import com.proyectoinvdebienes.backend.domain.enums.DisposalStatus;
import com.proyectoinvdebienes.backend.domain.model.Disposal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisposalRepository extends JpaRepository<Disposal, Long> {
    @EntityGraph(attributePaths = {"asset"})
    List<Disposal> findByStatus(DisposalStatus status);

    @Override
    @EntityGraph(attributePaths = {"asset"})
    Optional<Disposal> findById(Long id);
}
