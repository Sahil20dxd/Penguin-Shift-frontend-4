// src/constants/genres.ts
// Centralized list of music genres used across the application

export const MUSIC_GENRES = [
  'Pop',
  'Rock',
  'Hip Hop',
  'R&B',
  'Jazz',
  'Classical',
  'Electronic',
  'Country',
  'Indie',
  'Metal',
  'Blues',
  'Reggae',
  'Folk',
  'Latin',
  'K-Pop',
  'Soul',
  'Punk',
  'Dance',
  'Alternative',
  'Other'
] as const;

export type MusicGenre = typeof MUSIC_GENRES[number];

