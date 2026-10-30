package com.aimestart.yugiohsearch;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CardReferenceDataService {

    private static final int MAX_AUTOCOMPLETE_RESULTS = 10;

    private final CardTypeRepository cardTypeRepository;
    private final CardRaceRepository cardRaceRepository;
    private final CardAttributeRepository cardAttributeRepository;
    private final ArchetypeRepository archetypeRepository;

    public CardReferenceDataService(
            CardTypeRepository cardTypeRepository,
            CardRaceRepository cardRaceRepository,
            CardAttributeRepository cardAttributeRepository,
            ArchetypeRepository archetypeRepository
    ) {
        this.cardTypeRepository = cardTypeRepository;
        this.cardRaceRepository = cardRaceRepository;
        this.cardAttributeRepository = cardAttributeRepository;
        this.archetypeRepository = archetypeRepository;
    }

    public void resolveReferences(List<Card> cards) {
        Map<String, CardType> types = resolve(
                names(cards, Card::getType),
                cardTypeRepository::findByNameIn,
                CardType::new,
                cardTypeRepository::saveAll);
        Map<String, CardRace> races = resolve(
                names(cards, Card::getRace),
                cardRaceRepository::findByNameIn,
                CardRace::new,
                cardRaceRepository::saveAll);
        Map<String, CardAttribute> attributes = resolve(
                names(cards, Card::getAttribute),
                cardAttributeRepository::findByNameIn,
                CardAttribute::new,
                cardAttributeRepository::saveAll);
        Map<String, Archetype> archetypes = resolve(
                names(cards, Card::getArchetype),
                archetypeRepository::findByNameIn,
                Archetype::new,
                archetypeRepository::saveAll);

        for (Card card : cards) {
            card.setTypeReference(types.get(card.getType()));
            card.setRaceReference(races.get(card.getRace()));
            card.setAttributeReference(attributes.get(card.getAttribute()));
            card.setArchetypeReference(archetypes.get(card.getArchetype()));
        }
    }

    public List<CardType> getCardTypes() {
        return cardTypeRepository.findAllByOrderByNameAsc();
    }

    public List<CardRace> getCardRaces() {
        return cardRaceRepository.findAllByOrderByNameAsc();
    }

    public List<CardAttribute> getCardAttributes() {
        return cardAttributeRepository.findAllByOrderByNameAsc();
    }

    public List<Archetype> getArchetypeSuggestions(String query, int limit) {
        return archetypeRepository.findByNameContainingIgnoreCaseOrderByNameAsc(
                query,
                PageRequest.of(0, Math.max(1, Math.min(limit, MAX_AUTOCOMPLETE_RESULTS))));
    }

    private <T extends NamedCardReference> Map<String, T> resolve(
            Set<String> names,
            Function<Collection<String>, List<T>> findExisting,
            Function<String, T> create,
            Function<List<T>, List<T>> saveAll
    ) {
        if (names.isEmpty()) {
            return Map.of();
        }

        List<T> references = new ArrayList<>(findExisting.apply(names));
        Set<String> existingNames = references.stream()
                .map(NamedCardReference::getName)
                .collect(Collectors.toSet());
        List<T> missing = names.stream()
                .filter(name -> !existingNames.contains(name))
                .map(create)
                .toList();
        if (!missing.isEmpty()) {
            references.addAll(saveAll.apply(missing));
        }
        return references.stream().collect(Collectors.toMap(NamedCardReference::getName, Function.identity()));
    }

    private Set<String> names(List<Card> cards, Function<Card, String> getter) {
        return cards.stream()
                .map(getter)
                .filter(name -> name != null)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
