// src/pages/Shift/SelectDestination.tsx
// --------------------------------------------------------------------
// Destination page: dynamically supports both directions
// (Spotify → YouTube OR YouTube → Spotify)
// Automatically determines the destination platform and handles linking,
// transfer, and unmatched downloads.
// --------------------------------------------------------------------
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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
  startTransfer,
  getTransferStatus,
  downloadUnmatchedCsv,
  downloadUnmatchedPdf
} from '@/components/shift/apiClient'
import RecommendationSection from '@/components/recommendations/RecommendationSection'
import { getTransferHistory, getTransferHistoryDetails } from '@/api/transferHistory'
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
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { createPageUrl } from '@/utils'
import { checkPublicPlaylistNameAvailability } from '@/api/publicPlaylists'
import { MUSIC_GENRES } from '@/constants/genres'
import { getErrorMessage, getTransferPhaseMessage, getProgressMessage, TransferStatusMessages } from '@/utils/userMessages'

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
  const [transferStatus, setTransferStatus] = useState<string>('IDLE')
  const [unmatchedCount, setUnmatchedCount] = useState(0)
  const [createdPlaylistId, setCreatedPlaylistId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transferHistoryId, setTransferHistoryId] = useState<number | null>(null)
  const pollRef = useRef<number | null>(null)
  const transferStatusRef = useRef<HTMLDivElement>(null)

  // Debug: Log state changes for recommendation section
  useEffect(() => {
    console.log('[SelectDestination] State changed:', {
      transferStatus,
      transferHistoryId,
      destinationPlatform,
      createdPlaylistId,
      transferId,
      shouldShowRecommendations: transferStatus === 'COMPLETED' && transferHistoryId !== null
    })
  }, [transferStatus, transferHistoryId, destinationPlatform, createdPlaylistId, transferId])

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
    } catch (e: any) {
      console.error('Link check failed:', e)
        setError(
          `Unable to verify your ${destinationPlatform === 'spotify' ? 'Spotify' : 'YouTube Music'} connection. Please reconnect your account.`
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
        setError(`Unable to start the connection process for ${destinationPlatform === 'spotify' ? 'Spotify' : 'YouTube Music'}. Please try again.`)
        return
      }

      const popup = window.open(
        resp.url,
        `${destinationPlatform}-oauth`,
        'width=600,height=700,scrollbars=yes'
      )
      if (!popup) {
        setError('Please allow popups in your browser to connect your account.')
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
          }
        } catch {}
      }, 1200)

      window.setTimeout(() => clearInterval(poll), 120000)
    } catch (e: any) {
      console.error('OAuth connection failed:', e)
      const friendlyError = getErrorMessage(e, `connect to ${destinationPlatform === 'spotify' ? 'Spotify' : 'YouTube Music'}`);
      setError(friendlyError);
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
        setError('The playlist name contains inappropriate content. Please choose a different name.')
        return
      }
      
      const playlistDescError = playlistDesc.trim() ? validateTextInput(playlistDesc.trim()) : null
      if (playlistDescError) {
        setPlaylistDescModerationError(playlistDescError)
        setError('The playlist description contains inappropriate content. Please revise it.')
        return
      }
    }
    
    if (makePublic) {
      const publicNameError = validateTextInput(publicPlaylistName.trim())
      if (publicNameError) {
        setPublicPlaylistNameModerationError(publicNameError)
        setError('The public playlist name contains inappropriate content. Please choose a different name.')
        return
      }
    }
    
    // Check for any moderation errors from debounced validation
    if (playlistNameModerationError || playlistDescModerationError || publicPlaylistNameModerationError) {
      setError('Some content contains inappropriate words. Please review and update your playlist details.')
      return
    }
    
    setCreating(true)
    setError(null)
    try {
      console.log('[SelectDestination] ===== STARTING TRANSFER =====')
      console.log('[SelectDestination] Payload:', {
        sourcePlatform: sourcePlatform || 'spotify',
        destinationPlatform,
        playlistIds: selectedPlaylistIds,
        createNew: makeNewPlaylist,
        newPlaylistName: playlistName,
        genre: selectedGenre,
        makePublic: makePublic
      })
      
      // Show initial progress message
      setTransferPhase('Connecting')
      setTransferPct(0)
      
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
      
      console.log('[SelectDestination] Transfer started. Response:', res)

      setTransferId(res.id)
      setTransferStatus('PENDING')
      if (res.createdPlaylistId) setCreatedPlaylistId(res.createdPlaylistId)

      // Scroll to transfer status section
      setTimeout(() => {
        transferStatusRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)

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
            destinationPlaylistId?: string
          }
          console.log('[SelectDestination] Transfer status response:', st)
          setTransferPhase(st.phase || 'Processing')
          setTransferPct(st.percent || 0)
          setTransferStatus(st.status)
          setUnmatchedCount(st.unmatched || 0)
          
          // Update user with progress message
          if (st.status === 'PENDING' || st.status === 'IN_PROGRESS' || st.status === 'RUNNING') {
            // Progress is already shown in the UI via transferPhase and transferPct
          }
          // Set createdPlaylistId from either createdPlaylistId or destinationPlaylistId
          if (st.createdPlaylistId) {
            console.log('[SelectDestination] Setting createdPlaylistId from status:', st.createdPlaylistId)
            setCreatedPlaylistId(st.createdPlaylistId)
          } else if (st.destinationPlaylistId) {
            console.log('[SelectDestination] Setting createdPlaylistId from destinationPlaylistId:', st.destinationPlaylistId)
            setCreatedPlaylistId(st.destinationPlaylistId)
          }

          if (st.status === 'COMPLETED' || st.status === 'FAILED') {
            console.log('[SelectDestination] Transfer status changed to:', st.status)
            if (pollRef.current) window.clearInterval(pollRef.current)
            // Fetch transfer history ID for recommendations when transfer completes
            if (st.status === 'COMPLETED') {
              console.log('[SelectDestination] Transfer completed, will fetch history ID in 1 second. TransferId:', res.id)
              setTimeout(() => {
                console.log('[SelectDestination] Calling fetchTransferHistoryId for transferId:', res.id)
                fetchTransferHistoryId(res.id)
              }, 1000)
            }
            // Scroll to show completion message
            setTimeout(() => {
              transferStatusRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              })
            }, 200)
          }
        } catch {
          if (pollRef.current) window.clearInterval(pollRef.current)
        }
      }, 1200) as unknown as number
    } catch (e: any) {
      console.error('[SelectDestination] Transfer start failed:', e)
      const errorMessage = e?.message || String(e)
      console.error('[SelectDestination] Error details:', {
        message: errorMessage,
        status: e?.status,
        response: e?.response
      })
      
      // Handle 409 Conflict (YouTube quota exceeded)
      if (e?.status === 409 || errorMessage?.includes('409') || errorMessage?.includes('quota')) {
        setError('YouTube API quota limit has been reached. Please try again after 24 hours.')
        setCreating(false)
        return
      }
      
      // Handle 400 Bad Request (20-song limit exceeded)
      if (e?.status === 400 && errorMessage?.includes('Maximum allowed is')) {
        setError(errorMessage || 'Playlist exceeds the maximum allowed song limit of 20 songs.')
        setCreating(false)
        return
      }
      
      // Use user-friendly error message
      const friendlyError = getErrorMessage(e, 'start the transfer')
      setError(friendlyError)
      
      // Handle authentication errors - redirect to login
      if (e?.status === 401 || errorMessage.toLowerCase().includes('session') || errorMessage.toLowerCase().includes('expired')) {
        console.error('[SelectDestination] ❌ Authentication expired - user needs to log in again')
        setTimeout(() => {
          window.location.href = '/auth'
        }, 3000)
      }
    } finally {
      setCreating(false)
    }
  }

  // ✅ Unmatched downloads
  async function handleDownloadCsv() {
    if (!transferId) return
    try {
      await downloadUnmatchedCsv(transferId)
    } catch (e: any) {
      const friendlyError = getErrorMessage(e, 'download unmatched songs list');
      setError(friendlyError);
    }
  }

  async function handleDownloadPdf() {
    if (!transferId) return
    try {
      await downloadUnmatchedPdf(transferId)
    } catch (e: any) {
      const friendlyError = getErrorMessage(e, 'download unmatched songs report');
      setError(friendlyError);
    }
  }

  // Fetch transfer history ID for recommendations
  const fetchTransferHistoryId = async (idToFetch: number | null = null, retryCount = 0) => {
    // Use provided ID or fall back to state transferId
    const targetTransferId = idToFetch ?? transferId
    
    if (!targetTransferId) {
      console.warn('[SelectDestination] fetchTransferHistoryId called but transferId is null. idToFetch:', idToFetch, 'state transferId:', transferId)
      return
    }
    
    try {
      console.log('[SelectDestination] ===== FETCHING TRANSFER HISTORY =====')
      console.log('[SelectDestination] Target TransferId:', targetTransferId, `| Attempt: ${retryCount + 1}`)
      console.log('[SelectDestination] State transferId:', transferId, '| Provided idToFetch:', idToFetch)
      
      const histories = await getTransferHistory()
      console.log('[SelectDestination] Received transfer histories count:', histories.length)
      console.log('[SelectDestination] All histories:', histories.map(h => ({ id: h.id, transferId: h.transferId, destinationPlatform: h.destinationPlatform })))
      
      // Find the most recent history entry for this transfer
      let matchingHistory = histories.find(h => h.transferId === targetTransferId)
      console.log('[SelectDestination] Exact match found:', matchingHistory ? `Yes (ID: ${matchingHistory.id})` : 'No')
      
      // If no exact match, try the most recent one (might be the current transfer)
      if (!matchingHistory && histories.length > 0) {
        console.log('[SelectDestination] No exact match found, using most recent history (ID:', histories[0].id, ')')
        matchingHistory = histories[0] // Most recent is first (ordered by created_at DESC)
      }
      
      if (matchingHistory) {
        console.log('[SelectDestination] ✅ Setting transferHistoryId to:', matchingHistory.id)
        console.log('[SelectDestination] Destination platform:', matchingHistory.destinationPlatform)
        console.log('[SelectDestination] Transfer history data:', matchingHistory)
        setTransferHistoryId(matchingHistory.id)
        
        // Also try to get destinationPlaylistId from transfer history if createdPlaylistId is not set
        // First check if we have it in the history response
        if (!createdPlaylistId) {
          // Try to get it from transfer history details
          try {
            console.log('[SelectDestination] Fetching transfer history details to get playlist ID...')
            const historyDetails = await getTransferHistoryDetails(matchingHistory.id)
            console.log('[SelectDestination] Transfer history details:', historyDetails)
            if (historyDetails?.destinationPlaylistId) {
              console.log('[SelectDestination] ✅ Setting createdPlaylistId from history details:', historyDetails.destinationPlaylistId)
              setCreatedPlaylistId(historyDetails.destinationPlaylistId)
            } else {
              console.warn('[SelectDestination] ⚠️ destinationPlaylistId not found in history details')
            }
          } catch (err) {
            console.error('[SelectDestination] ❌ Could not fetch history details for playlist ID:', err)
          }
        } else {
          console.log('[SelectDestination] createdPlaylistId already set:', createdPlaylistId)
        }
        
        console.log('[SelectDestination] State updated. Recommendation section should appear if transferStatus is COMPLETED')
      } else {
        // Retry up to 3 times with increasing delays if history not found yet
        if (retryCount < 3) {
          console.log('[SelectDestination] ⚠️ No matching history found, retrying in', (retryCount + 1) * 2000, 'ms')
          setTimeout(() => {
            fetchTransferHistoryId(targetTransferId, retryCount + 1)
          }, (retryCount + 1) * 2000)
        } else {
          console.error('[SelectDestination] ❌ No matching transfer history found after', retryCount + 1, 'attempts')
        }
      }
    } catch (err) {
      console.error('[SelectDestination] ❌ Error fetching transfer history:', err)
      console.error('[SelectDestination] Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      })
      // Retry on error up to 2 times
      if (retryCount < 2) {
        console.log('[SelectDestination] Retrying after error in', (retryCount + 1) * 2000, 'ms')
        setTimeout(() => {
          fetchTransferHistoryId(targetTransferId, retryCount + 1)
        }, (retryCount + 1) * 2000)
      } else {
        console.error('[SelectDestination] ❌ Failed to fetch transfer history after', retryCount + 1, 'attempts')
      }
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className='min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 p-4 md:p-6'
    >
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
                <motion.div
                  ref={transferStatusRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className='mt-8 border-t pt-6'
                >
                  {/* Status Message */}
                  <AnimatePresence mode="wait">
                    {transferStatus === 'PENDING' || transferStatus === 'IN_PROGRESS' || transferStatus === 'RUNNING' ? (
                      <motion.div
                        key="in-progress"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className='mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg'
                      >
                        <div className='flex items-center gap-3'>
                          <Loader2 className='w-5 h-5 text-blue-600 animate-spin' />
                          <div>
                            <p className='font-semibold text-blue-900'>{TransferStatusMessages[transferStatus as keyof typeof TransferStatusMessages] || 'Transfer in progress...'}</p>
                            <p className='text-sm text-blue-700'>{getTransferPhaseMessage(transferPhase)}</p>
                          </div>
                        </div>
                      </motion.div>
                    ) : transferStatus === 'COMPLETED' ? (
                      <motion.div
                        key="completed"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className='mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg'
                      >
                        <div className='flex items-center gap-3'>
                          <CheckCircle className='w-5 h-5 text-green-600' />
                          <div>
                            <p className='font-semibold text-green-900'>
                              Transfer has completed successfully
                              {unmatchedCount > 0 && (
                                <span className='font-normal'> with {unmatchedCount} unmatched song{unmatchedCount !== 1 ? 's' : ''}</span>
                              )}
                            </p>
                            <p className='text-sm text-green-700'>Your playlist is ready on {destName}!</p>
                          </div>
                        </div>
                      </motion.div>
                    ) : transferStatus === 'FAILED' ? (
                      <motion.div
                        key="failed"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className='mb-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg'
                      >
                        <div className='flex items-center gap-3'>
                          <AlertCircle className='w-5 h-5 text-red-600' />
                          <div>
                            <p className='font-semibold text-red-900'>Transfer failed</p>
                            <p className='text-sm text-red-700'>Please try again or reconnect your account</p>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {/* Progress Bar */}
                  {(transferStatus === 'PENDING' || transferStatus === 'IN_PROGRESS' || transferStatus === 'RUNNING') && (
                    <div className='mb-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className='text-sm font-medium text-gray-700'>
                          {getTransferPhaseMessage(transferPhase)}
                        </div>
                        <div className='text-sm font-semibold text-purple-600'>
                          {transferPct}%
                        </div>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-3 mb-2'>
                        <div
                          className='bg-gradient-to-r from-purple-600 to-blue-500 h-3 rounded-full transition-all duration-300'
                          style={{ width: `${Math.max(0, Math.min(100, transferPct))}%` }}
                        />
                      </div>
                      <div className='text-xs text-gray-500 mt-1'>
                        Please wait while we transfer your music...
                      </div>
                    </div>
                  )}

                  {transferStatus === 'COMPLETED' && unmatchedCount > 0 && (
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
                  )}

                  {/* Recommendations Section - Show when transfer is completed */}
                  {(() => {
                    const shouldShow = transferStatus === 'COMPLETED' && transferHistoryId
                    console.log('[SelectDestination] Recommendation Section Render Check:', {
                      transferStatus,
                      transferHistoryId,
                      destinationPlatform,
                      createdPlaylistId,
                      shouldShow
                    })
                    return shouldShow ? (
                      <div className='mt-8 border-t pt-6'>
                        <RecommendationSection
                          transferHistoryId={transferHistoryId}
                          destinationPlatform={destinationPlatform}
                          destinationPlaylistId={createdPlaylistId || undefined}
                        />
                      </div>
                    ) : null
                  })()}
                  

                  {/* Debug Panel - Remove in production */}
                  {import.meta.env.DEV && transferId && (
                    <div className='mt-4 p-4 bg-gray-100 rounded text-xs font-mono'>
                      <div className='font-bold mb-2'>[DEBUG] Recommendation Section State:</div>
                      <div>transferStatus: <span className={transferStatus === 'COMPLETED' ? 'text-green-600' : 'text-red-600'}>{transferStatus}</span></div>
                      <div>transferHistoryId: <span className={transferHistoryId ? 'text-green-600' : 'text-red-600'}>{transferHistoryId || 'null'}</span></div>
                      <div>destinationPlatform: <span className='text-blue-600'>{destinationPlatform}</span></div>
                      <div>createdPlaylistId: <span className={createdPlaylistId ? 'text-green-600' : 'text-gray-500'}>{createdPlaylistId || 'null'}</span></div>
                      <div>transferId: <span className='text-blue-600'>{transferId}</span></div>
                      <div className='mt-2 pt-2 border-t border-gray-300'>
                        Should show recommendations: <span className={transferStatus === 'COMPLETED' && transferHistoryId ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                          {transferStatus === 'COMPLETED' && transferHistoryId ? 'YES ✅' : 'NO ❌'}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
