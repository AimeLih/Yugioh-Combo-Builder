import test from 'node:test'
import assert from 'node:assert/strict'

import {
  assignZoneSlot,
  calculateLinkState,
  linkEffectPrerequisiteFailure,
  openPendulumSlots,
  openSpellTrapSlots,
} from '../fieldLayout.js'

function cardEntry(id, type, markers = [], slot = null) {
  return { instanceId: id, slot, card: { name: id, type, linkmarkers: markers } }
}

test('Pendulum scales consume the outside Spell and Trap slots', () => {
  const zones = { spellTrapZone: [], pendulumZone: [cardEntry('left', 'Pendulum Monster', [], 0), cardEntry('right', 'Pendulum Monster', [], 4)] }
  assert.deepEqual(openSpellTrapSlots(zones), [1, 2, 3])
})

test('Spell and Trap cards in outside slots block those Pendulum slots', () => {
  const zones = { spellTrapZone: [cardEntry('set-card', 'Trap Card', [], 0)], pendulumZone: [] }
  assert.deepEqual(openPendulumSlots(zones), [4])
  assert.equal(assignZoneSlot(zones, 'pendulumZone', cardEntry('scale', 'Pendulum Monster')).slot, 4)
})

test('zone assignment uses stable numbered slots', () => {
  const zones = { monsterZone: [cardEntry('first', 'Effect Monster', [], 0)] }
  assert.equal(assignZoneSlot(zones, 'monsterZone', cardEntry('second', 'Effect Monster')).slot, 1)
})

test('zone assignment honors a user-selected open Monster Zone', () => {
  const zones = { monsterZone: [cardEntry('first', 'Effect Monster', [], 0)] }
  assert.equal(assignZoneSlot(zones, 'monsterZone', cardEntry('second', 'Effect Monster'), 4).slot, 4)
})

test('zone assignment honors the selected left or right Extra Monster Zone', () => {
  const zones = { extraMonsterZone: [] }
  assert.equal(assignZoneSlot(zones, 'extraMonsterZone', cardEntry('left', 'Link Monster'), 0).slot, 0)
  assert.equal(assignZoneSlot(zones, 'extraMonsterZone', cardEntry('right', 'Link Monster'), 1).slot, 1)
})

test('Link arrows point from an Extra Monster Zone into exact Main Monster slots', () => {
  const link = cardEntry('link', 'Link Monster', ['Bottom-Left', 'Bottom', 'Bottom-Right'], 0)
  const target = cardEntry('target', 'Effect Monster', [], 1)
  const zones = { monsterZone: [target], extraMonsterZone: [link], spellTrapZone: [], pendulumZone: [] }
  const state = calculateLinkState(zones)
  assert.deepEqual([...state.pointedMainSlots], [0, 1, 2])
  assert.equal(state.pointedEntryIds.has('target'), true)
  assert.equal(linkEffectPrerequisiteFailure(link, 'Target 1 monster this card points to; destroy it.', zones), '')
})

test('co-linked Link Monsters point back at each other', () => {
  const upper = cardEntry('upper', 'Link Monster', ['Bottom'], 0)
  const lower = cardEntry('lower', 'Link Monster', ['Top'], 1)
  const zones = { monsterZone: [lower], extraMonsterZone: [upper], spellTrapZone: [], pendulumZone: [] }
  const state = calculateLinkState(zones)
  assert.equal(state.coLinkedEntryIds.has('upper'), true)
  assert.equal(state.coLinkedEntryIds.has('lower'), true)
})

