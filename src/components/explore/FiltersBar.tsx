// src/components/explore/FiltersBar.tsx

import React, { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { MUSIC_GENRES } from '@/constants/genres'
import { motion, AnimatePresence } from 'framer-motion'

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
 * Collapsible on mobile for better UX.
 */
export default function FiltersBar({ filters, onFilterChange }: FiltersBarProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 md:p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-300'
    >
      {/* Header with toggle button for mobile */}
      <motion.div 
        className='flex items-center justify-between mb-4'
        whileHover={{ scale: 1.02 }}
      >
        <div className='flex items-center gap-2'>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
          >
            <Filter className='w-5 h-5 text-purple-600 dark:text-purple-400' aria-hidden='true' />
          </motion.div>
          <h3 className='text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100'>Filters</h3>
        </div>
        
        {/* Mobile toggle button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className='md:hidden text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
          aria-label={isOpen ? 'Hide filters' : 'Show filters'}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <ChevronUp className='w-5 h-5' />
          ) : (
            <ChevronDown className='w-5 h-5' />
          )}
        </Button>
      </motion.div>

      {/* Filter content - hidden on mobile unless open, always visible on desktop */}
      <div className='hidden md:block'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4'>
          {/* Platform filter */}
          <div className='relative'>
            <Label
              htmlFor='platform-filter'
              className='text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300'
            >
              Platform
            </Label>
            <Select
              value={filters.platform || 'all'}
              onValueChange={value => onFilterChange('platform', value)}
            >
              <SelectTrigger id='platform-filter' aria-label='Filter by platform' className='h-11 md:h-10 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100'>
                <SelectValue placeholder='All Platforms' />
              </SelectTrigger>
              <SelectContent className='z-50 bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700'>
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
              className='text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300'
            >
              Genre
            </Label>
            <Select
              value={filters.genre || 'all'}
              onValueChange={value => onFilterChange('genre', value)}
            >
              <SelectTrigger id='genre-filter' aria-label='Filter by genre' className='bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100'>
                <SelectValue placeholder='All Genres' />
              </SelectTrigger>
              <SelectContent className='z-50 bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700'>
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
              className='text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300'
            >
              Sort By
            </Label>
            <Select
              value={filters.sort || 'recent'}
              onValueChange={value => onFilterChange('sort', value)}
            >
              <SelectTrigger id='sort-filter' aria-label='Sort playlists' className='bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100'>
                <SelectValue placeholder='Most Recent' />
              </SelectTrigger>
              <SelectContent className='z-50 bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700'>
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
              className='text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300'
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
              className='h-11 md:h-10 text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-slate-600'
            />
          </div>

          {/* Maximum track count */}
          <div className='relative'>
            <Label
              htmlFor='max-tracks'
              className='text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300'
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
              className='h-11 md:h-10 text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-slate-600'
            />
          </div>

          {/* Created-from date */}
          <div className='relative'>
            <Label
              htmlFor='date-from'
              className='text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300'
            >
              Created From
            </Label>
            <DatePicker
              id='date-from'
              value={filters.createdFrom || ''}
              onChange={(value) => onFilterChange('createdFrom', value)}
              placeholder='Select date'
              ariaLabel='Created date from'
            />
          </div>
        </div>
      </div>

      {/* Mobile collapsible filters */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className='md:hidden overflow-hidden'
          >
            <div className='grid grid-cols-1 gap-3'>
              {/* Platform filter */}
              <div className='relative'>
                <Label
                  htmlFor='platform-filter-mobile'
                  className='text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300'
                >
                  Platform
                </Label>
                <Select
                  value={filters.platform || 'all'}
                  onValueChange={value => onFilterChange('platform', value)}
                >
                  <SelectTrigger id='platform-filter-mobile' aria-label='Filter by platform' className='h-11 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100'>
                    <SelectValue placeholder='All Platforms' />
                  </SelectTrigger>
                  <SelectContent className='z-50 bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700'>
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
                  htmlFor='genre-filter-mobile'
                  className='text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300'
                >
                  Genre
                </Label>
                <Select
                  value={filters.genre || 'all'}
                  onValueChange={value => onFilterChange('genre', value)}
                >
                  <SelectTrigger id='genre-filter-mobile' aria-label='Filter by genre' className='h-11 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100'>
                    <SelectValue placeholder='All Genres' />
                  </SelectTrigger>
                  <SelectContent className='z-50 bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700'>
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
                  htmlFor='sort-filter-mobile'
                  className='text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300'
                >
                  Sort By
                </Label>
                <Select
                  value={filters.sort || 'recent'}
                  onValueChange={value => onFilterChange('sort', value)}
                >
                  <SelectTrigger id='sort-filter-mobile' aria-label='Sort playlists' className='h-11 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100'>
                    <SelectValue placeholder='Most Recent' />
                  </SelectTrigger>
                  <SelectContent className='z-50 bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700'>
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
                  htmlFor='min-tracks-mobile'
                  className='text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300'
                >
                  Min Tracks
                </Label>
                <Input
                  id='min-tracks-mobile'
                  type='number'
                  min='0'
                  value={filters.minTracks || ''}
                  onChange={e => onFilterChange('minTracks', e.target.value)}
                  placeholder='0'
                  aria-label='Minimum track count'
                  className='h-11 text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-slate-600'
                />
              </div>

              {/* Maximum track count */}
              <div className='relative'>
                <Label
                  htmlFor='max-tracks-mobile'
                  className='text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300'
                >
                  Max Tracks
                </Label>
                <Input
                  id='max-tracks-mobile'
                  type='number'
                  min='0'
                  value={filters.maxTracks || ''}
                  onChange={e => onFilterChange('maxTracks', e.target.value)}
                  placeholder='∞'
                  aria-label='Maximum track count'
                  className='h-11 text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-slate-600'
                />
              </div>

              {/* Created-from date */}
              <div className='relative'>
                <Label
                  htmlFor='date-from-mobile'
                  className='text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300'
                >
                  Created From
                </Label>
                <DatePicker
                  id='date-from-mobile'
                  value={filters.createdFrom || ''}
                  onChange={(value) => onFilterChange('createdFrom', value)}
                  placeholder='Select date'
                  ariaLabel='Created date from'
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
