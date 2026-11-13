const DIRECTIONS = {
  'top-left': [-1, -1],
  top: [0, -1],
  'top-right': [1, -1],
  left: [-1, 0],
  right: [1, 0],
  'bottom-left': [-1, 1],
  bottom: [0, 1],
  'bottom-right': [1, 1],
}

const FIXED_SLOTS = {
  monsterZone: [0, 1, 2, 3, 4],
  extraMonsterZone: [0, 1],
  spellTrapZone: [0, 1, 2, 3, 4],
  pendulumZone: [0, 4],
  fieldZone: [0],
}

export function normalizedLinkMarker(marker) {
  return (marker || '').toLowerCase().replace(/[_\s]+/g, '-').replace(/^[-]+|[-]+$/g, '')
}

export function entrySlot(entry, fallback = null) {
  return Number.isInteger(entry?.slot) ? entry.slot : fallback
}

export function fixedSlotsForZone(zone) {
  return FIXED_SLOTS[zone] || null
}

function occupiedSlots(entries) {
  return new Set((entries || []).map((entry, index) => entrySlot(entry, index)))
}

export function openMainMonsterSlots(zones) {
  const occupied = occupiedSlots(zones.monsterZone)
  return FIXED_SLOTS.monsterZone.filter(slot => !occupied.has(slot))
}

export function openExtraMonsterSlots(zones) {
  const occupied = occupiedSlots(zones.extraMonsterZone)
  return FIXED_SLOTS.extraMonsterZone.filter(slot => !occupied.has(slot))
}

export function openPendulumSlots(zones) {
  const occupied = occupiedSlots(zones.pendulumZone)
  const spellTrapOccupied = occupiedSlots(zones.spellTrapZone)
  return FIXED_SLOTS.pendulumZone.filter(slot => !occupied.has(slot) && !spellTrapOccupied.has(slot))
}

export function openSpellTrapSlots(zones) {
  const occupied = occupiedSlots(zones.spellTrapZone)
  const pendulumOccupied = occupiedSlots(zones.pendulumZone)
  return FIXED_SLOTS.spellTrapZone.filter(slot => !occupied.has(slot) && !pendulumOccupied.has(slot))
}

export function assignZoneSlot(zones, zone, entry, preferredSlot = null) {
  let open = null
  if (zone === 'monsterZone') open = openMainMonsterSlots(zones)
  if (zone === 'extraMonsterZone') open = openExtraMonsterSlots(zones)
  if (zone === 'spellTrapZone') open = openSpellTrapSlots(zones)
  if (zone === 'pendulumZone') open = openPendulumSlots(zones)
  if (zone === 'fieldZone') open = [0]
  if (!open) return entry
  const slot = preferredSlot !== null && open.includes(preferredSlot) ? preferredSlot : open[0]
  return slot === undefined ? entry : { ...entry, slot }
}

function coordinateFor(zone, slot) {
  if (zone === 'monsterZone') return [slot, 1]
  if (zone === 'extraMonsterZone') return [slot === 0 ? 1 : 3, 0]
  if (zone === 'spellTrapZone' || zone === 'pendulumZone') return [slot, 2]
  return null
}

function fieldEntries(zones) {
  return ['monsterZone', 'extraMonsterZone', 'spellTrapZone', 'pendulumZone']
      .flatMap(zone => (zones[zone] || []).map((entry, index) => ({
        entry,
        zone,
        slot: entrySlot(entry, index),
      })))
      .map(value => ({ ...value, coordinate: coordinateFor(value.zone, value.slot) }))
      .filter(value => value.coordinate)
}

function isLink(entry) {
  return /link monster/i.test(entry?.card?.type || '')
}

export function calculateLinkState(zones) {
  const entries = fieldEntries(zones)
  const byCoordinate = new Map(entries.map(value => [value.coordinate.join(','), value]))
  const pointedMainSlots = new Set()
  const pointedEntryIds = new Set()
  const pointedBy = new Map()
  const arrowsByEntry = new Map()

  for (const source of entries.filter(value => isLink(value.entry))) {
    const arrows = (source.entry.card.linkmarkers || []).map(normalizedLinkMarker)
    arrowsByEntry.set(source.entry.instanceId, arrows)
    for (const arrow of arrows) {
      const vector = DIRECTIONS[arrow]
      if (!vector) continue
      const targetCoordinate = [source.coordinate[0] + vector[0], source.coordinate[1] + vector[1]]
      if (targetCoordinate[1] === 1 && targetCoordinate[0] >= 0 && targetCoordinate[0] <= 4) {
        pointedMainSlots.add(targetCoordinate[0])
      }
      const target = byCoordinate.get(targetCoordinate.join(','))
      if (!target) continue
      pointedEntryIds.add(target.entry.instanceId)
      const sources = pointedBy.get(target.entry.instanceId) || []
      pointedBy.set(target.entry.instanceId, [...sources, source.entry.instanceId])
    }
  }

  const coLinkedEntryIds = new Set()
  for (const source of entries.filter(value => isLink(value.entry))) {
    for (const arrow of arrowsByEntry.get(source.entry.instanceId) || []) {
      const vector = DIRECTIONS[arrow]
      if (!vector) continue
      const target = byCoordinate.get(`${source.coordinate[0] + vector[0]},${source.coordinate[1] + vector[1]}`)
      if (!target || !isLink(target.entry)) continue
      const reciprocal = Object.entries(DIRECTIONS).find(([, candidate]) =>
        candidate[0] === -vector[0] && candidate[1] === -vector[1])?.[0]
      if ((arrowsByEntry.get(target.entry.instanceId) || []).includes(reciprocal)) {
        coLinkedEntryIds.add(source.entry.instanceId)
        coLinkedEntryIds.add(target.entry.instanceId)
      }
    }
  }

  return { pointedMainSlots, pointedEntryIds, pointedBy, coLinkedEntryIds }
}

export function linkEffectPrerequisiteFailure(entry, effectText, zones) {
  const text = (effectText || '').toLowerCase()
  if (!/\b(?:points? to|linked|co-linked)\b/.test(text)) return ''
  const state = calculateLinkState(zones)
  if (/\bif this card is co-linked\b/.test(text) && !state.coLinkedEntryIds.has(entry?.instanceId)) {
    return 'This effect requires the Link Monster to be co-linked.'
  }
  if (/\b(?:monster|card)s? this card points? to\b/.test(text)) {
    const hasTarget = [...state.pointedBy.entries()].some(([, sourceIds]) => sourceIds.includes(entry?.instanceId))
    if (!hasTarget) return 'This effect requires a card in a zone this Link Monster points to.'
  }
  if (/\blinked monsters?\b/.test(text) && state.pointedEntryIds.size === 0) {
    return 'This effect requires a linked monster.'
  }
  return ''
}

