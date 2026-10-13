import test from 'node:test'
import assert from 'node:assert/strict'

import { effectNeedsPrerequisiteCheck, specialSummonsSelfFromZone } from './effectResolution.js'

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
