-- Preserve every legacy API-supplied archetype as a normal membership before
-- removing the redundant one-archetype-per-card relationship.
INSERT INTO card_archetypes (card_id, archetype_id)
SELECT id, archetype_id
FROM cards
WHERE archetype_id IS NOT NULL
ON CONFLICT DO NOTHING;

DROP INDEX IF EXISTS idx_cards_archetype_id;

ALTER TABLE cards
    DROP CONSTRAINT IF EXISTS fk_cards_archetype_id,
    DROP COLUMN archetype_id;
