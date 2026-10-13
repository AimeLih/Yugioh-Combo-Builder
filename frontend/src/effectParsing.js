export function splitCardEffects(text) {
  return (text || '')
      .split(/(?<=[.!?])\s+(?=[A-Z"[(])|\n+/)
      .map(effect => effect.trim())
      .filter(Boolean)
}
