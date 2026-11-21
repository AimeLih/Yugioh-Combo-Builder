export function normalSummonTributeCount(card) {
  const type = (card?.type || '').toLowerCase()
  const description = card?.description || ''
  if (!type.includes('monster') || /(fusion|synchro|xyz|link|ritual|token)/i.test(type)) return 0
  if (/normal summon(?:ed)?(?:\/set)? this card without tributing/i.test(description)) return 0

  const printedRequirement = description.match(/requires?\s+(\d+)\s+tributes?\s+to\s+normal summon/i)
  if (printedRequirement) return Number(printedRequirement[1])

  const level = Number(card?.level)
  if (!Number.isFinite(level) || level < 5) return 0
  return level <= 6 ? 1 : 2
}

export function tributeSummonCandidates(zones) {
  return ['monsterZone', 'extraMonsterZone']
      .flatMap(zone => (zones?.[zone] || []).map(entry => ({ ...entry, tributeSourceZone: zone })))
}
