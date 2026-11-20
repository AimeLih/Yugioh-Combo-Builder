package com.aimestart.yugiohsearch;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/** Application service for combo discovery. */
@Service
public class ComboService {

    private final ComboEngine engine;

    @Autowired
    ComboService(ComboEngine engine) {
        this.engine = engine;
    }

    public ComboService(CardRepository cardRepository) {
        this.engine = new ComboEngine(cardRepository);
    }

    public List<ComboOption> getPossibleCombos(String cardName, String zone, String selectedEffect) {
        return engine.getPossibleCombos(cardName, zone, selectedEffect);
    }

    /** @deprecated Use {@link EffectPrerequisiteService#checkEffectPrerequisites(EffectPrerequisiteRequest)}. */
    @Deprecated(forRemoval = false)
    public EffectPrerequisiteResult checkEffectPrerequisites(EffectPrerequisiteRequest request) {
        return engine.checkEffectPrerequisites(request);
    }

    /** @deprecated Use {@link MaterialPlanningService#getFusionMaterialPlan(String, String, String)}. */
    @Deprecated(forRemoval = false)
    public FusionMaterialPlan getFusionMaterialPlan(String sourceName, String targetName, String selectedEffect) {
        return engine.getFusionMaterialPlan(sourceName, targetName, selectedEffect);
    }

    /** @deprecated Use {@link MaterialPlanningService#getCardCostPlan(String, String, String)}. */
    @Deprecated(forRemoval = false)
    public FusionMaterialPlan getCardCostPlan(String sourceName, String targetName, String selectedEffect) {
        return engine.getCardCostPlan(sourceName, targetName, selectedEffect);
    }

    /** @deprecated Use {@link MaterialPlanningService#getCardCostPlan(String, String, String, List)}. */
    @Deprecated(forRemoval = false)
    public FusionMaterialPlan getCardCostPlan(
            String sourceName,
            String targetName,
            String selectedEffect,
            List<String> candidateNames
    ) {
        return engine.getCardCostPlan(sourceName, targetName, selectedEffect, candidateNames);
    }

    public record ComboOption(
            Card card,
            String reason,
            int score,
            String label,
            String timing,
            String sourceZone,
            String destination,
            String cost,
            boolean oncePerTurn
    ) {}

    public record FusionMaterialSlot(
            String requirement,
            int count,
            List<MaterialCardOption> eligibleCards
    ) {}

    public record MaterialCardOption(Long id, String name, String type) {}

    public record FusionMaterialPlan(
            String action,
            String availableFrom,
            String destination,
            List<FusionMaterialSlot> slots,
            List<String> restrictions
    ) {}

    public record EffectPrerequisiteRequest(
            String source,
            String effect,
            String sourceZone,
            Map<String, List<String>> zones
    ) {}

    public record EffectPrerequisiteResult(
            boolean available,
            String reason,
            List<String> legalSummonTargets
    ) {}
}
