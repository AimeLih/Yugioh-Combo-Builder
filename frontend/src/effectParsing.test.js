import test from 'node:test'
import assert from 'node:assert/strict'

import { splitCardEffects } from './effectParsing.js'
import { effectSourceZone } from './effectSourceZone.js'

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
