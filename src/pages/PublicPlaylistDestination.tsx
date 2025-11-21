// src/pages/PublicPlaylistDestination.tsx
// --------------------------------------------------------------------
// Combined authorization and destination selection page for public playlist transfers.
// - Shows authorization buttons when no source query param
// - Shows form (playlist name, genre, public option) when source param exists
// - Handles transfer start and displays results inline
// --------------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertCircle,
  Music2,
  ArrowLeft,
  Loader2,
  ExternalLink,
  CheckCircle2,
  PlugZap,
  Globe,
  Check,
  X,
  Download,
} from 'lucide-react'
import type { PublicPlaylist } from '@/types/publicPlaylist'
import { checkLinkStatus, getLinkUrl, getTransferStatus, downloadUnmatchedCsv, downloadUnmatchedPdf } from '@/components/shift/apiClient'
import { startPublicPlaylistTransfer } from '@/api/publicPlaylists'
import { checkPublicPlaylistNameAvailability } from '@/api/publicPlaylists'
import { MUSIC_GENRES } from '@/constants/genres'
import { useShift } from '@/components/shift/ShiftContext'

type LocationState = {
  playlist?: PublicPlaylist
  tracks?: any[]
}

type Platform = 'spotify' | 'youtube'

/**
 * Combined authorization and destination selection page for public playlist transfers.
 * - Step 1: User selects destination platform (Spotify or YouTube) and authorizes
 * - Step 2: After authorization, shows form to enter playlist name, genre, and public option
 * - Step 3: Starts transfer and shows results inline
 */
