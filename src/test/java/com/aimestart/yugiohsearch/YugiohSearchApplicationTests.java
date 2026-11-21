package com.aimestart.yugiohsearch;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class YugiohSearchApplicationTests {

    @Autowired
    private CardRepository cardRepository;

    @Test
    void contextLoads() {
    }

    @Test
    void quotedCostCandidateUnionQueryExecutesWithNullableFilters() {
        assertTrue(cardRepository.findCostCandidatesByQuotedTerm(
                "monster", null, "__no_such_test_archetype__").isEmpty());
    }

}
