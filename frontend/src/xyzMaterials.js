const NUMBER_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
}

function materialCount(value) {
  const normalized = String(value || '').toLowerCase()
  return Number.isFinite(Number(normalized)) ? Number(normalized) : NUMBER_WORDS[normalized] || 0
}

export function parseExtraDeckMaterialClause(rawClause) {
  const raw = String(rawClause || '')
  const countMatch = raw.match(/^\s*(\d+)\s*(\+|or\s+more)?(?=\s)/i)
  return {
    minimum: countMatch ? Number(countMatch[1]) : 1,
    repeatable: Boolean(countMatch?.[2]),
    descriptor: countMatch ? raw.slice(countMatch[0].length).trim() : raw.trim(),
  }
}

export function materialCombinations(items, minimum = 2, maximum = 5) {
  const results = []
  const limit = Math.min(maximum, items.length)
  const visit = (start, chosen, targetSize) => {
    if (chosen.length === targetSize) {
      results.push([...chosen])
      return
    }
    for (let index = start; index < items.length; index += 1) {
      chosen.push(items[index])
      visit(index + 1, chosen, targetSize)
      chosen.pop()
    }
  }
  for (let size = minimum; size <= limit; size += 1) visit(0, [], size)
  return results
}

function withoutNestedMaterials(entry, moveReason) {
  return {
    ...entry,
    moveReason,
    moveFrom: 'xyzMaterial',
    wasOnField: false,
    treatedAs: null,
    overlayMaterials: [],
  }
}

export function xyzMaterialDetachRequirement(effectText) {
  const text = effectText || ''
  if (!/\bdetach\b/i.test(text) || !/\b(?:xyz\s+)?materials?\b/i.test(text)) return null

  const materialPhrase = '(?:different types? of\\s+)?(?:xyz\\s+)?materials?'
  const range = text.match(new RegExp(`\\bdetach\\s+(\\d+|one|two|three|four|five)\\s+to\\s+(\\d+|one|two|three|four|five)\\s+${materialPhrase}\\b`, 'i'))
  const upTo = text.match(new RegExp(`\\bdetach\\s+up to\\s+(\\d+|one|two|three|four|five)\\s+${materialPhrase}\\b`, 'i'))
  const exact = text.match(new RegExp(`\\bdetach\\s+(\\d+|one|two|three|four|five)\\s+${materialPhrase}\\b`, 'i'))
  const all = /\bdetach\s+all\s+(?:xyz\s+)?materials?\b/i.test(text)
  if (!range && !upTo && !exact && !all) return null

  const source = /\bfrom\s+(?:an?|the)\s+(?:xyz\s+)?monsters?(?:\(s\))?\s+you control\b/i.test(text)
    || /\bfrom\s+monsters?(?:\(s\))?\s+you control\b/i.test(text)
    ? 'controlledXyz'
    : 'self'
  const min = range
    ? materialCount(range[1])
    : exact
      ? materialCount(exact[1])
      : 1
  const max = range
    ? materialCount(range[2])
    : upTo
      ? materialCount(upTo[1])
      : exact
        ? materialCount(exact[1])
        : Number.POSITIVE_INFINITY

  return {
    min,
    max,
    all,
    source,
    differentTypes: /\bdifferent types? of materials?\b/i.test(text),
  }
}

export function xyzMaterialDetachCount(effectText) {
  const requirement = xyzMaterialDetachRequirement(effectText)
  return requirement && requirement.min === requirement.max ? requirement.min : 0
}

export function prepareXyzMaterials(materials, { transferExistingMaterials = false } = {}) {
  const attachedMaterials = materials.flatMap(material => [
    withoutNestedMaterials(material, 'xyz-material'),
    ...(transferExistingMaterials
      ? (material.overlayMaterials || []).map(overlay =>
        withoutNestedMaterials(overlay, 'xyz-material-transferred'))
      : []),
  ])
  const releasedMaterials = transferExistingMaterials
    ? []
    : materials.flatMap(material =>
      (material.overlayMaterials || []).map(overlay =>
        withoutNestedMaterials(overlay, 'xyz-material-released')))
  return { attachedMaterials, releasedMaterials }
}

export function attachXyzMaterials(entry, materials, options) {
  const prepared = prepareXyzMaterials(materials, options)
  return {
    entry: {
      ...entry,
      overlayMaterials: [...(entry.overlayMaterials || []), ...prepared.attachedMaterials],
    },
    releasedMaterials: prepared.releasedMaterials,
  }
}

export function materialCardCategory(material) {
  const type = (material?.card?.type || '').toLowerCase()
  if (type.includes('spell')) return 'Spell'
  if (type.includes('trap')) return 'Trap'
  return 'Monster'
}

export function xyzAlternateMaterialDescriptor(cardText) {
  return (cardText || '').match(
    /also Xyz Summon[\s\S]*?by using 1\s+(.+?)\s+you control(?:\s+with a different name)?(?:\s+as (?:the )?(?:Xyz )?material)?[.(]/i,
  )?.[1]?.trim() || ''
}

export function xyzTransfersExistingMaterials(cardText) {
  return /transfer its materials|materials attached to (?:it|that (?:target|monster)) also become/i
      .test(cardText || '')
}

export function canUseAsLevelXyzMaterial(card, requiredLevel) {
  const type = (card?.type || '').toLowerCase()
  if (type.includes('xyz') || type.includes('link')) return false
  return Number(card?.level) === Number(requiredLevel)
}

export function xyzAttachmentSourceZones(effectText) {
  const text = effectText || ''
  if (/\b(?:in|from) (?:your|the) (?:gy|graveyard)\b/i.test(text)) return ['graveyard']
  if (/\b(?:your )?banish(?:ed|ment)\b/i.test(text)) return ['banished']
  if (/\b(?:in|from) your hand\b/i.test(text)) return ['hand']
  if (/\b(?:on|from) (?:your side of )?the field\b|\byou control\b/i.test(text)) {
    return ['monsterZone', 'extraMonsterZone', 'spellTrapZone', 'pendulumZone']
  }
  return []
}

export function detachXyzMaterials(entry, materialIds) {
  const selectedIds = new Set(materialIds)
  const detachedMaterials = []
  const remainingMaterials = []

  for (const material of entry.overlayMaterials || []) {
    if (selectedIds.has(material.instanceId)) {
      detachedMaterials.push(withoutNestedMaterials(material, 'xyz-material-detached'))
    } else {
      remainingMaterials.push(material)
    }
  }

  return {
    entry: { ...entry, overlayMaterials: remainingMaterials },
    detachedMaterials,
  }
}

export function releaseXyzMaterials(entry) {
  return {
    entry: { ...entry, overlayMaterials: [] },
    releasedMaterials: (entry.overlayMaterials || []).map(material =>
      withoutNestedMaterials(material, 'xyz-material-released')),
  }
}
