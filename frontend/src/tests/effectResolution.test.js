import test from 'node:test'
import assert from 'node:assert/strict'

import {
  coinTossRequirement,
  effectSearchRequirement,
  effectTargetRequirement,
  effectNeedsPrerequisiteCheck,
  genericDiscardRequirement,
  historicalGraveyardRequirement,
  historicalPrerequisiteFailure,
  isEffectSearchCandidate,
  isFieldSpell,
  isSpellTrapCard,
  placeFieldSpell,
  specialSummonsSelfFromZone,
  spellTrapResolutionZone,
} from '../effectResolution.js'

test('coin toss effects expose the printed toss count', () => {
  assert.deepEqual(coinTossRequirement('Toss a coin and call it. If you call it right: Draw 1 card.'), { count: 1 })
  assert.deepEqual(coinTossRequirement('Toss 3 coins.'), { count: 3 })
})

test('turn history preserves controlled monster graveyard requirements', () => {
  const effect = 'If a Level 8 or higher monster under your control was sent to the Graveyard this turn: Special Summon 1 "Berserk Dragon" from your hand or Deck.'
  assert.deepEqual(historicalGraveyardRequirement(effect), { minimumLevel: 8 })
  assert.equal(effectNeedsPrerequisiteCheck(effect), true)
  assert.match(historicalPrerequisiteFailure(effect, []), /Level 8 or higher/)
  assert.equal(historicalPrerequisiteFailure(effect, [{
    type: 'sent-to-graveyard',
    wasControlled: true,
    card: { level: 8 },
  }]), '')
})

const betrayalEffect = 'When this card is activated: Add 2 "Exosister" monsters from your Deck to your hand, then discard 1 card.'

const pharaohEffect = 'If this card is in your hand: You can reveal 1 Spell in your hand; '
    + 'Special Summon this card, then you can Set 1 Spell/Trap that mentions "Dark Magician" from your Deck.'

test('reveal requirements are checked before an effect can be activated', () => {
  assert.equal(effectNeedsPrerequisiteCheck(pharaohEffect), true)
})

test('a discard performed after a search is resolution, not an activation prerequisite', () => {
  assert.equal(effectNeedsPrerequisiteCheck(betrayalEffect), false)
  assert.deepEqual(effectSearchRequirement(betrayalEffect), {
    count: 2,
    min: 2,
    max: 2,
    family: 'Exosister',
    kind: 'monster',
    matchIndex: 29,
  })
  assert.deepEqual(genericDiscardRequirement(betrayalEffect), {
    count: 1,
    phase: 'resolution',
    matchIndex: 90,
  })
})

test('generic discard costs remain activation prerequisites', () => {
  const effect = 'You can discard 1 card; draw 1 card.'
  assert.equal(effectNeedsPrerequisiteCheck(effect), true)
  assert.equal(genericDiscardRequirement(effect).phase, 'cost')
})

test('multi-card searches filter the requested family and exclude Extra Deck monsters', () => {
  const requirement = effectSearchRequirement(betrayalEffect)
  assert.equal(isEffectSearchCandidate({ name: 'Exosister Martha', archetype: 'Exosister', type: 'Effect Monster' }, requirement), true)
  assert.equal(isEffectSearchCandidate({ name: 'Exosister Mikailis', archetype: 'Exosister', type: 'Xyz Monster' }, requirement), false)
  assert.equal(isEffectSearchCandidate({ name: 'Unrelated Monster', archetype: 'Other', type: 'Effect Monster' }, requirement), false)
})

test('direct effect targets are parsed independently from combo recommendations', () => {
  const trudeaEffect = 'During your Main Phase: You can place this card you control and 1 "Centur-Ion" monster from your hand or Deck, except "Centur-Ion Trudea", in your Spell & Trap Zones as face-up Continuous Traps.'
  assert.deepEqual(effectTargetRequirement(trudeaEffect), {
    action: 'place',
    count: 1,
    min: 1,
    max: 1,
    family: 'Centur-Ion',
    kind: 'monster',
    sources: ['hand', 'deck'],
    excludedNames: ['Centur-Ion Trudea'],
  })
})

