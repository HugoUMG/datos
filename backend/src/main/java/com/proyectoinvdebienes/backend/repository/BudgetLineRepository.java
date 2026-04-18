package com.proyectoinvdebienes.backend.repository;

import com.proyectoinvdebienes.backend.domain.model.BudgetLine;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BudgetLineRepository extends JpaRepository<BudgetLine, Long> {
}
