export function selfLevelChange(effectText) {
  const text = (effectText || '').replace(/[’]/g, "'")

  const becomes = text.match(/\b(?:this card's|its) Level becomes (\d+)\b/i)
  if (becomes) return { kind: 'set', value: Number(becomes[1]) }

  const change = text.match(/\b(?:increase|decrease) (?:this card's|its) Level by (\d+)\b/i)
  if (change) {
    return {
      kind: change[0].toLowerCase().startsWith('decrease') ? 'decrease' : 'increase',
      value: Number(change[1]),
    }
  }

  return null
}

export function applySelfLevelChange(card, effectText) {
  const change = selfLevelChange(effectText)
  const currentLevel = Number(card?.level)
  if (!change || !Number.isFinite(currentLevel)) return card

  const level = change.kind === 'set'
    ? change.value
    : change.kind === 'increase'
      ? currentLevel + change.value
      : Math.max(1, currentLevel - change.value)
  return level === currentLevel ? card : { ...card, level }
}

export function hasOpenDeckCardCost(effectText) {
  const costClause = (effectText || '').split(';', 1)[0]
  return /\b(?:banish|send|destroy|shuffle)\s+(?:\d+|one|a)\s+[^;]*\bfrom (?:your|the) Deck\b/i
      .test(costClause)
}

export function costUsesOnlyHand(costText) {
  const text = (costText || '').toLowerCase()
  if (text.includes('deck') || text.includes('field') || text.includes('graveyard') || text.includes('gy')) {
    return false
  }
  return text.includes('discard') || text.includes('from your hand') || text.includes('from the hand')
}
