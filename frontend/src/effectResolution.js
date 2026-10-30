export function effectNeedsPrerequisiteCheck(effectText) {
  const costClause = (effectText || '').split(';', 1)[0]
  return /\b(?:discard|tribute|reveal)\b/i.test(costClause)
      || /\bif you control\b/i.test(costClause)
      || /\bif\b[^:;.]*\bon (?:your|the) field\b/i.test(costClause)
      || /\b(?:fusion|synchro|xyz) summon\b/i.test(effectText || '')
}

export function specialSummonsSelfFromZone(effectText, zone) {
  return ['hand', 'spellTrapZone'].includes(zone)
      && /\bspecial summon this card\b/i.test(effectText || '')
}

export function isSpellTrapCard(card) {
  return /(?:spell|trap)/i.test(card?.type || '')
}

export function spellTrapResolutionZone(card, entry, effectText) {
  const text = effectText || ''
  if (/\bbanish this card\b/i.test(text)) return 'banished'
  if (/\b(?:return|add) this card to (?:your|the) hand\b/i.test(text)) return 'hand'
  if (/\bset this card\b/i.test(text)) return 'spellTrapZone'

  const staysFaceUp = /continuous/i.test(card?.race || '')
      || /continuous (?:spell|trap)/i.test(card?.type || '')
      || /continuous (?:spell|trap)/i.test(entry?.treatedAs || '')
  return staysFaceUp ? 'spellTrapZone' : 'graveyard'
}
