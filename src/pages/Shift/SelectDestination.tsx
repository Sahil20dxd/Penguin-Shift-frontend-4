// src/pages/Shift/SelectDestination.tsx
// --------------------------------------------------------------------
// Destination page: dynamically supports both directions
// (Spotify → YouTube OR YouTube → Spotify)
// Automatically determines the destination platform and handles linking,
// transfer, and unmatched downloads.
// --------------------------------------------------------------------
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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
  checkLinkStatus,
  getLinkUrl,
  listPlaylists,
  startTransfer,
  getTransferStatus,
  downloadUnmatchedCsv,
  downloadUnmatchedPdf
} from '@/components/shift/apiClient'
import { useShift } from '@/components/shift/ShiftContext'
import {
  Loader2,
  ExternalLink,
  CheckCircle2,
  Music2,
  Download,
  ArrowLeft,
  Globe,
  Check,
  X
} from 'lucide-react'
import { createPageUrl } from '@/utils'
import { checkPublicPlaylistNameAvailability } from '@/api/publicPlaylists'
import { MUSIC_GENRES } from '@/constants/genres'

type Platform = 'spotify' | 'youtube'

// ✅ Helper: determine opposite platform automatically
function getOppositePlatform(source: Platform): Platform {
  return source === 'spotify' ? 'youtube' : 'spotify'
}


type DestPlaylist = {
  id: string
  name: string
  platform: Platform
  songCount: number
  coverImage?: string
}