test('self-only movement does not create a second-card target request', () => {
  assert.equal(effectTargetRequirement('During the Main Phase: You can Special Summon this card.'), null)
})

test('direct effect targets preserve comma-separated source zones', () => {
  const requirement = effectTargetRequirement(
      'Special Summon 1 "Example" monster from your hand, Deck, or GY to your field.',
  )
  assert.deepEqual(requirement.sources, ['hand', 'deck', 'graveyard'])
})

test('a hand effect that says Special Summon this card moves its source, not another monster', () => {
  assert.equal(specialSummonsSelfFromZone(pharaohEffect, 'hand'), true)
  assert.equal(specialSummonsSelfFromZone(pharaohEffect, 'monsterZone'), false)
})

test('an ordinary summon effect does not move its source card', () => {
  assert.equal(
      specialSummonsSelfFromZone('Special Summon 1 monster that mentions "Dark Magician".', 'hand'),
      false,
  )
})

test('control conditions are checked before an effect can be activated', () => {
  assert.equal(
      effectNeedsPrerequisiteCheck(
          'If you control "Dark Magician": Special Summon 1 "Dark Magician Girl" from your hand, Deck, or GY.',
      ),
      true,
  )
})

test('named cards required on the field trigger a prerequisite check', () => {
  assert.equal(
      effectNeedsPrerequisiteCheck(
          'If "Harpie Lady" is on the field: Special Summon 1 "Harpie Lady Sisters" from your hand or Deck.',
      ),
      true,
  )
})

test('normal Spells and Traps resolve from the hand to the Graveyard', () => {
  const spell = { type: 'Spell Card', race: 'Normal' }
  const trap = { type: 'Trap Card', race: 'Normal' }

  assert.equal(isSpellTrapCard(spell), true)
  assert.equal(spellTrapResolutionZone(spell, null, 'Draw 1 card.'), 'graveyard')
  assert.equal(spellTrapResolutionZone(trap, null, 'Destroy 1 card.'), 'graveyard')
})

test('Continuous Spells and Traps remain in the Spell and Trap Zone', () => {
  assert.equal(
      spellTrapResolutionZone({ type: 'Spell Card', race: 'Continuous' }, null, 'Activate this card.'),
      'spellTrapZone',
  )
  assert.equal(
      spellTrapResolutionZone(
          { type: 'Effect Monster', race: 'Fiend' },
          { treatedAs: 'Continuous Trap' },
          'Apply this effect.',
      ),
      'spellTrapZone',
  )
})

test('Field Spells resolve to their dedicated Field Zone', () => {
  const fieldSpell = { type: 'Spell Card', race: 'Field' }
  assert.equal(isFieldSpell(fieldSpell), true)
  assert.equal(spellTrapResolutionZone(fieldSpell, null, 'All monsters gain 500 ATK.'), 'fieldZone')
})

test('playing a new Field Spell sends the previous one to the Graveyard', () => {
  const oldEntry = { instanceId: 'old', card: { name: 'Old Field', type: 'Spell Card', race: 'Field' } }
  const newEntry = { instanceId: 'new', card: { name: 'New Field', type: 'Spell Card', race: 'Field' } }
  const zones = { fieldZone: [oldEntry], graveyard: [] }

  assert.equal(placeFieldSpell(zones, newEntry), oldEntry)
  assert.deepEqual(zones.fieldZone, [newEntry])
  assert.equal(zones.graveyard[0].card.name, 'Old Field')
  assert.equal(zones.graveyard[0].moveReason, 'field-spell-replaced')
})

test('explicit self movement overrides normal Spell and Trap cleanup', () => {
  const spell = { type: 'Spell Card', race: 'Normal' }

  assert.equal(spellTrapResolutionZone(spell, null, 'Banish this card.'), 'banished')
  assert.equal(spellTrapResolutionZone(spell, null, 'Add this card to your hand.'), 'hand')
})
