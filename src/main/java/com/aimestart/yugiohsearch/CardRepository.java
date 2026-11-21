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
        String getArchetypes();
        String getRace();
    }

    interface CardSearchSummaryView {
        Long getId();
        String getName();
        String getType();
        String getCardImageUrl();
        String getDescription();
        Integer getLevel();
        Integer getLinkvalue();
    }

    @EntityGraph(value = "Card.details")
    Card getCardByName(String name);

    @EntityGraph(value = "Card.details")
    List<Card> findByNameContainingIgnoreCase(String name);

    @Query("""
            select card.id as id,
                   card.name as name,
                   typeReference.name as type,
                   card.cardImageUrl as cardImageUrl,
                   card.description as description,
                   card.level as level,
                   card.linkvalue as linkvalue
            from Card card
            join card.typeReference typeReference
            left join card.raceReference raceReference
            left join card.attributeReference attributeReference
            where upper(card.name) like upper(concat('%', :name, '%'))
              and (:typeId is null or typeReference.id = :typeId)
              and (:raceId is null or raceReference.id = :raceId)
              and (:fieldSpell is null or :fieldSpell = false or lower(raceReference.name) = 'field')
              and (:attributeId is null or attributeReference.id = :attributeId)
              and (:archetypeId is null or exists (
                    select membership.id
                    from card.archetypeReferences membership
                    where membership.id = :archetypeId
              ))
              and (:level is null or card.level = :level)
              and (
                :tuner is null
                or (:tuner = true and lower(typeReference.name) like '%tuner%')
                or (:tuner = false and lower(typeReference.name) not like '%tuner%')
              )
            order by card.name asc
            """)
    List<CardSearchSummaryView> findSearchSummariesByName(
            @Param("name") String name,
            @Param("typeId") Integer typeId,
            @Param("raceId") Integer raceId,
            @Param("fieldSpell") Boolean fieldSpell,
            @Param("attributeId") Integer attributeId,
            @Param("archetypeId") Integer archetypeId,
            @Param("level") Integer level,
            @Param("tuner") Boolean tuner,
            Pageable pageable
    );

    @EntityGraph(value = "Card.details")
    @Query("""
            select distinct card from Card card
            join card.archetypeReferences membership
            where upper(membership.name) like upper(concat('%', :archetype, '%'))
            """)
    List<Card> findByArchetypeContainingIgnoreCase(@Param("archetype") String archetype);

    @EntityGraph(value = "Card.details")
    @Query("""
            select distinct card from Card card
            join card.archetypeReferences membership
            where membership.name in :archetypes
            """)
    List<Card> findByArchetypesIn(@Param("archetypes") Collection<String> archetypes);

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
                   typeReference.name as type,
                   '' as archetypes,
                   raceReference.name as race
            from Card card
            join card.typeReference typeReference
            left join card.raceReference raceReference
            where (:cardType is null
                    or lower(typeReference.name) like lower(concat('%', :cardType, '%')))
              and (:race is null or lower(raceReference.name) = lower(:race))
            """)
    List<CostCardView> findCostCandidatesByTypeAndRace(
            @Param("cardType") String cardType,
            @Param("race") String race
    );

    @Query(value = """
            with candidate_ids as (
                select card.id
                from cards card
                where upper(card.name) like upper(concat('%', cast(:quotedTerm as text), '%'))

                union

                select card.id
                from archetypes matched_archetype
                join card_archetypes membership
                    on membership.archetype_id = matched_archetype.id
                join cards card on card.id = membership.card_id
                where upper(matched_archetype.name)
                    like upper(concat('%', cast(:quotedTerm as text), '%'))
            )
            select card.id as id,
                   card.name as name,
                   type_reference.name as type,
                   coalesce((
                       select string_agg(membership_archetype.name, '|' order by membership_archetype.name)
                       from card_archetypes card_membership
                       join archetypes membership_archetype
                           on membership_archetype.id = card_membership.archetype_id
                       where card_membership.card_id = card.id
                   ), '') as archetypes,
                   race_reference.name as race
            from candidate_ids candidate
            join cards card on card.id = candidate.id
            join card_types type_reference on type_reference.id = card.type_id
            left join card_races race_reference on race_reference.id = card.race_id
            where (cast(:cardType as text) is null
                    or lower(type_reference.name)
                        like lower(concat('%', cast(:cardType as text), '%')))
              and (cast(:race as text) is null
                    or lower(race_reference.name) = lower(cast(:race as text)))
            """, nativeQuery = true)
    List<CostCardView> findCostCandidatesByQuotedTerm(
            @Param("cardType") String cardType,
            @Param("race") String race,
            @Param("quotedTerm") String quotedTerm
    );

    @Query("select lower(card.name) from Card card")
    Set<String> findAllNormalizedNames();
}
