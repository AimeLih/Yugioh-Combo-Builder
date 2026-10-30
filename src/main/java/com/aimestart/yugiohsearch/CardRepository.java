package com.aimestart.yugiohsearch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface CardRepository extends JpaRepository<Card, Long> {
    interface CostCardView {
        Long getId();
        String getName();
        String getType();
        String getArchetype();
    }

    interface CardSearchSummaryView {
        Long getId();
        String getName();
        String getType();
        String getCardImageUrl();
    }

    @EntityGraph(value = "Card.details")
    Card getCardByName(String name);

    @EntityGraph(value = "Card.details")
    List<Card> findByNameContainingIgnoreCase(String name);

    @Query("""
            select card.id as id,
                   card.name as name,
                   typeReference.name as type,
                   card.cardImageUrl as cardImageUrl
            from Card card
            join card.typeReference typeReference
            left join card.raceReference raceReference
            left join card.attributeReference attributeReference
            left join card.archetypeReference archetypeReference
            where upper(card.name) like upper(concat('%', :name, '%'))
              and (:typeId is null or typeReference.id = :typeId)
              and (:raceId is null or raceReference.id = :raceId)
              and (:attributeId is null or attributeReference.id = :attributeId)
              and (:archetypeId is null or archetypeReference.id = :archetypeId)
            order by card.name asc
            """)
    List<CardSearchSummaryView> findSearchSummariesByName(
            @Param("name") String name,
            @Param("typeId") Integer typeId,
            @Param("raceId") Integer raceId,
            @Param("attributeId") Integer attributeId,
            @Param("archetypeId") Integer archetypeId,
            Pageable pageable
    );

    @EntityGraph(value = "Card.details")
    @Query("""
            select card from Card card
            where upper(card.archetypeReference.name) like upper(concat('%', :archetype, '%'))
            """)
    List<Card> findByArchetypeContainingIgnoreCase(@Param("archetype") String archetype);

    @EntityGraph(value = "Card.details")
    @Query("""
            select card from Card card
            where upper(card.typeReference.name) like upper(concat('%', :type, '%'))
            """)
    List<Card> findByTypeContainingIgnoreCase(@Param("type") String type);

    @EntityGraph(value = "Card.details")
    List<Card> findAllByNameIn(Collection<String> names);

    @EntityGraph(value = "Card.details")
    @Query("""
            select card from Card card
            where upper(card.typeReference.name) like upper(concat('%', :type, '%'))
              and upper(card.description) like upper(concat('%', :description, '%'))
            """)
    List<Card> findByTypeContainingIgnoreCaseAndDescriptionContainingIgnoreCase(
            @Param("type") String type,
            @Param("description") String description
    );

    @Query("""
            select card.id as id,
                   card.name as name,
                   card.typeReference.name as type,
                   card.archetypeReference.name as archetype
            from Card card
            """)
    List<CostCardView> findAllProjectedBy();

    @Query("select lower(card.name) from Card card")
    Set<String> findAllNormalizedNames();
}
