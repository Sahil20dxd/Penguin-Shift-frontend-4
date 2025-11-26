// src/pages/PublicPlaylistSelectDestination.tsx
// --------------------------------------------------------------------
// Destination selection page for public playlist transfers.
// User enters playlist name, selects genre, and chooses public option,
// then starts the transfer.
// --------------------------------------------------------------------

import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  ArrowLeft,
  Globe,
  Check,
  X
} from 'lucide-react'
import { useShift } from '@/components/shift/ShiftContext'
import type { PublicPlaylist } from '@/types/publicPlaylist'
import { startPublicPlaylistTransfer } from '@/api/publicPlaylists'
import { checkPublicPlaylistNameAvailability } from '@/api/publicPlaylists'
import { MUSIC_GENRES } from '@/constants/genres'
import { createPageUrl } from '@/utils'
import { useAuth } from '@/context/useAuth'

type LocationState = {
  playlist?: PublicPlaylist
  tracks?: any[]
}

type Platform = 'spotify' | 'youtube'

export default function PublicPlaylistSelectDestination() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { updateState } = useShift()
  const { user } = useAuth()
  
  const isRestricted = user?.isRestricted === true

  const { playlist, tracks } = (location.state || {}) as LocationState

  // Get source and destination from query params
  const sourcePlatform = (searchParams.get('source') || 'spotify') as Platform
  const destinationPlatform = (searchParams.get('destination') || 'spotify') as Platform

  const [playlistName, setPlaylistName] = useState('My Transferred Playlist')
  const [playlistDesc, setPlaylistDesc] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [makePublic, setMakePublic] = useState(false)
  const [publicPlaylistName, setPublicPlaylistName] = useState('')
  const [checkingNameAvailability, setCheckingNameAvailability] = useState(false)
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Content moderation errors
  const [playlistNameModerationError, setPlaylistNameModerationError] = useState<string | null>(null)
  const [playlistDescModerationError, setPlaylistDescModerationError] = useState<string | null>(null)
  const [publicPlaylistNameModerationError, setPublicPlaylistNameModerationError] = useState<string | null>(null)

  // Check public playlist name availability with debouncing
  useEffect(() => {
    if (!makePublic || !publicPlaylistName.trim()) {
      setNameAvailable(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setCheckingNameAvailability(true)
      try {
        const result = await checkPublicPlaylistNameAvailability(publicPlaylistName.trim())
        setNameAvailable(result.available)
      } catch (error) {
        console.error('Failed to check name availability:', error)
        setNameAvailable(null)
      } finally {
        setCheckingNameAvailability(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [publicPlaylistName, makePublic])

  // If user opens this page directly without state, send them back
  if (!playlist) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6'>
        <div className='max-w-3xl mx-auto'>
          <div className='bg-white rounded-xl shadow-lg p-6'>
            <div className='flex items-center gap-2 mb-4 text-red-600'>
              <span>Missing playlist information.</span>
            </div>
            <Button variant='outline' asChild>
              <Link to='/explore'>Back to Explore</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Handle starting the transfer
  async function handleStartTransfer() {
    if (!playlist) {
      setError('Missing playlist information.')
      return
    }

    // Immediate content moderation validation
    const { validateTextInput } = await import('@/utils/contentModeration')
    
    const playlistNameError = validateTextInput(playlistName.trim())
    if (playlistNameError) {
      setPlaylistNameModerationError(playlistNameError)
      setError('Please fix the playlist name - it contains inappropriate content.')
      return
    }
    
    const playlistDescError = playlistDesc.trim() ? validateTextInput(playlistDesc.trim()) : null
    if (playlistDescError) {
      setPlaylistDescModerationError(playlistDescError)
      setError('Please fix the playlist description - it contains inappropriate content.')
      return
    }
    
    if (makePublic) {
      // Check if user is restricted
      if (isRestricted) {
        setError('Your account has been restricted from creating public playlists due to a violation of our community guidelines. Please contact support if you have questions.')
        return
      }
      
      const publicNameError = validateTextInput(publicPlaylistName.trim())
      if (publicNameError) {
        setPublicPlaylistNameModerationError(publicNameError)
        setError('Please fix the public playlist name - it contains inappropriate content.')
        return
      }
    }
    
    // Check for any moderation errors from debounced validation
    if (playlistNameModerationError || playlistDescModerationError || publicPlaylistNameModerationError) {
      setError('Please fix the content - it contains inappropriate words.')
      return
    }

    if (!playlist.transferId) {
      setError('This playlist cannot be transferred. Transfer information is missing.')
      return
    }

    setCreating(true)
    setError(null)
    try {
      const payload = {
        sourcePlatform,
        destinationPlatform,
        playlistIds: null,
        createNew: true,
        newPlaylistName: playlistName.trim(),
        newPlaylistDescription: playlistDesc.trim() || null,
        genre: selectedGenre,
        makePublic: makePublic,
        publicPlaylistName: makePublic ? publicPlaylistName.trim() : null,
        includeTracks: null,
        tracks: tracks || null,
        transferId: playlist.transferId,
      }

      console.log('[PublicPlaylistSelectDestination] 📤 Calling API: POST /api/transfer/publicPlaylist')
      console.log('[PublicPlaylistSelectDestination] 📦 Payload:', payload)

      const result = await startPublicPlaylistTransfer(payload)

      console.log('[PublicPlaylistSelectDestination] ✅ API Response - Transfer started, ID:', result.id)

      // Save transferId into ShiftContext so TransferResults can read it
      updateState({
        transferId: result.id,
        sourcePlatform
      })

      // Navigate to TransferResults page
      navigate('/shift/results', {
        state: {
          fromPublicExplore: true,
          sourcePlatform,
          destinationPlatform,
          playlistTitle: playlist.title,
        },
      })
    } catch (err: any) {
      console.error('[PublicPlaylistSelectDestination] Transfer start failed:', err)
      setError(
        err.message || "We couldn't start the transfer. Please check your connection and try again."
      )
    } finally {
      setCreating(false)
    }
  }

  const canStart =
    selectedGenre.trim().length > 0 &&
    playlistName.trim().length > 0 &&
    (!makePublic || (publicPlaylistName.trim().length > 0 && nameAvailable === true))

  const destName =
    destinationPlatform === 'youtube' ? 'YouTube Music' : 'Spotify'

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-6 flex items-center justify-between'>
          <h1 className='text-3xl font-bold text-gray-900'>Select Destination</h1>
          <Link to='/shift/public-destination' state={{ playlist, tracks }}>
            <Button variant='outline'>
              <ArrowLeft className='w-4 h-4 mr-2' /> Back
            </Button>
          </Link>
        </div>

        {error && (
          <div
            role='alert'
            className='mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm'
          >
            {error}
          </div>
        )}

        <div className='bg-white rounded-xl shadow-lg p-6 mb-6'>
          <div className='mb-4 text-sm text-gray-600'>
            Transferring playlist: <span className='font-semibold'>{playlist.title}</span>
          </div>

          <div className='space-y-3 mb-6'>
            <div>
              <div className='text-sm mb-1 font-medium'>Playlist Name *</div>
              <Input
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                onValidationError={(error) => setPlaylistNameModerationError(error)}
                placeholder='My Transferred Playlist'
                className={playlistNameModerationError ? 'border-red-500 focus:ring-red-200' : ''}
              />
              {playlistNameModerationError && (
                <p className='text-xs text-red-600 mt-1'>{playlistNameModerationError}</p>
              )}
            </div>
            <div>
              <div className='text-sm mb-1'>Description (optional)</div>
              <Textarea
                className={`w-full border rounded-md px-3 py-2 ${playlistDescModerationError ? 'border-red-500 focus:ring-red-200' : ''}`}
                rows={4}
                value={playlistDesc}
                onChange={(e) => setPlaylistDesc(e.target.value)}
                onValidationError={(error) => setPlaylistDescModerationError(error)}
                placeholder='Describe your playlist…'
              />
              {playlistDescModerationError && (
                <p className='text-xs text-red-600 mt-1'>{playlistDescModerationError}</p>
              )}
            </div>
          </div>

          {/* Genre Selection - Mandatory */}
          <div className='mb-6'>
            <div className='text-sm mb-1 font-medium'>
              Genre <span className='text-red-500'>*</span>
            </div>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className='w-full bg-white border-gray-300 hover:border-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'>
                <SelectValue placeholder='Select a genre' />
              </SelectTrigger>
              <SelectContent className='bg-white border-gray-200 shadow-lg z-50'>
                {MUSIC_GENRES.map((genre) => (
                  <SelectItem key={genre} value={genre} className='hover:bg-gray-100 focus:bg-gray-100'>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedGenre && (
              <p className='text-xs text-gray-500 mt-1'>
                Please select a genre to continue
              </p>
            )}
          </div>

          {/* Make Public Toggle */}
          <div className={`mb-6 p-4 border rounded-lg ${isRestricted ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
            <label className={`flex items-start gap-3 ${isRestricted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input
                type='checkbox'
                checked={makePublic}
                disabled={isRestricted}
                onChange={(e) => {
                  if (isRestricted) return
                  setMakePublic(e.target.checked)
                  if (e.target.checked && !publicPlaylistName) {
                    setPublicPlaylistName(playlistName)
                  }
                }}
                className='mt-1'
              />
              <div className='flex-1'>
                <div className='flex items-center gap-2 font-medium'>
                  <Globe className={`w-4 h-4 ${isRestricted ? 'text-red-600' : 'text-purple-600'}`} />
                  <span>Make this playlist public</span>
                </div>
                {isRestricted ? (
                  <div className='mt-2 p-3 bg-red-100 border border-red-200 rounded-md'>
                    <p className='text-sm text-red-800 font-medium mb-1'>
                      Account Restricted
                    </p>
                    <p className='text-xs text-red-700'>
                      Your account has been restricted from creating public playlists due to a violation of our community guidelines. Please contact support if you have questions.
                    </p>
                  </div>
                ) : (
                  <p className='text-xs text-gray-600 mt-1'>
                    Share your playlist with the PenguinShift community. Other users will be able to discover and view your playlist in the Explore section.
                  </p>
                )}
              </div>
            </label>

            {makePublic && (
              <div className='mt-4 space-y-2'>
                <div className='text-sm font-medium'>
                  Public Playlist Name <span className='text-red-500'>*</span>
                </div>
                <div className='relative'>
                  <Input
                    value={publicPlaylistName}
                    onChange={(e) => setPublicPlaylistName(e.target.value)}
                    onValidationError={(error) => setPublicPlaylistNameModerationError(error)}
                    placeholder='Enter public playlist name'
                    className={
                      publicPlaylistNameModerationError
                        ? 'border-red-500 pr-10 focus:ring-red-200'
                        : publicPlaylistName.trim() && nameAvailable === false
                        ? 'border-red-500 pr-10'
                        : publicPlaylistName.trim() && nameAvailable === true
                        ? 'border-green-500 pr-10'
                        : 'pr-10'
                    }
                  />
                  <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                    {checkingNameAvailability && (
                      <Loader2 className='w-4 h-4 animate-spin text-gray-400' />
                    )}
                    {!checkingNameAvailability && publicPlaylistName.trim() && nameAvailable === true && (
                      <Check className='w-4 h-4 text-green-600' />
                    )}
                    {!checkingNameAvailability && publicPlaylistName.trim() && nameAvailable === false && (
                      <X className='w-4 h-4 text-red-600' />
                    )}
                  </div>
                </div>
                {publicPlaylistNameModerationError && (
                  <p className='text-xs text-red-600'>{publicPlaylistNameModerationError}</p>
                )}
                {publicPlaylistName.trim() && !publicPlaylistNameModerationError && nameAvailable === false && (
                  <p className='text-xs text-red-600'>
                    This playlist name is already taken. Please choose another name.
                  </p>
                )}
                {publicPlaylistName.trim() && !publicPlaylistNameModerationError && nameAvailable === true && (
                  <p className='text-xs text-green-600'>
                    ✓ This playlist name is available
                  </p>
                )}
                {!publicPlaylistName.trim() && (
                  <p className='text-xs text-gray-500'>
                    Enter a unique name for your public playlist
                  </p>
                )}
              </div>
            )}
          </div>

          <div className='flex justify-end'>
            <Button
              disabled={!canStart || creating}
              onClick={() => void handleStartTransfer()}
              className='bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:opacity-50'
            >
              {creating && (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              )}
              Start Transfer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

