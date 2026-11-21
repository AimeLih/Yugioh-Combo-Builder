import test from 'node:test'
import assert from 'node:assert/strict'
import { effectSourceZone } from '../effectSourceZone.js'

const brandedBond = {
  name: 'Branded Bond',
  type: 'Spell Card',
}

test('Branded Bond activates its summon effect from the Spell & Trap Zone', () => {
  const effect = 'Special Summon 1 of your "Fallen of Albaz" that is banished, in your hand, or in your GY.'

  assert.equal(effectSourceZone(effect, brandedBond), 'Spell & Trap Zone')
})

test('Branded Bond still identifies its own Graveyard effect', () => {
  const effect = 'During the End Phase, if this card is in the GY because it was sent there to activate the effect of "Fallen of Albaz" this turn: You can Set this card.'

  assert.equal(effectSourceZone(effect, brandedBond), 'Graveyard')
})

test('a Monster Zone effect does not move to the Graveyard because its target is there', () => {
  const card = { name: 'Test Reviver', type: 'Effect Monster' }
  const effect = 'Once per turn: You can target 1 monster in your GY; Special Summon it.'

  assert.equal(effectSourceZone(effect, card), 'Monster Zone')
})

test('an effect that moves this card from the Graveyard remains a Graveyard effect', () => {
  const card = { name: 'Test Returner', type: 'Effect Monster' }
  const effect = 'You can banish this card from your GY; Special Summon 1 monster from your hand.'

  assert.equal(effectSourceZone(effect, card), 'Graveyard')
})

test('a parenthesized self-Special-Summon is available from the Hand', () => {
  const card = { name: 'Test Self Summoner', type: 'Effect Monster' }
  const effect = 'If you control no monsters: You can Special Summon this card (from your hand).'

  assert.equal(effectSourceZone(effect, card), 'Hand')
})

test('an inherent hand Special Summon procedure is available from the Hand', () => {
  const card = { name: 'Test Procedure Monster', type: 'Effect Monster' }
  const effect = 'Must first be Special Summoned (from your hand) by banishing 1 LIGHT monster from your GY.'

  assert.equal(effectSourceZone(effect, card), 'Hand')
})
