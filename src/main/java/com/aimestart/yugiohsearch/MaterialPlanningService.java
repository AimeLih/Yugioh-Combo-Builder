package com.aimestart.yugiohsearch;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MaterialPlanningService {

    private final ComboEngine engine;

    public MaterialPlanningService(ComboEngine engine) {
        this.engine = engine;
    }

    public ComboService.FusionMaterialPlan getFusionMaterialPlan(
            String sourceName,
            String targetName,
            String selectedEffect
    ) {
        return engine.getFusionMaterialPlan(sourceName, targetName, selectedEffect);
    }

    public ComboService.FusionMaterialPlan getCardCostPlan(
            String sourceName,
            String targetName,
            String selectedEffect
    ) {
        return engine.getCardCostPlan(sourceName, targetName, selectedEffect);
    }

    public ComboService.FusionMaterialPlan getCardCostPlan(
            String sourceName,
            String targetName,
            String selectedEffect,
            List<String> candidateNames
    ) {
        return engine.getCardCostPlan(sourceName, targetName, selectedEffect, candidateNames);
    }
}
