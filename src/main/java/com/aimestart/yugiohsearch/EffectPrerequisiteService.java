package com.aimestart.yugiohsearch;

import org.springframework.stereotype.Service;

@Service
public class EffectPrerequisiteService {

    private final ComboEngine engine;

    public EffectPrerequisiteService(ComboEngine engine) {
        this.engine = engine;
    }

    public ComboService.EffectPrerequisiteResult checkEffectPrerequisites(
            ComboService.EffectPrerequisiteRequest request
    ) {
        return engine.checkEffectPrerequisites(request);
    }
}
