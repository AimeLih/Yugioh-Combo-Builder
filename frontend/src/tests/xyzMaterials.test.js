import test from 'node:test'
import assert from 'node:assert/strict'

import {
  attachXyzMaterials,
  canUseAsLevelXyzMaterial,
  detachXyzMaterials,
  materialCombinations,
  parseExtraDeckMaterialClause,
  prepareXyzMaterials,
  releaseXyzMaterials,
  xyzMaterialDetachCount,
  xyzMaterialDetachRequirement,
  xyzAlternateMaterialDescriptor,
  xyzAttachmentSourceZones,
  xyzTransfersExistingMaterials,
} from '../xyzMaterials.js'

const material = (instanceId, name, overlayMaterials = []) => ({
  instanceId,
  card: { id: instanceId, name },
  overlayMaterials,
  treatedAs: 'Monster',
})

test('treats x+ Xyz wording as an x-material minimum', () => {
  assert.deepEqual(parseExtraDeckMaterialClause('2+ Level 7 monsters'), {
    minimum: 2,
    repeatable: true,
    descriptor: 'Level 7 monsters',
  })
  assert.deepEqual(parseExtraDeckMaterialClause('3 or more Level 4 monsters'), {
    minimum: 3,
    repeatable: true,
    descriptor: 'Level 4 monsters',
  })
  assert.deepEqual(parseExtraDeckMaterialClause('2 Level 8 monsters'), {
    minimum: 2,
    repeatable: false,
    descriptor: 'Level 8 monsters',
  })
})

test('tries every minimum-size material set before sets with extra materials', () => {
  const sets = materialCombinations(['a', 'b', 'c', 'd'], 2)
  assert.equal(sets.slice(0, 6).every(set => set.length === 2), true)
  assert.deepEqual(sets[0], ['a', 'b'])
  assert.equal(sets[6].length, 3)
})

test('reads modern and legacy Xyz detach costs', () => {
  assert.equal(xyzMaterialDetachCount('You can detach 1 material from this card; draw 1 card.'), 1)
  assert.equal(xyzMaterialDetachCount('Detach 2 Xyz Materials from this card; destroy those targets.'), 2)
  assert.equal(xyzMaterialDetachCount('Detach one material from this card; negate that effect.'), 1)
  assert.equal(xyzMaterialDetachCount('Target 1 card on the field; destroy it.'), 0)
})

test('reads variable, ranged, all, and cross-monster detach costs', () => {
  assert.deepEqual(
    xyzMaterialDetachRequirement('You can detach up to 3 different types of materials from this card; apply these effects.'),
    { min: 1, max: 3, all: false, source: 'self', differentTypes: true },
  )
  assert.deepEqual(
    xyzMaterialDetachRequirement('Detach 2 to 4 materials from this card, then activate the appropriate effect.'),
    { min: 2, max: 4, all: false, source: 'self', differentTypes: false },
  )
  assert.deepEqual(
    xyzMaterialDetachRequirement('Detach 2 materials from an Xyz Monster you control; draw 1 card.'),
    { min: 2, max: 2, all: false, source: 'controlledXyz', differentTypes: false },
  )
  assert.equal(xyzMaterialDetachRequirement('Detach all materials from this card; destroy it.').all, true)
})

test('prepares summon materials without nesting an old Xyz stack', () => {
  const oldOverlay = material('old-overlay', 'Old Overlay')
  const oldXyz = material('old-xyz', 'Old Xyz', [oldOverlay])
  const other = material('other', 'Other Monster')

  const result = prepareXyzMaterials([oldXyz, other])

  assert.deepEqual(result.attachedMaterials.map(entry => entry.card.name), ['Old Xyz', 'Other Monster'])
  assert.deepEqual(result.attachedMaterials[0].overlayMaterials, [])
  assert.deepEqual(result.releasedMaterials.map(entry => entry.card.name), ['Old Overlay'])
})

test('transfers an old Xyz stack only when alternate summon text requires it', () => {
  const oldOverlay = material('old-overlay', 'Old Overlay')
  const oldXyz = material('old-xyz', 'Old Xyz', [oldOverlay])

  const result = prepareXyzMaterials([oldXyz], { transferExistingMaterials: true })

  assert.deepEqual(result.attachedMaterials.map(entry => entry.card.name), ['Old Xyz', 'Old Overlay'])
  assert.deepEqual(result.releasedMaterials, [])
})

test('recognizes alternate Xyz material requirements and explicit transfer text', () => {
  const text = 'Once per turn, you can also Xyz Summon this card by using 1 Rank 3 or 4 Xyz Monster you control. (Transfer its materials to this card.)'
  assert.equal(xyzAlternateMaterialDescriptor(text), 'Rank 3 or 4 Xyz Monster')
  assert.equal(xyzTransfersExistingMaterials(text), true)
  assert.equal(xyzTransfersExistingMaterials('2 Level 4 monsters'), false)
})

test('does not treat an Xyz Monster Rank as a Level for a standard Xyz Summon', () => {
  assert.equal(canUseAsLevelXyzMaterial({ type: 'Effect Monster', level: 4 }, 4), true)
  assert.equal(canUseAsLevelXyzMaterial({ type: 'Synchro Monster', level: 4 }, 4), true)
  assert.equal(canUseAsLevelXyzMaterial({ type: 'Xyz Monster', level: 4 }, 4), false)
  assert.equal(canUseAsLevelXyzMaterial({ type: 'Link Monster', level: 4 }, 4), false)
})

test('identifies the printed source zone for an attachment effect', () => {
  assert.deepEqual(xyzAttachmentSourceZones('Target 1 monster in your GY; attach it to this card as material.'), ['graveyard'])
  assert.deepEqual(xyzAttachmentSourceZones('Attach 1 of your banished monsters to this card as material.'), ['banished'])
  assert.deepEqual(xyzAttachmentSourceZones('Attach 1 monster from your hand to it as material.'), ['hand'])
})

test('detaches only the selected material and sends it independently to the Graveyard', () => {
  const first = material('first', 'First Material')
  const second = material('second', 'Second Material')
  const xyz = material('xyz', 'Xyz Monster', [first, second])

  const result = detachXyzMaterials(xyz, ['second'])

  assert.deepEqual(result.entry.overlayMaterials.map(entry => entry.card.name), ['First Material'])
  assert.deepEqual(result.detachedMaterials.map(entry => entry.card.name), ['Second Material'])
  assert.equal(result.detachedMaterials[0].moveReason, 'xyz-material-detached')
  assert.equal(result.detachedMaterials[0].moveFrom, 'xyzMaterial')
  assert.equal(result.detachedMaterials[0].wasOnField, false)
})

test('attaches a card to an existing Xyz stack', () => {
  const xyz = material('xyz', 'Xyz Monster', [material('first', 'First Material')])
  const attached = material('second', 'Second Material')

  const result = attachXyzMaterials(xyz, [attached])

  assert.deepEqual(result.entry.overlayMaterials.map(entry => entry.card.name), [
    'First Material',
    'Second Material',
  ])
  assert.deepEqual(result.releasedMaterials, [])
})

test('releases every material when its Xyz Monster leaves the field', () => {
  const xyz = material('xyz', 'Xyz Monster', [
    material('first', 'First Material'),
    material('second', 'Second Material'),
  ])

  const result = releaseXyzMaterials(xyz)

  assert.deepEqual(result.entry.overlayMaterials, [])
  assert.deepEqual(result.releasedMaterials.map(entry => entry.card.name), [
    'First Material',
    'Second Material',
  ])
})
