package com.aimestart.yugiohsearch;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class YugiohSearchApplicationTests {

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void contextLoads() {
    }

    @Test
    void quotedCostCandidateUnionQueryExecutesWithNullableFilters() {
        assertTrue(cardRepository.findCostCandidatesByQuotedTerm(
                "monster", null, "__no_such_test_archetype__").isEmpty());
    }

    @Test
    void cardsNoLongerHaveAPrimaryArchetypeColumn() {
        Integer columnCount = jdbcTemplate.queryForObject("""
                SELECT count(*)
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'cards'
                  AND column_name = 'archetype_id'
                """, Integer.class);

        assertEquals(0, columnCount);
    }

}
