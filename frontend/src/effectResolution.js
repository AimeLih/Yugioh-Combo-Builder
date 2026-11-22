export function effectNeedsPrerequisiteCheck(effectText) {
  const text = effectText || ''
  const semicolonIndex = text.indexOf(';')
  const costClause = semicolonIndex >= 0 ? text.slice(0, semicolonIndex) : ''
  const conditionClause = semicolonIndex >= 0 ? costClause : text.split(/[.]/, 1)[0]
  return /\b(?:discard|tribute|reveal|send|banish|destroy|shuffle)\b/i.test(costClause)
      || /\btarget\s+(?:up to\s+)?(?:\d+|a|an|one|two|three|four|five)\b[^.;]*?\b(?:in|from)\s+(?:your|the)\s+(?:GY|Graveyard|hand|banished cards?)\b/i.test(text)
      || /\bif you control\b/i.test(conditionClause)
      || /\bif\b[^:;.]*\bon (?:your|the) field\b/i.test(conditionClause)
      || /\blevel\s+\d+\s+or higher monster(?:\(s\)|s?) (?:you controlled|under your control) (?:was|were) sent (?:from (?:your|the) field )?to (?:(?:your|the) )?(?:gy|graveyard) this turn\b/i.test(text)
      || /\b(?:fusion|synchro|xyz) summon\b/i.test(text)
}

export function coinTossRequirement(effectText) {
  const text = effectText || ''
  const match = text.match(/\b(?:toss|flip)\s+(?:(\d+|a|one|two|three|four|five)\s+)?coins?\b/i)
  if (!match) return null
  return {
    count: Math.max(1, effectNumber(match[1] || 'a')),
  }
}

export function historicalGraveyardRequirement(effectText) {
  const match = (effectText || '').match(
      /\blevel\s+(\d+)\s+or higher monster(?:\(s\)|s?) (?:you controlled|under your control) (?:was|were) sent (?:from (?:your|the) field )?to (?:(?:your|the) )?(?:gy|graveyard) this turn\b/i,
  )
  return match ? { minimumLevel: Number(match[1]) } : null
}

export function historicalPrerequisiteFailure(effectText, duelEvents) {
  const requirement = historicalGraveyardRequirement(effectText)
  if (!requirement) return ''
  const satisfied = (duelEvents || []).some(event => event.type === 'sent-to-graveyard'
      && event.wasControlled
      && Number(event.card?.level) >= requirement.minimumLevel)
  return satisfied
    ? ''
    : `A Level ${requirement.minimumLevel} or higher monster you controlled must have been sent to the GY this turn.`
}

const EFFECT_NUMBER_WORDS = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
}

function effectNumber(value) {
  if (/^\d+$/.test(value || '')) return Number(value)
  return EFFECT_NUMBER_WORDS[(value || '').toLowerCase()] ?? 0
}

export function effectSearchRequirement(effectText) {
  const text = effectText || ''
  const match = text.match(
      /\badd\s+(up to\s+)?(\d+|one|two|three|four|five)\s+(?:"([^"]+)"\s+)?(cards?|monsters?|spells?|traps?)\s+from\s+(?:your|the)\s+deck\s+to\s+(?:your|the)\s+hand\b/i,
  )
  if (!match) return null

  const count = effectNumber(match[2])
  return {
    count,
    min: match[1] ? 1 : count,
    max: count,
    family: match[3] || '',
    kind: match[4].replace(/s$/i, '').toLowerCase(),
    matchIndex: match.index,
  }
}

