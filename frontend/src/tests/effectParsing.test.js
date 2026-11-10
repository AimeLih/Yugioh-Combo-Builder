import test from 'node:test'
import assert from 'node:assert/strict'

import { isPassiveEffectText, splitCardEffects } from '../effectParsing.js'
import { effectSourceZone } from '../effectSourceZone.js'

const card = {
  name: "Dark Magician, the Pharaoh's Servant",
  type: 'Effect Monster',
}

const handEffect = 'If this card is in your hand: You can reveal 1 Spell in your hand; '
    + 'Special Summon this card, then you can Set 1 Spell/Trap that mentions "Dark Magician" from your Deck.'
const fieldEffect = '(Quick Effect): You can discard 1 Spell; destroy all Spells/Traps your opponent controls.'

test('a parenthesized Quick Effect starts a separate printed effect', () => {
  const effects = splitCardEffects(`${handEffect} ${fieldEffect}`)

  assert.deepEqual(effects, [handEffect, fieldEffect])
  assert.equal(effects[0].includes('discard'), false)
  assert.equal(effects[1].includes('reveal'), false)
})

test('the reveal effect belongs to the hand and the discard Quick Effect belongs to the field', () => {
  const [parsedHandEffect, parsedFieldEffect] = splitCardEffects(`${handEffect} ${fieldEffect}`)

  assert.equal(effectSourceZone(parsedHandEffect, card), 'Hand')
  assert.equal(effectSourceZone(parsedFieldEffect, card), 'Monster Zone')
})

test('continuous restrictions are passive while colon-delimited activations remain active', () => {
  assert.equal(isPassiveEffectText(
      'While that Token is in the Monster Zone, the player who Summoned it cannot Special Summon monsters from the Extra Deck, except Synchro Monsters.',
  ), true)
  assert.equal(isPassiveEffectText(
      'While this card is in your GY: You can banish this card; Special Summon 1 monster.',
  ), false)
})
