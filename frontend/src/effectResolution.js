export function effectNeedsPrerequisiteCheck(effectText) {
  const costClause = (effectText || '').split(';', 1)[0]
  return /\b(?:discard|tribute|reveal)\b/i.test(costClause)
      || /\bif you control\b/i.test(costClause)
      || /\b(?:fusion|synchro|xyz) summon\b/i.test(effectText || '')
}

export function specialSummonsSelfFromZone(effectText, zone) {
  return ['hand', 'spellTrapZone'].includes(zone)
      && /\bspecial summon this card\b/i.test(effectText || '')
}
