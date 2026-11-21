import test from 'node:test'
import assert from 'node:assert/strict'
import { normalSummonTributeCount, tributeSummonCandidates } from '../tributeSummon.js'

test('uses the official Level-based Tribute Summon counts', () => {
  assert.equal(normalSummonTributeCount({ type: 'Effect Monster', level: 4 }), 0)
  assert.equal(normalSummonTributeCount({ type: 'Effect Monster', level: 5 }), 1)
  assert.equal(normalSummonTributeCount({ type: 'Normal Monster', level: 6 }), 1)
  assert.equal(normalSummonTributeCount({ type: 'Effect Monster', level: 7 }), 2)
  assert.equal(normalSummonTributeCount({ type: 'Normal Monster', level: 12 }), 2)
})

test('honors printed no-Tribute and increased-Tribute requirements', () => {
  assert.equal(normalSummonTributeCount({
    type: 'Effect Monster',
    level: 7,
    description: 'You can Normal Summon this card without Tributing.',
  }), 0)
  assert.equal(normalSummonTributeCount({
    type: 'Effect Monster',
    level: 10,
    description: 'Requires 3 Tributes to Normal Summon (cannot be Normal Set).',
  }), 3)
})

test('only controlled monsters are offered as Tribute Summon material', () => {
  const main = { instanceId: 'main', card: { name: 'Main Monster' } }
  const extra = { instanceId: 'extra', card: { name: 'Extra Monster' } }
  const candidates = tributeSummonCandidates({
    monsterZone: [main],
    extraMonsterZone: [extra],
    hand: [{ instanceId: 'hand', card: { name: 'Hand Monster' } }],
  })

  assert.deepEqual(candidates.map(entry => entry.instanceId), ['main', 'extra'])
  assert.deepEqual(candidates.map(entry => entry.tributeSourceZone), ['monsterZone', 'extraMonsterZone'])
})
