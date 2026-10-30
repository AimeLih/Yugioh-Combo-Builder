package com.aimestart.yugiohsearch;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Table;

@MappedSuperclass
abstract class NamedCardReference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    private String name;

    protected NamedCardReference() {
    }

    protected NamedCardReference(String name) {
        this.name = name;
    }

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}

@Entity
@Table(name = "card_types")
class CardType extends NamedCardReference {
    protected CardType() {
    }

    CardType(String name) {
        super(name);
    }
}

@Entity
@Table(name = "card_races")
class CardRace extends NamedCardReference {
    protected CardRace() {
    }

    CardRace(String name) {
        super(name);
    }
}

@Entity
@Table(name = "card_attributes")
class CardAttribute extends NamedCardReference {
    protected CardAttribute() {
    }

    CardAttribute(String name) {
        super(name);
    }
}

@Entity
@Table(name = "archetypes")
class Archetype extends NamedCardReference {
    protected Archetype() {
    }

    Archetype(String name) {
        super(name);
    }
}
