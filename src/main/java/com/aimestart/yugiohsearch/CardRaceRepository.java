package com.aimestart.yugiohsearch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CardRaceRepository extends JpaRepository<CardRace, Integer> {
    List<CardRace> findByNameIn(Collection<String> names);
    List<CardRace> findAllByOrderByNameAsc();
}
