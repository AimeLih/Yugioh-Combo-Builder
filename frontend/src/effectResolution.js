export function effectNeedsPrerequisiteCheck(effectText) {
  const text = effectText || ''
  const semicolonIndex = text.indexOf(';')
  const costClause = semicolonIndex >= 0 ? text.slice(0, semicolonIndex) : ''
  const conditionClause = semicolonIndex >= 0 ? costClause : text.split(/[.]/, 1)[0]
  return /\b(?:discard|tribute|reveal)\b/i.test(costClause)
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
    sources,
    excludedNames: [...text.matchAll(/\bexcept\s+"([^"]+)"/gi)].map(exclusion => exclusion[1]),
  }
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
      || (card.archetype || '').toLowerCase().includes(family)
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
  return ['hand', 'spellTrapZone'].includes(zone)
      && /\bspecial summon this card\b/i.test(effectText || '')
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
