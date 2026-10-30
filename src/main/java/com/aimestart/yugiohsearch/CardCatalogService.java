package com.aimestart.yugiohsearch;

import org.springframework.http.HttpStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class CardCatalogService {

    private static final int MAX_SEARCH_RESULTS = 5_000;

    public record CardSearchSummary(Long id, String name, String type, String cardImageUrl) {
    }

    public record FilterOption(Integer id, String name) {
    }

    public record CardFilterOptions(
            List<FilterOption> types,
            List<FilterOption> races,
            List<FilterOption> attributes
    ) {
    }

    private final YugiohService yugiohService;
    private final CardRepository cardRepository;
    private final CardReferenceDataService cardReferenceDataService;

    public CardCatalogService(
            YugiohService yugiohService,
            CardRepository cardRepository,
            CardReferenceDataService cardReferenceDataService
    ) {
        this.yugiohService = yugiohService;
        this.cardRepository = cardRepository;
        this.cardReferenceDataService = cardReferenceDataService;
    }

    @Transactional
    public int importNewCards() {
        return importNewCards(
                yugiohService.fetchAllCards(),
                yugiohService.fetchStapleCardNames());
    }

    int importNewCards(List<YugiohService.CardData> apiCards, Set<String> stapleNames) {
        Set<String> existingNames = new HashSet<>(cardRepository.findAllNormalizedNames());

        List<Card> newCards = apiCards.stream()
                .filter(apiCard -> existingNames.add(normalizedCardName(apiCard.name())))
                .map(apiCard -> createCard(apiCard, stapleNames))
                .toList();

        if (!newCards.isEmpty()) {
            cardReferenceDataService.resolveReferences(newCards);
            cardRepository.saveAll(newCards);
        }
        return newCards.size();
    }

    public Card getCardByName(String name) {
        Card card = cardRepository.getCardByName(name);
        if (card == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Card not found: " + name);
        }
        return card;
    }

    public List<CardSearchSummary> getCardsBySubstring(
            String name,
            Integer typeId,
            Integer raceId,
            Integer attributeId,
            Integer archetypeId,
            int limit
    ) {
        List<CardSearchSummary> cards = cardRepository
                .findSearchSummariesByName(
                        name,
                        typeId,
                        raceId,
                        attributeId,
                        archetypeId,
                        PageRequest.of(0, Math.max(1, Math.min(limit, MAX_SEARCH_RESULTS))))
                .stream()
                .map(card -> new CardSearchSummary(
                        card.getId(),
                        card.getName(),
                        card.getType(),
                        card.getCardImageUrl()))
                .toList();
        return cards;
    }

    public CardFilterOptions getFilterOptions() {
        return new CardFilterOptions(
                cardReferenceDataService.getCardTypes().stream().map(this::filterOption).toList(),
                cardReferenceDataService.getCardRaces().stream().map(this::filterOption).toList(),
                cardReferenceDataService.getCardAttributes().stream().map(this::filterOption).toList()
        );
    }

    public List<FilterOption> getArchetypeSuggestions(String query, int limit) {
        return cardReferenceDataService
                .getArchetypeSuggestions(query, limit)
                .stream()
                .map(this::filterOption)
                .toList();
    }

    private FilterOption filterOption(NamedCardReference reference) {
        return new FilterOption(reference.getId(), reference.getName());
    }

    private int weightForType(String type) {
        if (type == null) return 1;
        if (type.contains("Spell")) return 4;
        if (type.contains("Trap")) return 3;
        if (type.contains("Monster")) return type.equals("Normal Monster") ? 1 : 2;
        return 1;
    }

    private void applyApiData(
            Card card,
            YugiohService.CardData apiCard,
            Set<String> stapleNames
    ) {
        card.setStaple(stapleNames.contains(card.getName()));

        if (apiCard.cardImages() != null && !apiCard.cardImages().isEmpty()) {
            card.setCardImageUrl(apiCard.cardImages().get(0).imageUrl());
        }

        String cardType = apiCard.type() != null ? apiCard.type() : card.getType();
        if (cardType == null) return;

        card.setType(cardType);
        if (cardType.contains("Pendulum")) {
            card.setScale(apiCard.scale());
        }

        if (cardType.contains("Monster")) {
            card.setAtk(apiCard.atk());
            card.setDef(apiCard.def());
            card.setLevel(apiCard.level());
            card.setRace(apiCard.race());
            card.setAttribute(apiCard.attribute());

            if (cardType.contains("Link")) {
                card.setLinkvalue(apiCard.linkval());
                if (apiCard.linkmarkers() != null) {
                    card.setLinkmarkers(Arrays.asList(apiCard.linkmarkers()));
                }
            }
        } else if (cardType.contains("Spell") || cardType.contains("Trap")) {
            card.setRace(apiCard.race());
        }

        if (apiCard.archetype() != null && !apiCard.archetype().isBlank()) {
            card.setArchetype(apiCard.archetype());
        }
    }

    private Card createCard(YugiohService.CardData apiCard, Set<String> stapleNames) {
        Card card = new Card(apiCard.name(), apiCard.desc(), apiCard.type(), weightForType(apiCard.type()));
        applyApiData(card, apiCard, stapleNames);
        return card;
    }

    private String normalizedCardName(String name) {
        return name.toLowerCase(Locale.ROOT);
    }
}
