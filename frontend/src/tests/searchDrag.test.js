import test from 'node:test'
import assert from 'node:assert/strict'

import {
  SEARCH_CARD_DRAG_TYPE,
  hasSearchCardDragType,
  parseSearchCardDragPayload,
  searchCardDropEffect,
  searchCardDragPayload,
} from '../searchDrag.js'

test('round trips a search result through the native drag payload', () => {
  const card = {
    id: 42,
    name: 'Kashtira Fenrir',
    type: 'Effect Monster',
    level: 7,
    cardImageUrl: 'https://example.test/fenrir.jpg',
  }
  assert.deepEqual(parseSearchCardDragPayload(searchCardDragPayload(card)), {
    id: 42,
    name: 'Kashtira Fenrir',
    type: 'Effect Monster',
    description: '',
    level: 7,
    linkvalue: null,
    cardImageUrl: 'https://example.test/fenrir.jpg',
  })
})

test('recognizes only the dedicated search-card drag type', () => {
  assert.equal(hasSearchCardDragType(['text/plain', SEARCH_CARD_DRAG_TYPE]), true)
  assert.equal(hasSearchCardDragType(['text/plain']), false)
  assert.equal(parseSearchCardDragPayload('not json'), null)
})

test('uses copy for search cards and move for cards already on the field', () => {
  assert.equal(searchCardDropEffect({ external: true }, false), 'copy')
  assert.equal(searchCardDropEffect(null, true), 'copy')
  assert.equal(searchCardDropEffect({ external: false }, false), 'move')
})
