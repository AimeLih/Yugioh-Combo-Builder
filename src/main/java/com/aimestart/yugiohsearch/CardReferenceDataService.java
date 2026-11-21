package com.aimestart.yugiohsearch;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
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
                cards.stream()
                        .flatMap(card -> card.getArchetypes().stream())
                        .collect(Collectors.toCollection(LinkedHashSet::new)),
                archetypeRepository::findByNameIn,
                Archetype::new,
                archetypeRepository::saveAll);
        List<Archetype> knownArchetypes = archetypeRepository.findAllByOrderByNameAsc();

        for (Card card : cards) {
            List<String> explicitArchetypes = card.getArchetypes();
            card.setTypeReference(reference(types, card.getType()));
            card.setRaceReference(reference(races, card.getRace()));
            card.setAttributeReference(reference(attributes, card.getAttribute()));

            Map<String, Archetype> memberships = knownArchetypes.stream()
                    .filter(archetype -> cardNameMatchesArchetype(card.getName(), archetype.getName()))
                    .collect(Collectors.toMap(
                            Archetype::getName,
                            Function.identity(),
                            (first, ignored) -> first,
                            java.util.LinkedHashMap::new));
            for (String explicitArchetype : explicitArchetypes) {
                Archetype reference = reference(archetypes, explicitArchetype);
                if (reference != null) {
                    memberships.putIfAbsent(reference.getName(), reference);
                }
            }
            card.setArchetypeReferences(memberships.values());
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

    static boolean cardNameMatchesArchetype(String cardName, String archetypeName) {
        if (cardName == null || archetypeName == null || archetypeName.isBlank()) {
            return false;
        }

        String normalizedName = cardName.toLowerCase(Locale.ROOT);
        String normalizedArchetype = archetypeName.toLowerCase(Locale.ROOT);
        int fromIndex = 0;
        int matchIndex;
        while ((matchIndex = normalizedName.indexOf(normalizedArchetype, fromIndex)) >= 0) {
            int matchEnd = matchIndex + normalizedArchetype.length();
            boolean startsAtBoundary = matchIndex == 0
                    || !Character.isLetterOrDigit(normalizedName.charAt(matchIndex - 1));
            boolean endsAtBoundary = matchEnd == normalizedName.length()
                    || !Character.isLetterOrDigit(normalizedName.charAt(matchEnd));
            if (startsAtBoundary && endsAtBoundary) {
                return true;
            }
            fromIndex = matchIndex + 1;
        }
        return false;
    }

    private <T> T reference(Map<String, T> references, String name) {
        return name == null ? null : references.get(name);
    }
}