export function effectTargetRequirement(effectText) {
  const text = effectText || ''
  const controlledCost = text.match(
      /\b(send|banish|destroy)\s+(up to\s+)?(\d+|a|an|one|two|three|four|five)\s+(face-up\s+)?(?:"([^"]+)"\s+)?(cards?|monsters?|spells?|traps?)\s+you control\s+(?:to\s+(?:the|your)\s+(GY|Graveyard)|face-up)?(?=\s*;|[.])/i,
  )
  if (controlledCost) {
    const count = effectNumber(controlledCost[3])
    return {
      action: controlledCost[1].toLowerCase(),
      count,
      min: controlledCost[2] ? 1 : count,
      max: count,
      family: controlledCost[5] || '',
      kind: controlledCost[6].replace(/s$/i, '').toLowerCase(),
      subtype: '',
      sources: ['field'],
      excludedNames: [...text.matchAll(/\bexcept\s+"([^"]+)"/gi)].map(exclusion => exclusion[1]),
      phase: 'cost',
      faceUp: Boolean(controlledCost[4]),
      atkChange: 0,
    }
  }

  const graveyardTarget = text.match(
      /\btarget\s+(up to\s+)?(\d+|a|an|one|two|three|four|five)\s+(?:face-up\s+)?(?:"([^"]+)"\s+)?(?:(Fusion|Synchro|Xyz|Link)\s+)?(cards?|monsters?|spells?|traps?)\s+in\s+(?:your|the)\s+(GY|Graveyard|hand|banished cards?)(?=\s*;|[,.])/i,
  )
  if (graveyardTarget) {
    const count = effectNumber(graveyardTarget[2])
    const resolutionClause = text.slice(graveyardTarget.index + graveyardTarget[0].length)
    const action = /\bspecial summon\s+(?:it|them|that)/i.test(resolutionClause)
      ? 'special summon'
      : /\badd\s+(?:it|them|that)\s+to\s+(?:your|the)\s+hand/i.test(resolutionClause)
        ? 'add'
        : /\bbanish\s+(?:it|them|that)/i.test(resolutionClause) ? 'banish' : 'target'
    const source = /\b(?:GY|Graveyard)\b/i.test(graveyardTarget[6])
      ? 'graveyard'
      : /\bhand\b/i.test(graveyardTarget[6]) ? 'hand' : 'banished'
    const atkLoss = resolutionClause.match(/\b(?:it|they) loses?\s+(\d+)\s+ATK\b/i)
    return {
      action,
      count,
      min: graveyardTarget[1] ? 1 : count,
      max: count,
      family: graveyardTarget[3] || '',
      kind: graveyardTarget[5].replace(/s$/i, '').toLowerCase(),
      subtype: (graveyardTarget[4] || '').toLowerCase(),
      sources: [source],
      excludedNames: [...text.matchAll(/\bexcept\s+"([^"]+)"/gi)].map(exclusion => exclusion[1]),
      phase: 'target',
      faceUp: false,
      atkChange: atkLoss ? -Number(atkLoss[1]) : 0,
    }
  }

  const match = text.match(
      /\b(place|set|special summon|send|banish|attach|return|shuffle|add)\b[^.;]*?\b(up to\s+)?(\d+|a|an|one|two|three|four|five)\s+(?:"([^"]+)"\s+)?(cards?|monsters?|spells?|traps?)\s+from\s+(?:your|the)\s+(.+?)(?=,\s*(?:except|then|in|to)\b|\s+to\s+(?:your|the)\b|[;.]|$)/i,
  )
  if (!match) return null

  const count = effectNumber(match[3])
  const sourceText = match[6].toLowerCase()
  const sources = []
  if (/\bhand\b/.test(sourceText)) sources.push('hand')
  if (/\bextra deck\b/.test(sourceText)) sources.push('extraDeck')
  else if (/\bdeck\b/.test(sourceText)) sources.push('deck')
  if (/\b(?:gy|graveyard)\b/.test(sourceText)) sources.push('graveyard')
  if (/\bbanished\b/.test(sourceText)) sources.push('banished')
  if (/\bfield\b/.test(sourceText)) sources.push('field')
  if (sources.length === 0) return null

  return {
    action: match[1].toLowerCase(),
    count,
    min: match[2] ? 1 : count,
    max: count,
    family: match[4] || '',
    kind: match[5].replace(/s$/i, '').toLowerCase(),
    subtype: '',
    sources,
    excludedNames: [...text.matchAll(/\bexcept\s+"([^"]+)"/gi)].map(exclusion => exclusion[1]),
    phase: 'resolution',
    faceUp: false,
    atkChange: 0,
  }
}

export function matchesEffectTargetRequirement(card, requirement) {
  if (!card || !requirement) return false
  const type = (card.type || '').toLowerCase()
  if (requirement.kind === 'monster' && !type.includes('monster')) return false
  if (requirement.kind === 'spell' && !type.includes('spell')) return false
  if (requirement.kind === 'trap' && !type.includes('trap')) return false
  if (requirement.subtype && !type.includes(requirement.subtype)) return false
  if (!requirement.family) return true
  const family = requirement.family.toLowerCase()
  return (card.name || '').toLowerCase().includes(family)
      || (card.archetypes || []).some(archetype => archetype.toLowerCase().includes(family))
}

export function currentEffectRequirementFailure(effectText, zones, sourceEntryId = null) {
  const requirement = effectTargetRequirement(effectText)
  if (!requirement || requirement.sources.some(source => ['deck', 'extraDeck'].includes(source))) return ''
  const sourceZones = []
  if (requirement.sources.includes('hand')) sourceZones.push('hand')
  if (requirement.sources.includes('graveyard')) sourceZones.push('graveyard')
  if (requirement.sources.includes('banished')) sourceZones.push('banished')
  if (requirement.sources.includes('field')) {
    sourceZones.push('monsterZone', 'extraMonsterZone', 'spellTrapZone', 'fieldZone', 'pendulumZone')
  }
  const excluded = new Set(requirement.excludedNames.map(name => name.toLowerCase()))
  const available = sourceZones.flatMap(zone => zones?.[zone] || [])
      .filter(entry => entry.instanceId !== sourceEntryId)
      .filter(entry => !excluded.has((entry.card?.name || '').toLowerCase()))
      .filter(entry => matchesEffectTargetRequirement(entry.card, requirement))
  if (available.length >= requirement.min) return ''
  const family = requirement.family ? ` “${requirement.family}”` : ''
  const subtype = requirement.subtype ? ` ${requirement.subtype}` : ''
  const location = requirement.sources.includes('field') ? 'you control' : `in your ${requirement.sources[0]}`
  return `This effect requires ${requirement.min}${family}${subtype} ${requirement.kind}${requirement.min === 1 ? '' : 's'} ${location}.`
}

