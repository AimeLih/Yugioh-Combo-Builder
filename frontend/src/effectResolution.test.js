import test from 'node:test'
import assert from 'node:assert/strict'

import {
  effectNeedsPrerequisiteCheck,
  isSpellTrapCard,
  specialSummonsSelfFromZone,
  spellTrapResolutionZone,
} from './effectResolution.js'

const pharaohEffect = 'If this card is in your hand: You can reveal 1 Spell in your hand; '
    + 'Special Summon this card, then you can Set 1 Spell/Trap that mentions "Dark Magician" from your Deck.'

test('reveal requirements are checked before an effect can be activated', () => {
  assert.equal(effectNeedsPrerequisiteCheck(pharaohEffect), true)
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

test('explicit self movement overrides normal Spell and Trap cleanup', () => {
  const spell = { type: 'Spell Card', race: 'Normal' }

  assert.equal(spellTrapResolutionZone(spell, null, 'Banish this card.'), 'banished')
  assert.equal(spellTrapResolutionZone(spell, null, 'Add this card to your hand.'), 'hand')
})
