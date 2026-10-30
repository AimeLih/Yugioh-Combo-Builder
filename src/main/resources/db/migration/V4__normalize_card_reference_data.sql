CREATE TABLE card_types
(
    name TEXT PRIMARY KEY
);

CREATE TABLE card_races
(
    name TEXT PRIMARY KEY
);

CREATE TABLE card_attributes
(
    name TEXT PRIMARY KEY
);

CREATE TABLE archetypes
(
    name TEXT PRIMARY KEY
);

INSERT INTO card_types (name)
SELECT DISTINCT type
FROM cards
WHERE type IS NOT NULL;

INSERT INTO card_races (name)
SELECT DISTINCT race
FROM cards
WHERE race IS NOT NULL;

INSERT INTO card_attributes (name)
SELECT DISTINCT attribute
FROM cards
WHERE attribute IS NOT NULL;

INSERT INTO archetypes (name)
SELECT DISTINCT archetype
FROM cards
WHERE archetype IS NOT NULL;

ALTER TABLE cards
    ADD CONSTRAINT fk_cards_type
        FOREIGN KEY (type) REFERENCES card_types (name),
    ADD CONSTRAINT fk_cards_race
        FOREIGN KEY (race) REFERENCES card_races (name),
    ADD CONSTRAINT fk_cards_attribute
        FOREIGN KEY (attribute) REFERENCES card_attributes (name),
    ADD CONSTRAINT fk_cards_archetype
        FOREIGN KEY (archetype) REFERENCES archetypes (name);

CREATE INDEX idx_cards_type_btree ON cards (type);
CREATE INDEX idx_cards_race_btree ON cards (race);
CREATE INDEX idx_cards_attribute_btree ON cards (attribute);
CREATE INDEX idx_cards_archetype_btree ON cards (archetype);

CREATE TABLE card_link_markers
(
    card_id      BIGINT  NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
    marker_order INTEGER NOT NULL,
    marker       TEXT    NOT NULL,
    PRIMARY KEY (card_id, marker_order)
);

INSERT INTO card_link_markers (card_id, marker_order, marker)
SELECT cards.id, link_marker.ordinality - 1, link_marker.marker
FROM cards
         CROSS JOIN LATERAL unnest(cards.link_markers)
             WITH ORDINALITY AS link_marker(marker, ordinality)
WHERE link_marker.marker IS NOT NULL;

ALTER TABLE cards
    DROP COLUMN link_markers;

-- Keep reference tables synchronized when future card imports introduce a new
-- type, race, attribute, or archetype. The trigger runs before foreign-key
-- validation, so the importing application does not need a second write path.
CREATE FUNCTION ensure_card_reference_values()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
BEGIN
    IF NEW.type IS NOT NULL THEN
        INSERT INTO card_types (name) VALUES (NEW.type) ON CONFLICT DO NOTHING;
    END IF;
    IF NEW.race IS NOT NULL THEN
        INSERT INTO card_races (name) VALUES (NEW.race) ON CONFLICT DO NOTHING;
    END IF;
    IF NEW.attribute IS NOT NULL THEN
        INSERT INTO card_attributes (name) VALUES (NEW.attribute) ON CONFLICT DO NOTHING;
    END IF;
    IF NEW.archetype IS NOT NULL THEN
        INSERT INTO archetypes (name) VALUES (NEW.archetype) ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER cards_ensure_reference_values
    BEFORE INSERT OR UPDATE OF type, race, attribute, archetype
    ON cards
    FOR EACH ROW
EXECUTE FUNCTION ensure_card_reference_values();