export function tokenSummonRequirement(effectText) {
  const text = effectText || ''
  const summon = text.match(
      /\bspecial summon\s+(?:up to\s+)?(\d+|a|an|one|two|three|four|five)\s+"([^"]+ tokens?)"(?:\s*\(([^)]*)\))?/i,
  )
  if (!summon) return null

  const details = summon[3] || ''
  const declaredLevels = text.match(/\bdeclare\s+Level\s+((?:\d+\s*(?:,|or|and)\s*)+\d+)/i)?.[1] || ''
  const levelChoices = [...declaredLevels.matchAll(/\d+/g)].map(match => Number(match[0]))
  const printedLevel = details.match(/\bLevel\s+(\d+)\b/i)?.[1]
  const race = details.split('/').map(part => part.trim()).find(part =>
    part && !/^(?:dark|divine|earth|fire|light|water|wind|level\s+\d+|atk\s+\d+|def\s+\d+|tuner)$/i.test(part)) || ''

  return {
    count: effectNumber(summon[1]),
    name: summon[2],
    race,
    attribute: details.match(/\b(DARK|DIVINE|EARTH|FIRE|LIGHT|WATER|WIND)\b/i)?.[1]?.toUpperCase() || '',
    atk: Number(details.match(/\bATK\s+(\d+)\b/i)?.[1] ?? 0),
    def: Number(details.match(/\bDEF\s+(\d+)\b/i)?.[1] ?? 0),
    level: printedLevel ? Number(printedLevel) : null,
    levelChoices,
  }
}

export function selfCostDestination(effectText, sourceZone) {
  const text = effectText || ''
  if (!text.includes(';')) return null
  const costClause = text.split(';', 1)[0]
  if (sourceZone === 'graveyard'
      && /\bbanish this card(?:\s+from\s+(?:your|the)\s+(?:GY|Graveyard))?\b/i.test(costClause)) {
    return 'banished'
  }
  return null
}

export function isEffectSearchCandidate(card, requirement) {
  if (!card || !requirement) return false
  const type = (card.type || '').toLowerCase()
  if (/(?:fusion|synchro|xyz|link) monster/.test(type)) return false
  if (requirement.kind === 'monster' && !type.includes('monster')) return false
  if (requirement.kind === 'spell' && !type.includes('spell')) return false
  if (requirement.kind === 'trap' && !type.includes('trap')) return false

  if (!requirement.family) return true
  const family = requirement.family.toLowerCase()
  return (card.name || '').toLowerCase().includes(family)
      || (card.archetypes || []).some(archetype => archetype.toLowerCase().includes(family))
}

export function genericDiscardRequirement(effectText) {
  const text = effectText || ''
  const match = text.match(/\bdiscard\s+(\d+|a|one|two|three|four|five)\s+cards?\b/i)
  if (!match) return null

  const semicolonIndex = text.indexOf(';')
  return {
    count: effectNumber(match[1]),
    phase: semicolonIndex >= 0 && match.index < semicolonIndex ? 'cost' : 'resolution',
    matchIndex: match.index,
  }
}

export function specialSummonsSelfFromZone(effectText, zone) {
  const text = effectText || ''
  if (!['hand', 'spellTrapZone'].includes(zone)) return false
  if (/\bspecial summon this card\b/i.test(text)) return true
  return zone === 'hand'
      && /\b(?:must (?:first )?be|can be) special summoned\s*\(\s*from your hand\s*\)/i.test(text)
}

export function isSpellTrapCard(card) {
  return /(?:spell|trap)/i.test(card?.type || '')
}

export function isFieldSpell(card) {
  return isSpellTrapCard(card)
      && (/(?:^|\s)field(?:\s|$)/i.test(card?.race || '')
        || /field spell/i.test(card?.type || ''))
}

export function placeFieldSpell(zones, entry) {
  const replaced = (zones.fieldZone || []).find(candidate => candidate.instanceId !== entry.instanceId)
  zones.fieldZone = [entry]
  if (replaced) {
    zones.graveyard.push({
      ...replaced,
      moveReason: 'field-spell-replaced',
      treatedAs: null,
      overlayMaterials: [],
    })
  }
  return replaced || null
}

export function spellTrapResolutionZone(card, entry, effectText) {
  const text = effectText || ''
  if (/\bbanish this card\b/i.test(text)) return 'banished'
  if (/\b(?:return|add) this card to (?:your|the) hand\b/i.test(text)) return 'hand'
  if (isFieldSpell(card)) return 'fieldZone'
  if (/\bset this card\b/i.test(text)) return 'spellTrapZone'

  const staysFaceUp = /continuous/i.test(card?.race || '')
      || /continuous (?:spell|trap)/i.test(card?.type || '')
      || /continuous (?:spell|trap)/i.test(entry?.treatedAs || '')
  return staysFaceUp ? 'spellTrapZone' : 'graveyard'
}
