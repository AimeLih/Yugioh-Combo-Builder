DROP INDEX IF EXISTS idx_cards_name_trgm;
DROP INDEX IF EXISTS idx_cards_archetype_trgm;
DROP INDEX IF EXISTS idx_cards_type_trgm;
DROP INDEX IF EXISTS idx_cards_description_trgm;

CREATE INDEX idx_cards_name_upper_trgm
    ON cards USING gin (upper(name) gin_trgm_ops);

CREATE INDEX idx_cards_archetype_upper_trgm
    ON cards USING gin (upper(archetype) gin_trgm_ops);

CREATE INDEX idx_cards_type_upper_trgm
    ON cards USING gin (upper(type) gin_trgm_ops);

CREATE INDEX idx_cards_description_upper_trgm
    ON cards USING gin (upper(description) gin_trgm_ops);