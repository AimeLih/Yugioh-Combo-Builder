CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_cards_name_trgm
    ON cards USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_cards_archetype_trgm
    ON cards USING gin (archetype gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_cards_type_trgm
    ON cards USING gin (type gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_cards_description_trgm
    ON cards USING gin (description gin_trgm_ops);