CREATE TABLE card_archetypes
(
    card_id      BIGINT  NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
    archetype_id INTEGER NOT NULL REFERENCES archetypes (id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, archetype_id)
);

CREATE INDEX idx_card_archetypes_archetype_card
    ON card_archetypes (archetype_id, card_id);

-- Preserve the archetype supplied by the card API.
INSERT INTO card_archetypes (card_id, archetype_id)
SELECT id, archetype_id
FROM cards
WHERE archetype_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Infer additional memberships from complete card-name parts. Matching whole
-- parts avoids treating "Evol" in "Revolution" or "Ra" in "Traptrix" as an
-- archetype membership. A recursive search handles repeated occurrences, such
-- as the standalone "Ra" after the embedded letters in "Dragon".
WITH RECURSIVE occurrences AS (
    SELECT card.id AS card_id,
           archetype.id AS archetype_id,
           lower(card.name) AS card_name,
           lower(archetype.name) AS archetype_name,
           position(lower(archetype.name) IN lower(card.name)) AS match_position
    FROM cards card
    CROSS JOIN archetypes archetype
    WHERE archetype.name <> ''
      AND position(lower(archetype.name) IN lower(card.name)) > 0

    UNION ALL

    SELECT occurrence.card_id,
           occurrence.archetype_id,
           occurrence.card_name,
           occurrence.archetype_name,
           occurrence.match_position + position(
               occurrence.archetype_name
               IN substring(occurrence.card_name FROM occurrence.match_position + 1)
           )
    FROM occurrences occurrence
    WHERE position(
        occurrence.archetype_name
        IN substring(occurrence.card_name FROM occurrence.match_position + 1)
    ) > 0
)
INSERT INTO card_archetypes (card_id, archetype_id)
SELECT DISTINCT occurrence.card_id, occurrence.archetype_id
FROM occurrences occurrence
WHERE (
        occurrence.match_position = 1
        OR substring(occurrence.card_name FROM occurrence.match_position - 1 FOR 1)
            !~ '[[:alnum:]]'
      )
  AND (
        occurrence.match_position + length(occurrence.archetype_name) > length(occurrence.card_name)
        OR substring(
            occurrence.card_name
            FROM occurrence.match_position + length(occurrence.archetype_name)
            FOR 1
        ) !~ '[[:alnum:]]'
      )
ON CONFLICT DO NOTHING;
