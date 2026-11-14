export const SEARCH_CARD_DRAG_TYPE = 'application/x-yugioh-search-card'

export function searchCardDragPayload(card) {
  return JSON.stringify({
    id: card?.id ?? null,
    name: card?.name || '',
    type: card?.type || '',
    description: card?.description || '',
    level: card?.level ?? null,
    linkvalue: card?.linkvalue ?? null,
    cardImageUrl: card?.cardImageUrl || '',
  })
}

export function parseSearchCardDragPayload(payload) {
  if (!payload) return null
  try {
    const card = JSON.parse(payload)
    return card && card.name && card.type ? card : null
  } catch {
    return null
  }
}

export function hasSearchCardDragType(types) {
  return Array.from(types || []).includes(SEARCH_CARD_DRAG_TYPE)
}

export function searchCardDropEffect(activeDrag, fallbackSearchCardDrop) {
  return activeDrag?.external || fallbackSearchCardDrop ? 'copy' : 'move'
}
