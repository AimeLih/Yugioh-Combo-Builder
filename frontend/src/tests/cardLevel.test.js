import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applySelfLevelChange,
  costUsesOnlyHand,
  hasOpenDeckCardCost,
  selfLevelChange,
} from '../cardLevel.js'

test('recognizes and applies a printed self Level assignment', () => {
  const effect = 'You can banish 1 "Kashtira" card from your Deck; banish the top 3 cards, and if you banish any, this card\'s Level becomes 7.'
  assert.deepEqual(selfLevelChange(effect), { kind: 'set', value: 7 })
  assert.equal(applySelfLevelChange({ name: 'Kashtira Riseheart', level: 4 }, effect).level, 7)
})

test('supports self Level increases and decreases without changing unrelated targets', () => {
  assert.equal(applySelfLevelChange({ level: 4 }, 'Increase its Level by 3.').level, 7)
  assert.equal(applySelfLevelChange({ level: 4 }, 'Decrease this card\'s Level by 2.').level, 2)
  assert.equal(applySelfLevelChange({ level: 4 }, "That target's Level becomes 1.").level, 4)
})

test('identifies open-Deck card costs and does not limit them to the hand', () => {
  const cost = 'You can banish 1 "Kashtira" card from your Deck, except "Kashtira Riseheart"; resolve it.'
  assert.equal(hasOpenDeckCardCost(cost), true)
  assert.equal(costUsesOnlyHand(cost), false)
  assert.equal(costUsesOnlyHand('You can discard 1 other card'), true)
})
