import { CHARACTERS } from './characters'

function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

const aliasesBySlug = {
  'spider-man': ['spider man', 'spiderman'],
  frozen: ['frozen', 'elsa', 'anna', 'olaf'],
  'paw-patrol': ['paw patrol', 'chase', 'marshall', 'skye'],
  'mickey-friends': ['mickey', 'minnie', 'donald duck', 'goofy'],
  'peppa-pig': ['peppa pig'],
  cocomelon: ['cocomelon', 'jj cartoon'],
  marvel: ['marvel', 'iron man', 'hulk', 'captain america', 'avengers'],
  'princess-collection': ['princess collection', 'disney princess', 'cinderella', 'belle', 'ariel', 'rapunzel'],
}

export function classifyCharacterMetadata({ title = '', tags = [] } = {}) {
  const text = normalizeText([title, ...(Array.isArray(tags) ? tags : [])].join(' '))
  const characters = CHARACTERS
    .filter((character) => (aliasesBySlug[character.slug] || [character.name])
      .some((alias) => text.includes(normalizeText(alias))))
    .map((character) => character.slug)

  return {
    characters: Array.from(new Set(characters)),
    confidence: characters.length > 0 ? 0.9 : 0,
    reasoning: characters.length > 0
      ? 'Matched an explicit character name in product title or tags.'
      : 'No explicit character name found; manual review required.',
  }
}