package com.aimestart.yugiohsearch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CardAttributeRepository extends JpaRepository<CardAttribute, Integer> {
    List<CardAttribute> findByNameIn(Collection<String> names);
    List<CardAttribute> findAllByOrderByNameAsc();
}
