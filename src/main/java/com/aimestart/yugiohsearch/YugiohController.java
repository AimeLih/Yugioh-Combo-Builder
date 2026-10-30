package com.aimestart.yugiohsearch;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/yugioh")
@CrossOrigin(originPatterns = {"http://localhost:5173", "https://yugioh-combo.vercel.app"})
public class YugiohController {

    private static final String IMPORT_TOKEN_HEADER = "X-Import-Token";

    @Value("${import.token}")
    private String importToken;

    private final CardCatalogService cardCatalogService;
    private final ComboService comboService;

    public YugiohController(CardCatalogService cardCatalogService, ComboService comboService) {
        this.cardCatalogService = cardCatalogService;
        this.comboService = comboService;
    }

    @GetMapping("/card")
    public Card getCardByName(@RequestParam String name) {
        return cardCatalogService.getCardByName(name);
    }

    @GetMapping("/card/combos")
    public List<ComboService.ComboOption> getPossibleCombos(
            @RequestParam String name,
            @RequestParam(required = false) String zone,
            @RequestParam(required = false) String effect
    ) {
        return comboService.getPossibleCombos(name, zone, effect);
    }

    @PostMapping("/card/effect-prerequisites")
    public ComboService.EffectPrerequisiteResult checkEffectPrerequisites(
            @RequestBody ComboService.EffectPrerequisiteRequest request
    ) {
        return comboService.checkEffectPrerequisites(request);
    }

    @GetMapping("/card/fusion-materials")
    public ComboService.FusionMaterialPlan getFusionMaterials(
            @RequestParam String source,
            @RequestParam String target,
            @RequestParam(required = false) String effect
    ) {
        return comboService.getFusionMaterialPlan(source, target, effect);
    }

    @GetMapping("/card/cost-materials")
    public ComboService.FusionMaterialPlan getCostMaterials(
            @RequestParam String source,
            @RequestParam String target,
            @RequestParam(required = false) String effect
    ) {
        return comboService.getCardCostPlan(source, target, effect);
    }

    @GetMapping("/card/substring")
    public List<CardCatalogService.CardSearchSummary> getCardBySubstring(
            @RequestParam(defaultValue = "") String name,
            @RequestParam(required = false) Integer typeId,
            @RequestParam(required = false) Integer raceId,
            @RequestParam(required = false) Integer attributeId,
            @RequestParam(required = false) Integer archetypeId,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return cardCatalogService.getCardsBySubstring(
                name, typeId, raceId, attributeId, archetypeId, limit);
    }

    @GetMapping("/card/filters")
    public CardCatalogService.CardFilterOptions getCardFilters() {
        return cardCatalogService.getFilterOptions();
    }

    @GetMapping("/card/archetypes")
    public List<CardCatalogService.FilterOption> getArchetypeSuggestions(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int limit
    ) {
        return cardCatalogService.getArchetypeSuggestions(query, limit);
    }

    public record ImportResult(int cardsAdded) {}

    @PostMapping("/admin/import")
    public ImportResult importNewCards(
            @RequestHeader(value = IMPORT_TOKEN_HEADER, required = false)
            String providedToken
    ) {
        requireImportToken(providedToken);
        return new ImportResult(cardCatalogService.importNewCards());
    }

    private void requireImportToken(String providedToken) {
        if (importToken.isBlank() || !importToken.equals(providedToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid import token");
        }
    }
}