export default function PublicPlaylistDestination() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { updateState } = useShift()
  
  // Get playlist from location.state or fallback to sessionStorage
  const locationState = (location.state || {}) as LocationState
  const [playlist, setPlaylist] = useState<PublicPlaylist | undefined>(
    locationState.playlist || (() => {
      try {
        const saved = sessionStorage.getItem('publicPlaylistTransfer')
        return saved ? JSON.parse(saved).playlist : undefined
      } catch {
        return undefined
      }
    })
  )
  const [tracks, setTracks] = useState<any[] | undefined>(
    locationState.tracks || (() => {
      try {
        const saved = sessionStorage.getItem('publicPlaylistTransfer')
        return saved ? JSON.parse(saved).tracks : undefined
      } catch {
        return undefined
      }
    })
  )

  // Update state when location.state changes (e.g., when navigating from explore)
  useEffect(() => {
    const state = (location.state || {}) as LocationState
    if (state.playlist) {
      setPlaylist(state.playlist)
    }
    if (state.tracks) {
      setTracks(state.tracks)
    }
  }, [location.state])

  // Save to sessionStorage when we have playlist data
  useEffect(() => {
    if (playlist && tracks) {
      sessionStorage.setItem('publicPlaylistTransfer', JSON.stringify({ playlist, tracks }))
    }
  }, [playlist, tracks])

  // Get destination platform from query params (source is the original platform, destination is where we're transferring TO)
  const destinationPlatform = (searchParams.get('source') || null) as Platform | null
  const sourcePlatform: Platform = playlist?.platform === 'spotify' ? 'spotify' : 'youtube'

  // Authorization states
  const [isSpotifyLinked, setIsSpotifyLinked] = useState(false)
  const [isYouTubeLinked, setIsYouTubeLinked] = useState(false)
  const [checkingSpotify, setCheckingSpotify] = useState(true)
  const [checkingYouTube, setCheckingYouTube] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states (shown when destinationPlatform is set)
  const [playlistName, setPlaylistName] = useState('My Transferred Playlist')
  const [playlistDesc, setPlaylistDesc] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [makePublic, setMakePublic] = useState(false)
  const [publicPlaylistName, setPublicPlaylistName] = useState('')
  const [checkingNameAvailability, setCheckingNameAvailability] = useState(false)
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null)
  const [creating, setCreating] = useState(false)

  // Transfer states
  const [transferId, setTransferId] = useState<number | null>(null)
  const [transferPhase, setTransferPhase] = useState('Idle')
  const [transferPct, setTransferPct] = useState(0)
  const [unmatchedCount, setUnmatchedCount] = useState(0)
  const [transferStatus, setTransferStatus] = useState<string>('')

  // Ref for OAuth polling cleanup
  const pollRef = useRef<number | null>(null)
  const transferPollRef = useRef<number | null>(null)

  // Check account linking status on mount
  useEffect(() => {
    async function checkBothPlatforms() {
      setCheckingSpotify(true)
      setCheckingYouTube(true)
      setError('')
      setIsSpotifyLinked(false)
      setIsYouTubeLinked(false)

      try {
        const spotifyResp = await checkLinkStatus('spotify') as { linked: boolean }
        setIsSpotifyLinked(Boolean(spotifyResp?.linked))
      } catch (err: any) {
        console.error('[PublicPlaylistDestination] Failed to check Spotify link:', err)
        setIsSpotifyLinked(false)
      } finally {
        setCheckingSpotify(false)
      }

      try {
        const youtubeResp = await checkLinkStatus('youtube') as { linked: boolean }
        setIsYouTubeLinked(Boolean(youtubeResp?.linked))
      } catch (err: any) {
        console.error('[PublicPlaylistDestination] Failed to check YouTube link:', err)
        setIsYouTubeLinked(false)
      } finally {
        setCheckingYouTube(false)
      }
    }

    checkBothPlatforms()

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current)
        pollRef.current = null
      }
      if (transferPollRef.current) {
        window.clearInterval(transferPollRef.current)
        transferPollRef.current = null
      }
    }
  }, [])

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

  // Poll transfer status when transferId is set
  useEffect(() => {
    if (!transferId) return

    if (transferPollRef.current) {
      window.clearInterval(transferPollRef.current)
    }

    transferPollRef.current = window.setInterval(async () => {
      try {
        const st = (await getTransferStatus(transferId)) as {
          status: string
          percent: number
          phase: string
          unmatched: number
        }
        setTransferPhase(st.phase)
        setTransferPct(st.percent)
        setUnmatchedCount(st.unmatched || 0)
        setTransferStatus(st.status)

        if (st.status === 'COMPLETED' || st.status === 'FAILED') {
          if (transferPollRef.current) {
            window.clearInterval(transferPollRef.current)
            transferPollRef.current = null
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 1200) as unknown as number

    return () => {
      if (transferPollRef.current) {
        window.clearInterval(transferPollRef.current)
        transferPollRef.current = null
      }
    }
  }, [transferId])

  // If user opens this page directly without state, send them back
  if (!playlist) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6'>
        <div className='max-w-3xl mx-auto'>
          <div className='bg-white rounded-xl shadow-lg p-6'>
            <div className='flex items-center gap-2 mb-4 text-red-600'>
              <AlertCircle className='w-5 h-5' />
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

  // Handle "Add to Spotify" or "Add to YouTube Music" button click
  const handleAddToPlatform = async (destination: Platform) => {
    console.log('[PublicPlaylistDestination] 🔵 handleAddToPlatform called for:', destination)

    const isLinked = destination === 'spotify' ? isSpotifyLinked : isYouTubeLinked
    console.log(`[PublicPlaylistDestination] Is ${destination} linked?`, isLinked)

    if (!isLinked) {
      console.log('[PublicPlaylistDestination] ❌ Destination not linked, triggering OAuth for:', destination)
      setError(`Please connect your ${destination === 'spotify' ? 'Spotify' : 'YouTube Music'} account first.`)
      await handleLinkAccount(destination)
      return
    }

    // If linked, redirect to same page with source query param
    console.log('[PublicPlaylistDestination] ✅ Destination is linked, redirecting with query param')
    navigate(`/shift/public-destination?source=${destination}`, {
      state: { playlist, tracks },
      replace: true
    })
  }

  // Handle account linking via OAuth
  const handleLinkAccount = async (platform: Platform) => {
    setError('')

    try {
      console.log('[PublicPlaylistDestination] Starting OAuth flow for:', platform)

      const resp = await getLinkUrl(platform) as { url: string }
      const url = resp?.url

      if (!url) {
        setError('Failed to create authorization URL.')
        return
      }

      console.log('[PublicPlaylistDestination] Opening OAuth popup for:', platform)

      const popup = window.open(
        url,
        'oauth',
        'width=600,height=700,scrollbars=yes'
      )

      if (!popup) {
        setError('Popup blocked. Please allow popups for this site.')
        return
      }

      if (pollRef.current) {
        window.clearInterval(pollRef.current)
        pollRef.current = null
      }

      pollRef.current = window.setInterval(async () => {
        if (popup.closed) {
          if (pollRef.current) window.clearInterval(pollRef.current)
          pollRef.current = null

          console.log('[PublicPlaylistDestination] Popup closed, rechecking status for:', platform)
          try {
            const status = await checkLinkStatus(platform) as { linked: boolean }
            if (platform === 'spotify') {
              setIsSpotifyLinked(Boolean(status?.linked))
            } else {
              setIsYouTubeLinked(Boolean(status?.linked))
            }
            
            if (status?.linked) {
              navigate(`/shift/public-destination?source=${platform}`, {
                state: { playlist, tracks },
                replace: true
              })
            }
          } catch (err) {
            console.error('[PublicPlaylistDestination] Failed to recheck link status:', err)
          }
          return
        }

        try {
          const status = await checkLinkStatus(platform) as { linked: boolean }

          if (status?.linked) {
            console.log('[PublicPlaylistDestination] ✅ OAuth successful for:', platform)

            if (pollRef.current) window.clearInterval(pollRef.current)
            pollRef.current = null

            try {
              popup.close()
            } catch {}

            if (platform === 'spotify') {
              setIsSpotifyLinked(true)
            } else {
              setIsYouTubeLinked(true)
            }

            navigate(`/shift/public-destination?source=${platform}`, {
              state: { playlist, tracks },
              replace: true
            })
          }
        } catch {
          // Ignore transient polling errors
        }
      }, 1200) as unknown as number

      window.setTimeout(() => {
        if (pollRef.current) {
          window.clearInterval(pollRef.current)
          pollRef.current = null
        }
        if (!popup.closed) {
          try {
            popup.close()
          } catch {}
          setError('OAuth connection timed out. Please try again.')
        }
      }, 120000)

    } catch (err: any) {
      console.error('[PublicPlaylistDestination] OAuth connection failed:', err)
      setError(
        `Unable to connect to ${platform === 'spotify' ? 'Spotify' : 'YouTube Music'}. Please try again.`
      )
    }
  }

  // Force reconnect account
  const handleReconnect = async (platform: Platform) => {
    try {
      setError('')

      if (platform === 'spotify') {
        setIsSpotifyLinked(false)
      } else {
        setIsYouTubeLinked(false)
      }

      await handleLinkAccount(platform)
    } catch (err: any) {
      console.error('Reconnect failed:', err)
      setError(`Failed to reconnect ${platform === 'spotify' ? 'Spotify' : 'YouTube Music'}. Please try again.`)
    }
  }

  // Handle starting the transfer
  async function handleStartTransfer() {
    if (!playlist) {
      setError('Missing playlist information.')
      return
    }

    if (!destinationPlatform) {
      setError('Please select a destination platform first.')
      return
    }

    setCreating(true)
    setError(null)
    try {
      if (!playlist.transferId) {
        setError('This playlist cannot be transferred. Transfer information is missing.')
        return
      }

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

      console.log('[PublicPlaylistDestination] 📤 Calling API: POST /api/transfer/publicPlaylist')
      console.log('[PublicPlaylistDestination] 📦 Payload:', payload)

      const result = await startPublicPlaylistTransfer(payload)

      console.log('[PublicPlaylistDestination] ✅ API Response - Transfer started, ID:', result.id)

      setTransferId(result.id)
      updateState({
        transferId: result.id,
        sourcePlatform
      })
    } catch (err: any) {
      console.error('[PublicPlaylistDestination] Transfer start failed:', err)
      setError(
        err.message || "We couldn't start the transfer. Please check your connection and try again."
      )
    } finally {
      setCreating(false)
    }
  }

  const canStart =
    destinationPlatform !== null &&
    (destinationPlatform === 'spotify' ? isSpotifyLinked : isYouTubeLinked) &&
    selectedGenre.trim().length > 0 &&
    playlistName.trim().length > 0 &&
    (!makePublic || (publicPlaylistName.trim().length > 0 && nameAvailable === true))

  const destName =
    destinationPlatform === 'youtube' ? 'YouTube Music' : 'Spotify'

  // Show form if destination platform is selected
  if (destinationPlatform) {
    const isDestLinked = destinationPlatform === 'spotify' ? isSpotifyLinked : isYouTubeLinked

    return (
      <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-6 flex items-center justify-between'>
            <h1 className='text-3xl font-bold text-gray-900'>Select Destination</h1>
            <Button variant='outline' onClick={() => navigate('/shift/public-destination', { state: { playlist, tracks }, replace: true })}>
              <ArrowLeft className='w-4 h-4 mr-2' /> Back
            </Button>
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

            {!isDestLinked ? (
              <div className='text-center py-8 border-2 border-dashed border-gray-300 rounded-lg'>
                <ExternalLink className='w-12 h-12 mx-auto mb-4 text-gray-400' />
                <p className='text-gray-600 mb-4'>
                  Connect your {destName} account to continue
                </p>
                <Button
                  onClick={() => void handleLinkAccount(destinationPlatform)}
                  className='bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600'
                >
                  Connect {destName}
                </Button>
              </div>
            ) : (
              <>
                <div className='flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg border border-green-200'>
                  <CheckCircle2 className='w-5 h-5 text-green-600' />
                  <span className='text-green-700 font-medium'>
                    Connected to {destName}
                  </span>
                </div>

                <div className='space-y-3 mb-6'>
                  <div>
                    <div className='text-sm mb-1 font-medium'>Playlist Name *</div>
                    <Input
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      placeholder='My Transferred Playlist'
                    />
                  </div>
                  <div>
                    <div className='text-sm mb-1'>Description (optional)</div>
                    <Textarea
                      className='w-full border rounded-md px-3 py-2'
                      rows={4}
                      value={playlistDesc}
                      onChange={(e) => setPlaylistDesc(e.target.value)}
                      placeholder='Describe your playlist…'
                    />
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
                <div className='mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50'>
                  <label className='flex items-start gap-3 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={makePublic}
                      onChange={(e) => {
                        setMakePublic(e.target.checked)
                        if (e.target.checked && !publicPlaylistName) {
                          setPublicPlaylistName(playlistName)
                        }
                      }}
                      className='mt-1'
                    />
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 font-medium'>
                        <Globe className='w-4 h-4 text-purple-600' />
                        <span>Make this playlist public</span>
                      </div>
                      <p className='text-xs text-gray-600 mt-1'>
                        Share your playlist with the PenguinShift community. Other users will be able to discover and view your playlist in the Explore section.
                      </p>
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
                          placeholder='Enter public playlist name'
                          className={
                            publicPlaylistName.trim() && nameAvailable === false
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
                      {publicPlaylistName.trim() && nameAvailable === false && (
                        <p className='text-xs text-red-600'>
                          This playlist name is already taken. Please choose another name.
                        </p>
                      )}
                      {publicPlaylistName.trim() && nameAvailable === true && (
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

                {/* Transfer Results */}
                {transferId && (
                  <div className='mt-8 border-t pt-6'>
                    <div className='text-sm text-gray-600 mb-2'>
                      Transfer #{transferId} • Phase:{' '}
                      <span className='font-medium'>{transferPhase}</span> •{' '}
                      {transferPct}%
                    </div>

                    {transferStatus === 'COMPLETED' && (
                      <div className='mt-4 p-4 bg-green-50 border border-green-200 rounded-lg'>
                        <p className='text-green-700 font-medium mb-2'>
                          ✅ Transfer completed successfully!
                        </p>
                        <div className='text-sm text-gray-600 mb-4'>
                          Unmatched songs: <span className='font-semibold'>{unmatchedCount}</span>
                        </div>
                        <div className='flex gap-3'>
                          <Button
                            variant='outline'
                            onClick={() => {
                              if (transferId) downloadUnmatchedCsv(transferId).catch(console.error)
                            }}
                            disabled={!transferId}
                          >
                            <Download className='w-4 h-4 mr-2' /> CSV
                          </Button>
                          <Button
                            variant='outline'
                            onClick={() => {
                              if (transferId) downloadUnmatchedPdf(transferId).catch(console.error)
                            }}
                            disabled={!transferId}
                          >
                            <Download className='w-4 h-4 mr-2' /> PDF
                          </Button>
                        </div>
                      </div>
                    )}

                    {transferStatus === 'FAILED' && (
                      <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
                        <p className='text-red-700 font-medium mb-2'>
                          ❌ Transfer failed. Please try again.
                        </p>
                        <Button
                          variant='outline'
                          onClick={() => {
                            setTransferId(null)
                            setTransferPhase('Idle')
                            setTransferPct(0)
                            setUnmatchedCount(0)
                            setTransferStatus('')
                          }}
                        >
                          Try Again
                        </Button>
                      </div>
                    )}

                    {(transferStatus === 'IN_PROGRESS' || transferStatus === 'RUNNING' || transferStatus === 'PENDING') && (
                      <div className='mt-4'>
                        <div className='w-full bg-gray-200 rounded-full h-3 mb-2'>
                          <div
                            className='bg-gradient-to-r from-purple-600 to-blue-500 h-3 rounded-full transition-all duration-300'
                            style={{ width: `${transferPct}%` }}
                          />
                        </div>
                        <p className='text-center text-gray-600 text-sm'>
                          {transferPct}% complete
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show authorization page (no destination selected yet)
  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6'>
      <div className='max-w-5xl mx-auto space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm text-gray-600'>
              Public playlist transfer
            </p>
            <h1 className='text-3xl font-bold text-gray-900'>
              Choose where to add this playlist
            </h1>
          </div>
          <Button variant='outline' asChild>
            <Link to='/explore'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Explore
            </Link>
          </Button>
        </div>

        {/* Playlist summary */}
        <Card className='bg-white shadow-lg'>
          <CardHeader className='border-b'>
            <div className='flex items-start justify-between gap-4'>
              <div className='space-y-2'>
                <CardTitle className='flex items-center gap-2 text-2xl'>
                  <Music2 className='w-6 h-6 text-purple-600' />
                  <span className='truncate max-w-[20rem]'>{playlist.title}</span>
                </CardTitle>
                <p className='text-sm text-gray-600'>
                  Shared by <span className='font-medium'>{playlist.ownerName || 'PenguinShift user'}</span>
                </p>
              </div>
              <div className='flex flex-wrap gap-2 justify-end'>
                <Badge variant='outline' className='text-sm'>
                  {playlist.trackCount ?? 0} tracks
                </Badge>
                {playlist.genre && (
                  <Badge variant='secondary' className='capitalize text-sm'>
                    {playlist.genre}
                  </Badge>
                )}
                <Badge variant='outline' className='uppercase text-sm'>
                  From {sourcePlatform === 'spotify' ? 'Spotify' : 'YouTube Music'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className='pt-6'>
            <p className='text-gray-600'>
              PenguinShift will copy the tracks from this shared playlist into
              your own library on the destination platform you pick below.
            </p>
          </CardContent>
        </Card>

        {/* Error banner (if any) */}
        {error && (
          <div className='flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700'>
            <AlertCircle className='w-5 h-5 mt-0.5 flex-shrink-0' />
            <p>{error}</p>
          </div>
        )}

        {/* Destination choices */}
        <div className='grid gap-6 md:grid-cols-2'>
          {/* Spotify Card */}
          <Card className='bg-white shadow-lg'>
            <CardHeader className='border-b'>
              <CardTitle className='text-xl flex items-center gap-2'>
                <span className='text-2xl'>🎵</span>
                Shift to Spotify
              </CardTitle>
              <p className='text-sm text-gray-600'>
                Create a new playlist in your Spotify library with these tracks.
              </p>
            </CardHeader>
            <CardContent className='space-y-4 pt-6'>
              {checkingSpotify ? (
                <div className='text-center py-4'>
                  <Loader2 className='w-6 h-6 animate-spin mx-auto mb-2 text-green-600' />
                  <p className='text-sm text-gray-600'>Checking Spotify connection...</p>
                </div>
              ) : !isSpotifyLinked ? (
                <div className='text-center py-4 border-2 border-dashed border-gray-300 rounded-lg'>
                  <ExternalLink className='w-10 h-10 mx-auto mb-3 text-gray-400' />
                  <p className='text-sm text-gray-600 mb-4'>
                    Connect your Spotify account to transfer
                  </p>
                  <Button
                    onClick={() => {
                      console.log('[PublicPlaylistDestination] 🔵 Connect Spotify button clicked')
                      handleLinkAccount('spotify')
                    }}
                    className='bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
                  >
                    <ExternalLink className='w-4 h-4 mr-2' />
                    Connect Spotify
                  </Button>
                </div>
              ) : (
                <>
                  <div className='flex items-center justify-between gap-2 p-3 bg-green-50 rounded-lg border border-green-200'>
                    <div className='flex items-center gap-2'>
                      <CheckCircle2 className='w-5 h-5 text-green-600' />
                      <span className='text-sm text-green-700 font-medium'>
                        Spotify Connected
                      </span>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleReconnect('spotify')}
                      title='Reconnect Spotify'
                      className='h-8'
                    >
                      <PlugZap className='w-4 h-4' />
                    </Button>
                  </div>
                  <Button
                    className='w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
                    onClick={() => {
                      console.log('[PublicPlaylistDestination] 🔵 Add to Spotify button clicked')
                      handleAddToPlatform('spotify')
                    }}
                  >
                    Add to Spotify
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* YouTube Music Card */}
          <Card className='bg-white shadow-lg'>
            <CardHeader className='border-b'>
              <CardTitle className='text-xl flex items-center gap-2'>
                <span className='text-2xl'>▶️</span>
                Shift to YouTube Music
              </CardTitle>
              <p className='text-sm text-gray-600'>
                Create a new playlist in your YouTube Music library with these tracks.
              </p>
            </CardHeader>
            <CardContent className='space-y-4 pt-6'>
              {checkingYouTube ? (
                <div className='text-center py-4'>
                  <Loader2 className='w-6 h-6 animate-spin mx-auto mb-2 text-red-600' />
                  <p className='text-sm text-gray-600'>Checking YouTube connection...</p>
                </div>
              ) : !isYouTubeLinked ? (
                <div className='text-center py-4 border-2 border-dashed border-gray-300 rounded-lg'>
                  <ExternalLink className='w-10 h-10 mx-auto mb-3 text-gray-400' />
                  <p className='text-sm text-gray-600 mb-4'>
                    Connect your YouTube Music account to transfer
                  </p>
                  <Button
                    onClick={() => {
                      console.log('[PublicPlaylistDestination] 🔵 Connect YouTube button clicked')
                      handleLinkAccount('youtube')
                    }}
                    className='bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600'
                  >
                    <ExternalLink className='w-4 h-4 mr-2' />
                    Connect YouTube Music
                  </Button>
                </div>
              ) : (
                <>
                  <div className='flex items-center justify-between gap-2 p-3 bg-green-50 rounded-lg border border-green-200'>
                    <div className='flex items-center gap-2'>
                      <CheckCircle2 className='w-5 h-5 text-green-600' />
                      <span className='text-sm text-green-700 font-medium'>
                        YouTube Music Connected
                      </span>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleReconnect('youtube')}
                      title='Reconnect YouTube Music'
                      className='h-8'
                    >
                      <PlugZap className='w-4 h-4' />
                    </Button>
                  </div>
                  <Button
                    className='w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600'
                    onClick={() => {
                      console.log('[PublicPlaylistDestination] 🔵 Add to YouTube Music button clicked')
                      handleAddToPlatform('youtube')
                    }}
                  >
                    Add to YouTube Music
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info box */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <p className='text-sm text-blue-900'>
            <strong>Note:</strong> The transfer process will match tracks from the original platform
            to your chosen destination. Some tracks may not be available and will be listed as unmatched.
          </p>
        </div>
      </div>
    </div>
  )
}
