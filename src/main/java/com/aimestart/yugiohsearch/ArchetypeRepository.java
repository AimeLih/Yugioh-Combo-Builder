package com.aimestart.yugiohsearch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;

public interface ArchetypeRepository extends JpaRepository<Archetype, Integer> {
    List<Archetype> findByNameIn(Collection<String> names);
    List<Archetype> findByNameContainingIgnoreCaseOrderByNameAsc(String name, Pageable pageable);
}
