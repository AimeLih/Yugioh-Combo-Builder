package com.aimestart.yugiohsearch;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cards")
@NamedEntityGraph(
        name = "Card.details",
        attributeNodes = {
                @NamedAttributeNode("typeReference"),
                @NamedAttributeNode("raceReference"),
                @NamedAttributeNode("attributeReference"),
                @NamedAttributeNode("archetypeReference"),
                @NamedAttributeNode("linkmarkers")
        }
)
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "type_id", nullable = false)
    private CardType typeReference;

    @Column(nullable = false)
    private int weight;

    @Column
    private Integer atk;

    @Column
    private Integer def;

    @Column
    private Integer level;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "race_id")
    private CardRace raceReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attribute_id")
    private CardAttribute attributeReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "archetype_id")
    private Archetype archetypeReference;

    @Column
    private Integer scale;

    @Column
    private Integer linkvalue;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "card_link_markers",
            joinColumns = @JoinColumn(name = "card_id")
    )
    @OrderColumn(name = "marker_order")
    @Column(name = "marker", nullable = false, columnDefinition = "TEXT")
    private List<String> linkmarkers = new ArrayList<>();

    @Column
    private Boolean staple;

    @Column(name = "card_image_url", columnDefinition = "TEXT")
    private String cardImageUrl;
    public Card() {
    }

    public Card(String name, String description, String type, int weight) {
        this.name = name;
        this.description = description;
        setType(type);
        this.weight = weight;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getWeight() {
        return weight;
    }

    public void setWeight(int weight) {
        this.weight = weight;
    }

    public String getType() {
        return typeReference == null ? null : typeReference.getName();
    }

    public void setType(String type) {
        this.typeReference = type == null ? null : new CardType(type);
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public Integer getAtk() {
        return atk;
    }

    public void setAtk(Integer atk) {
        this.atk = atk;
    }

    public Integer getDef() {
        return def;
    }

    public void setDef(Integer def) {
        this.def = def;
    }

    public String getRace() {
        return raceReference == null ? null : raceReference.getName();
    }

    public void setRace(String race) {
        this.raceReference = race == null ? null : new CardRace(race);
    }

    public String getAttribute() {
        return attributeReference == null ? null : attributeReference.getName();
    }

    public void setAttribute(String attribute) {
        this.attributeReference = attribute == null ? null : new CardAttribute(attribute);
    }

    public String getArchetype() {
        return archetypeReference == null ? null : archetypeReference.getName();
    }

    public void setArchetype(String archetype) {
        this.archetypeReference = archetype == null ? null : new Archetype(archetype);
    }

    void setTypeReference(CardType typeReference) {
        this.typeReference = typeReference;
    }

    void setRaceReference(CardRace raceReference) {
        this.raceReference = raceReference;
    }

    void setAttributeReference(CardAttribute attributeReference) {
        this.attributeReference = attributeReference;
    }

    void setArchetypeReference(Archetype archetypeReference) {
        this.archetypeReference = archetypeReference;
    }

    public Integer getScale() {
        return scale;
    }

    public void setScale(Integer scale) {
        this.scale = scale;
    }

    public Integer getLinkvalue() {
        return linkvalue;
    }

    public void setLinkvalue(Integer linkvalue) {
        this.linkvalue = linkvalue;
    }

    public List<String> getLinkmarkers() {
        return linkmarkers;
    }

    public void setLinkmarkers(List<String> linkmarkers) {
        this.linkmarkers = linkmarkers;
    }

    public Boolean isStaple() {
        return staple;
    }

    public void setStaple(Boolean staple) {
        this.staple = staple;
    }

    public String getCardImageUrl() {
        return cardImageUrl;
    }

    public void setCardImageUrl(String cardImageUrl) {
        this.cardImageUrl = cardImageUrl;
    }
}
