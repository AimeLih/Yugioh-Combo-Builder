export function splitCardEffects(text) {
  return (text || '')
      .split(/(?<=[.!?])\s+(?=[A-Z"[(])|\n+/)
      .map(effect => effect.trim())
      .filter(Boolean)
}

export function isPassiveEffectText(text) {
  const normalized = (text || '').trim()
  if (!normalized) return true

  if (/^while\b/i.test(normalized)) {
    return !/:\s*(?:you can|you may|activate|target|discard|tribute|banish|send|destroy|special summon)\b/i
        .test(normalized)
  }

  return /^(?:you|your opponent|neither player|players?) cannot\b/i.test(normalized)
      || /^this card (?:cannot|can only|gains|loses|is unaffected|is treated as|must be|is always)\b/i.test(normalized)
}