export default function SelectDestination() {
  const { sourcePlatform, selectedPlaylistIds, includeTracks } = useShift()

  // ✅ Determine destination platform automatically
  const destinationPlatform: Platform = getOppositePlatform(
    sourcePlatform || 'spotify'
  )

  const [isDestLinked, setIsDestLinked] = useState(false)
  const [checkingLink, setCheckingLink] = useState(false)
  const [makeNewPlaylist, setMakeNewPlaylist] = useState(true)
  const [playlistName, setPlaylistName] = useState('My Transferred Playlist')
  const [playlistDesc, setPlaylistDesc] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [makePublic, setMakePublic] = useState(false)
  const [publicPlaylistName, setPublicPlaylistName] = useState('')
  const [checkingNameAvailability, setCheckingNameAvailability] = useState(false)
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null)
  const [creating, setCreating] = useState(false)
  // Content moderation errors
  const [playlistNameModerationError, setPlaylistNameModerationError] = useState<string | null>(null)
  const [playlistDescModerationError, setPlaylistDescModerationError] = useState<string | null>(null)
  const [publicPlaylistNameModerationError, setPublicPlaylistNameModerationError] = useState<string | null>(null)

  const [transferId, setTransferId] = useState<number | null>(null)
  const [transferPhase, setTransferPhase] = useState('Idle')
  const [transferPct, setTransferPct] = useState(0)
  const [unmatchedCount, setUnmatchedCount] = useState(0)
  const [destPlaylists, setDestPlaylists] = useState<DestPlaylist[]>([])
  const [createdPlaylistId, setCreatedPlaylistId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<number | null>(null)

  // ✅ On mount, check destination link
  useEffect(() => {
    void ensureDestinationLinked()
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current)
    }
  }, [])

  // ✅ Check public playlist name availability with debouncing
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

  // ✅ Generic link check for both platforms
  async function ensureDestinationLinked() {
    setCheckingLink(true)
    setError(null)
    try {
      const rs = (await checkLinkStatus(destinationPlatform)) as { linked: boolean }
      setIsDestLinked(Boolean(rs?.linked))
      if (rs?.linked) {
        const dest = (await listPlaylists(destinationPlatform)) as {
          items?: DestPlaylist[]
        }
        setDestPlaylists(dest?.items || [])
      }
    } catch (e: any) {
      console.error('Link check failed:', e)
      setError(
        `We couldn’t verify your ${destinationPlatform} connection. Please try reconnecting.`
      )
    } finally {
      setCheckingLink(false)
    }
  }

  // ✅ Handle OAuth linking (works for both Spotify / YouTube)
  async function handleLinkDestination() {
    setError(null)
    try {
      const resp = (await getLinkUrl(destinationPlatform)) as { url: string }
      if (!resp?.url) {
        setError(`Could not get ${destinationPlatform} authorization URL.`)
        return
      }

      const popup = window.open(
        resp.url,
        `${destinationPlatform}-oauth`,
        'width=600,height=700,scrollbars=yes'
      )
      if (!popup) {
        setError('Please allow popups in your browser.')
        return
      }

      const poll = window.setInterval(async () => {
        // Check if popup is closed (wrapped in try-catch to handle COOP errors)
        let isPopupClosed = false;
        try {
          isPopupClosed = popup.closed;
        } catch (e) {
          // Cross-Origin-Opener-Policy may block popup.closed check
          // In this case, we'll rely on link status polling instead
          isPopupClosed = false;
        }
        
        if (isPopupClosed) {
          clearInterval(poll)
          await ensureDestinationLinked()
          return
        }
        try {
          const s = (await checkLinkStatus(destinationPlatform)) as { linked: boolean }
          if (s?.linked) {
            clearInterval(poll)
            try {
              popup.close()
            } catch {}
            setIsDestLinked(true)
            const dest = (await listPlaylists(destinationPlatform)) as {
              items?: DestPlaylist[]
            }
            setDestPlaylists(dest?.items || [])
          }
        } catch {}
      }, 1200)

      window.setTimeout(() => clearInterval(poll), 120000)
    } catch (e: any) {
      console.error('OAuth connection failed:', e)
      setError(`We couldn’t connect to ${destinationPlatform}. Please try again.`)
    } finally {
      setCheckingLink(false)
    }
  }

  // ✅ Handle starting the transfer
  async function handleStartTransfer() {
    // Immediate content moderation validation
    const { validateTextInput } = await import('@/utils/contentModeration')
    
    if (makeNewPlaylist) {
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
    }
    
    if (makePublic) {
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
    
    setCreating(true)
    setError(null)
    try {
      const payload = {
        sourcePlatform: sourcePlatform || 'spotify',
        destinationPlatform,
        playlistIds: selectedPlaylistIds,
        createNew: makeNewPlaylist,
        newPlaylistName: playlistName,
        newPlaylistDescription: playlistDesc,
        genre: selectedGenre,
        makePublic: makePublic,
        publicPlaylistName: makePublic ? publicPlaylistName.trim() : undefined,
        includeTracks
      }

      const res = (await startTransfer(payload)) as {
        id: number
        createdPlaylistId?: string
      }

      setTransferId(res.id)
      if (res.createdPlaylistId) setCreatedPlaylistId(res.createdPlaylistId)

      // Begin polling status
      if (pollRef.current) window.clearInterval(pollRef.current)
      pollRef.current = window.setInterval(async () => {
        try {
          const st = (await getTransferStatus(res.id)) as {
            status: string
            percent: number
            phase: string
            unmatched: number
            createdPlaylistId?: string
          }
          setTransferPhase(st.phase)
          setTransferPct(st.percent)
          setUnmatchedCount(st.unmatched || 0)
          if (st.createdPlaylistId) setCreatedPlaylistId(st.createdPlaylistId)

          if (st.status === 'COMPLETED' || st.status === 'FAILED') {
            if (pollRef.current) window.clearInterval(pollRef.current)
            const dest = (await listPlaylists(destinationPlatform)) as {
              items?: DestPlaylist[]
            }
            setDestPlaylists(dest?.items || [])
          }
        } catch {
          if (pollRef.current) window.clearInterval(pollRef.current)
        }
      }, 1200) as unknown as number
    } catch (e: any) {
      console.error('Transfer start failed:', e)
      setError(
        'We couldn’t start the transfer. Please check your connection and try again.'
      )
    } finally {
      setCreating(false)
    }
  }

  // ✅ Unmatched downloads
  async function handleDownloadCsv() {
    if (!transferId) return
    try {
      await downloadUnmatchedCsv(transferId)
    } catch {
      setError('Could not download unmatched songs CSV.')
    }
  }

  async function handleDownloadPdf() {
    if (!transferId) return
    try {
      await downloadUnmatchedPdf(transferId)
    } catch {
      setError('Could not download unmatched songs PDF.')
    }
  }

  const canStart =
    isDestLinked &&
    selectedPlaylistIds.length > 0 &&
    selectedGenre.trim().length > 0 &&
    (!makeNewPlaylist || playlistName.trim().length > 0) &&
    (!makePublic || (publicPlaylistName.trim().length > 0 && nameAvailable === true))

  const destName =
    destinationPlatform === 'youtube' ? 'YouTube Music' : 'Spotify'

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>Select Destination</h1>
          <Link to={createPageUrl('SelectPlaylist')}>
            <Button variant='outline' className='w-full sm:w-auto py-3 md:py-6'>
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

        <div className='bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6'>
          <div className='mb-4 text-sm md:text-base text-gray-600'>
            {selectedPlaylistIds.length} playlist
            {selectedPlaylistIds.length !== 1 ? 's' : ''} selected for transfer
          </div>

          {checkingLink ? (
            <div className='text-center py-8'>
              <Loader2 className='w-8 h-8 animate-spin mx-auto mb-2 text-purple-600' />
              Checking {destName} link…
            </div>
          ) : !isDestLinked ? (
            <div className='text-center py-8 border-2 border-dashed border-gray-300 rounded-lg'>
              <ExternalLink className='w-12 h-12 mx-auto mb-4 text-gray-400' />
              <p className='text-gray-600 mb-4'>
                Connect your {destName} account to continue
              </p>
              <Button
                onClick={() => void handleLinkDestination()}
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

              <label className='flex items-center gap-2 mb-4'>
                <input
                  type='checkbox'
                  checked={makeNewPlaylist}
                  onChange={(e) => setMakeNewPlaylist(e.target.checked)}
                />
                <span className='font-medium'>
                  Create new playlist on {destName}
                </span>
              </label>

              {makeNewPlaylist && (
                <div className='space-y-3 mb-6'>
                  <div>
                    <div className='text-sm mb-1'>Playlist Name *</div>
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
              )}

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

              {/* Make Public Toggle - Mandatory */}
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
                      <span className='text-red-500'>*</span>
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

              {transferId && (
                <div className='mt-8 border-t pt-6'>
                  <div className='text-sm text-gray-600 mb-2'>
                    Transfer #{transferId} • Phase:{' '}
                    <span className='font-medium'>{transferPhase}</span> •{' '}
                    {transferPct}%
                  </div>

                  {destPlaylists.length > 0 && (
                    <div className='space-y-2'>
                      <div className='text-sm font-semibold text-gray-700'>
                        Your {destName} playlists
                      </div>
                      <div className='grid grid-cols-1 gap-2'>
                        {destPlaylists.map((p) => (
                          <div
                            key={p.id}
                            className={
                              'flex items-center gap-3 p-3 border rounded-lg ' +
                              (createdPlaylistId === p.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200')
                            }
                          >
                            <div className='w-10 h-10 rounded bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center overflow-hidden'>
                              {p.coverImage ? (
                                <img
                                  src={p.coverImage}
                                  className='w-full h-full object-cover'
                                />
                              ) : (
                                <Music2 className='w-5 h-5 text-white' />
                              )}
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='font-medium truncate'>
                                {p.name}
                              </div>
                              <div className='text-xs text-gray-500'>
                                {p.songCount} songs
                              </div>
                            </div>
                            {createdPlaylistId === p.id && (
                              <div className='text-xs font-semibold text-purple-700'>
                                NEW
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className='mt-6 flex items-center gap-3'>
                    <div className='text-sm text-gray-700'>
                      Unmatched songs:{' '}
                      <span className='font-semibold'>{unmatchedCount}</span>
                    </div>
                    <Button
                      variant='outline'
                      onClick={() => void handleDownloadCsv()}
                      disabled={!transferId}
                    >
                      <Download className='w-4 h-4 mr-2' /> CSV
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => void handleDownloadPdf()}
                      disabled={!transferId}
                    >
                      <Download className='w-4 h-4 mr-2' /> PDF
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
