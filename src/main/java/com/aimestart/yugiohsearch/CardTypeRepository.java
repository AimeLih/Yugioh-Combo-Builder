package com.aimestart.yugiohsearch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CardTypeRepository extends JpaRepository<CardType, Integer> {
    List<CardType> findByNameIn(Collection<String> names);
    List<CardType> findAllByOrderByNameAsc();
}
