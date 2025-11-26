// src/components/explore/FiltersBar.tsx

import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Filter } from 'lucide-react'
import { MUSIC_GENRES } from '@/constants/genres'
import { motion } from 'framer-motion'

// Platform options used in Explore filters
const platforms = [
  { value: 'all', label: 'All Platforms' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'youtube', label: 'YouTube Music' },
  { value: 'amazon', label: 'Amazon Music' },
  { value: 'apple', label: 'Apple Music' }
]


// Sort options for public playlists
const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'tracks', label: 'Most Tracks' },
  { value: 'a-z', label: 'A–Z' }
]

type ExploreFilters = {
  platform: string
  genre: string
  sort: string
  minTracks: string
  maxTracks: string
  createdFrom: string
}

type FiltersBarProps = {
  filters: ExploreFilters
  onFilterChange: (key: keyof ExploreFilters, value: string) => void
}

/**
 * FiltersBar:
 * Controls platform, genre, sort, track range, and created-from date filters.
 */
export default function FiltersBar({ filters, onFilterChange }: FiltersBarProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-300'
    >
      <motion.div 
        className='flex items-center gap-2 mb-4'
        whileHover={{ scale: 1.02 }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
        >
          <Filter className='w-5 h-5 text-purple-600' aria-hidden='true' />
        </motion.div>
        <h3 className='font-semibold text-gray-900'>Filters</h3>
      </motion.div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {/* Platform filter */}
        <div className='relative'>
          <Label
            htmlFor='platform-filter'
            className='text-sm font-medium mb-2 block'
          >
            Platform
          </Label>
          <Select
            value={filters.platform || 'all'}
            onValueChange={value => onFilterChange('platform', value)}
          >
            <SelectTrigger id='platform-filter' aria-label='Filter by platform'>
              <SelectValue placeholder='All Platforms' />
            </SelectTrigger>
            <SelectContent className='z-50 bg-white shadow-lg border border-gray-200'>
              {platforms.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Genre filter */}
        <div className='relative'>
          <Label
            htmlFor='genre-filter'
            className='text-sm font-medium mb-2 block'
          >
            Genre
          </Label>
          <Select
            value={filters.genre || 'all'}
            onValueChange={value => onFilterChange('genre', value)}
          >
            <SelectTrigger id='genre-filter' aria-label='Filter by genre'>
              <SelectValue placeholder='All Genres' />
            </SelectTrigger>
            <SelectContent className='z-50 bg-white shadow-lg border border-gray-200'>
              <SelectItem value='all'>All Genres</SelectItem>
              {MUSIC_GENRES.map(genre => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort by */}
        <div className='relative'>
          <Label
            htmlFor='sort-filter'
            className='text-sm font-medium mb-2 block'
          >
            Sort By
          </Label>
          <Select
            value={filters.sort || 'recent'}
            onValueChange={value => onFilterChange('sort', value)}
          >
            <SelectTrigger id='sort-filter' aria-label='Sort playlists'>
              <SelectValue placeholder='Most Recent' />
            </SelectTrigger>
            <SelectContent className='z-50 bg-white shadow-lg border border-gray-200'>
              {sortOptions.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Minimum track count */}
        <div className='relative'>
          <Label
            htmlFor='min-tracks'
            className='text-sm font-medium mb-2 block'
          >
            Min Tracks
          </Label>
          <Input
            id='min-tracks'
            type='number'
            min='0'
            value={filters.minTracks || ''}
            onChange={e => onFilterChange('minTracks', e.target.value)}
            placeholder='0'
            aria-label='Minimum track count'
          />
        </div>

        {/* Maximum track count */}
        <div className='relative'>
          <Label
            htmlFor='max-tracks'
            className='text-sm font-medium mb-2 block'
          >
            Max Tracks
          </Label>
          <Input
            id='max-tracks'
            type='number'
            min='0'
            value={filters.maxTracks || ''}
            onChange={e => onFilterChange('maxTracks', e.target.value)}
            placeholder='∞'
            aria-label='Maximum track count'
          />
        </div>

        {/* Created-from date */}
        <div className='relative'>
          <Label
            htmlFor='date-from'
            className='text-sm font-medium mb-2 block'
          >
            Created From
          </Label>
          <Input
            id='date-from'
            type='date'
            value={filters.createdFrom || ''}
            onChange={e => onFilterChange('createdFrom', e.target.value)}
            aria-label='Created date from'
          />
        </div>
      </div>
    </motion.div>
  )
}
