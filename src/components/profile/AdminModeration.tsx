// src/components/profile/AdminModeration.tsx
// Admin moderation dashboard for reviewing flagged public playlists
// Note: Admin and Curator roles are treated the same

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  ShieldOff,
  RefreshCw,
  Music2,
  Globe,
  Calendar,
  User,
  Mail,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/useToast'
import {
  getFlaggedPlaylists,
  getPlaylistDetails,
  approvePlaylist,
  hidePlaylist,
  restrictUser,
  unrestrictUser,
  type FlaggedPlaylist,
} from '@/api/adminModeration'

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'HIDDEN'

export default function AdminModeration() {
  const { showToast, Toast } = useToast()
  const [playlists, setPlaylists] = useState<FlaggedPlaylist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedPlaylist, setSelectedPlaylist] = useState<FlaggedPlaylist | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    fetchFlaggedPlaylists()
  }, [statusFilter])

  const fetchFlaggedPlaylists = async () => {
    try {
      setLoading(true)
      setError(null)
      const status = statusFilter === 'ALL' ? undefined : statusFilter
      const data = await getFlaggedPlaylists(status)
      setPlaylists(data.playlists || [])
    } catch (err: any) {
      console.error('Failed to fetch flagged playlists:', err)
      setError(err.message || 'Failed to load flagged playlists. Please try again later.')
      showToast(err.message || 'Failed to load flagged playlists', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (playlist: FlaggedPlaylist) => {
    setSelectedPlaylist(playlist)
    setSheetOpen(true)
    // Optionally fetch full details
    try {
      const details = await getPlaylistDetails(playlist.id)
      setSelectedPlaylist(details)
    } catch (err) {
      console.error('Failed to fetch playlist details:', err)
    }
  }

  const handleApprove = async (playlist: FlaggedPlaylist) => {
    try {
      setActionLoading(playlist.id)
      await approvePlaylist(playlist.id)
      showToast('Playlist approved and flags cleared', 'success')
      await fetchFlaggedPlaylists()
      if (selectedPlaylist?.id === playlist.id) {
        setSheetOpen(false)
      }
    } catch (err: any) {
      console.error('Failed to approve playlist:', err)
      showToast(err.message || 'Failed to approve playlist', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleHide = async (playlist: FlaggedPlaylist) => {
    try {
      setActionLoading(playlist.id)
      await hidePlaylist(playlist.id, 'Hidden by admin')
      showToast('Playlist hidden from public explore', 'success')
      await fetchFlaggedPlaylists()
      if (selectedPlaylist?.id === playlist.id) {
        setSheetOpen(false)
      }
    } catch (err: any) {
      console.error('Failed to hide playlist:', err)
      showToast(err.message || 'Failed to hide playlist', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestrictUser = async (playlist: FlaggedPlaylist) => {
    if (!confirm(`Restrict user "${playlist.ownerUsername}" from creating public playlists?`)) {
      return
    }
    try {
      setActionLoading(playlist.id)
      await restrictUser(playlist.ownerEmail, 'Restricted by admin')
      showToast('User restricted from creating public playlists', 'success')
      await fetchFlaggedPlaylists()
      if (selectedPlaylist?.id === playlist.id) {
        // Refresh selected playlist details
        const details = await getPlaylistDetails(playlist.id)
        setSelectedPlaylist(details)
      }
    } catch (err: any) {
      console.error('Failed to restrict user:', err)
      showToast(err.message || 'Failed to restrict user', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnrestrictUser = async (playlist: FlaggedPlaylist) => {
    if (!confirm(`Unrestrict user "${playlist.ownerUsername}" and allow them to create public playlists again?`)) {
      return
    }
    try {
      setActionLoading(playlist.id)
      await unrestrictUser(playlist.ownerEmail)
      showToast('User unrestricted successfully', 'success')
      await fetchFlaggedPlaylists()
      if (selectedPlaylist?.id === playlist.id) {
        // Refresh selected playlist details
        const details = await getPlaylistDetails(playlist.id)
        setSelectedPlaylist(details)
      }
    } catch (err: any) {
      console.error('Failed to unrestrict user:', err)
      showToast(err.message || 'Failed to unrestrict user', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className='bg-yellow-100 text-yellow-800'>Pending</Badge>
      case 'APPROVED':
        return <Badge className='bg-green-100 text-green-800'>Approved</Badge>
      case 'HIDDEN':
        return <Badge className='bg-red-100 text-red-800'>Hidden</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPlatformBadge = (platform: string) => {
    return (
      <Badge variant='outline' className='capitalize'>
        {platform === 'spotify' ? '🎵 Spotify' : '▶️ YouTube'}
      </Badge>
    )
  }

  if (loading && playlists.length === 0) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
      </div>
    )
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-6'>
        <div className='flex items-center gap-2 mb-4'>
          <Shield className='w-5 h-5 text-purple-600' />
          <h2 className='text-2xl font-bold text-gray-900'>Moderation Dashboard</h2>
        </div>
        <p className='text-gray-600'>Review and moderate all public playlists. Use filters to view specific statuses.</p>
      </motion.div>

      {error && (
        <div className='mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm flex items-center gap-2'>
          <AlertCircle className='w-4 h-4' />
          {error}
        </div>
      )}

      <Card className='bg-white shadow-lg rounded-2xl overflow-hidden'>
        <CardHeader className='border-b border-gray-100 p-6'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-xl font-semibold text-gray-900'>All Playlists</CardTitle>
            <div className='flex items-center gap-3'>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className='w-40 bg-white border border-gray-300 text-gray-900'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-white border border-gray-200 shadow-lg'>
                  <SelectItem value='ALL' className='bg-white hover:bg-gray-100 text-gray-900 cursor-pointer'>All Status</SelectItem>
                  <SelectItem value='PENDING' className='bg-white hover:bg-gray-100 text-gray-900 cursor-pointer'>Pending</SelectItem>
                  <SelectItem value='APPROVED' className='bg-white hover:bg-gray-100 text-gray-900 cursor-pointer'>Approved</SelectItem>
                  <SelectItem value='HIDDEN' className='bg-white hover:bg-gray-100 text-gray-900 cursor-pointer'>Hidden</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant='outline'
                size='icon'
                onClick={fetchFlaggedPlaylists}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          {playlists.length === 0 ? (
            <div className='p-12 text-center text-gray-500'>
              <Music2 className='w-12 h-12 mx-auto mb-4 text-gray-400' />
              <p className='text-lg font-medium mb-2'>No playlists found</p>
              <p className='text-sm'>
                {statusFilter === 'ALL'
                  ? 'No playlists in the system yet.'
                  : `No playlists with status "${statusFilter}"`}
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-gray-50'>
                    <TableHead className='font-semibold'>Playlist Name</TableHead>
                    <TableHead className='font-semibold'>Owner</TableHead>
                    <TableHead className='font-semibold'>Platform</TableHead>
                    <TableHead className='font-semibold'>Status</TableHead>
                    <TableHead className='font-semibold'>Reports</TableHead>
                    <TableHead className='font-semibold'>Last Flagged</TableHead>
                    <TableHead className='font-semibold text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playlists.map((playlist) => (
                    <TableRow key={playlist.id} className='hover:bg-gray-50'>
                      <TableCell className='font-medium'>{playlist.playlistName}</TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='text-sm font-medium'>{playlist.ownerUsername}</span>
                          <span className='text-xs text-gray-500'>{playlist.ownerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPlatformBadge(playlist.platform)}</TableCell>
                      <TableCell>{getStatusBadge(playlist.status)}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className='bg-orange-50 text-orange-700'>
                          {playlist.reportCount} {playlist.reportCount === 1 ? 'report' : 'reports'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-sm text-gray-600'>
                        {new Date(playlist.lastFlaggedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleViewDetails(playlist)}
                            className='h-8'
                            title="View playlist details and reports"
                          >
                            <Eye className='w-4 h-4' />
                          </Button>
                          {playlist.status === 'PENDING' && (
                            <>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleApprove(playlist)}
                                disabled={actionLoading === playlist.id}
                                className='h-8 text-green-600 hover:text-green-700 hover:bg-green-50'
                                title="Approve playlist and clear flags - makes it visible in explore section"
                              >
                                {actionLoading === playlist.id ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <CheckCircle className='w-4 h-4' />
                                )}
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleHide(playlist)}
                                disabled={actionLoading === playlist.id}
                                className='h-8 text-red-600 hover:text-red-700 hover:bg-red-50'
                                title="Hide playlist from explore section - owner will be notified"
                              >
                                {actionLoading === playlist.id ? (
                                  <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                  <EyeOff className='w-4 h-4' />
                                )}
                              </Button>
                            </>
                          )}
                          {!playlist.isUserRestricted ? (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleRestrictUser(playlist)}
                              disabled={actionLoading === playlist.id}
                              className='h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                              title="Restrict this user from creating public playlists"
                            >
                              {actionLoading === playlist.id ? (
                                <Loader2 className='w-4 h-4 animate-spin' />
                              ) : (
                                <Shield className='w-4 h-4' />
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleUnrestrictUser(playlist)}
                              disabled={actionLoading === playlist.id}
                              className='h-8 text-green-600 hover:text-green-700 hover:bg-green-50'
                              title="Remove restriction and allow user to create public playlists again"
                            >
                              {actionLoading === playlist.id ? (
                                <Loader2 className='w-4 h-4 animate-spin' />
                              ) : (
                                <ShieldOff className='w-4 h-4' />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Playlist Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className='w-full sm:max-w-2xl overflow-y-auto bg-white border-l border-gray-200'>
          <SheetHeader className='bg-white pb-4 border-b border-gray-200'>
            <SheetTitle className='text-gray-900 font-bold text-xl'>Playlist Details</SheetTitle>
            <SheetDescription className='text-gray-600'>Review playlist information and take moderation actions</SheetDescription>
          </SheetHeader>

          {selectedPlaylist && (
            <ScrollArea className='mt-6'>
              <div className='space-y-6 bg-white p-1'>
                {/* Basic Info */}
                <div className='bg-white rounded-lg p-4'>
                  <h3 className='text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900'>
                    <Music2 className='w-5 h-5 text-gray-700' />
                    Playlist Information
                  </h3>
                  <div className='space-y-2'>
                    <div>
                      <span className='text-sm font-medium text-gray-700'>Name:</span>
                      <p className='text-base font-semibold text-gray-900'>{selectedPlaylist.playlistName}</p>
                    </div>
                    {selectedPlaylist.description && (
                      <div>
                        <span className='text-sm font-medium text-gray-700'>Description:</span>
                        <p className='text-base text-gray-800'>{selectedPlaylist.description}</p>
                      </div>
                    )}
                    <div className='flex items-center gap-4'>
                      <div>
                        <span className='text-sm font-medium text-gray-700'>Platform:</span>
                        <div className='mt-1'>{getPlatformBadge(selectedPlaylist.platform)}</div>
                      </div>
                      {selectedPlaylist.genre && (
                        <div>
                          <span className='text-sm font-medium text-gray-700'>Genre:</span>
                          <p className='text-base text-gray-900'>{selectedPlaylist.genre}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-700'>Status:</span>
                      <div className='mt-1'>{getStatusBadge(selectedPlaylist.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Owner Info */}
                <div className='bg-white rounded-lg p-4'>
                  <h3 className='text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900'>
                    <User className='w-5 h-5 text-gray-700' />
                    Owner Information
                  </h3>
                  <div className='space-y-2'>
                    <div>
                      <span className='text-sm font-medium text-gray-700'>Username:</span>
                      <p className='text-base text-gray-900'>{selectedPlaylist.ownerUsername}</p>
                    </div>
                    <div>
                      <span className='text-sm font-medium text-gray-700'>Email:</span>
                      <p className='text-base text-gray-900'>{selectedPlaylist.ownerEmail}</p>
                    </div>
                    {selectedPlaylist.isUserRestricted && (
                      <Badge className='bg-red-100 text-red-800'>User Restricted</Badge>
                    )}
                  </div>
                </div>

                {/* Flag Information */}
                <div className='bg-white rounded-lg p-4'>
                  <h3 className='text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900'>
                    <AlertCircle className='w-5 h-5 text-gray-700' />
                    Flag Information
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <span className='text-sm font-medium text-gray-700'>Report Count:</span>
                      <p className='text-base font-semibold text-orange-600'>
                        {selectedPlaylist.reportCount} {selectedPlaylist.reportCount === 1 ? 'report' : 'reports'}
                      </p>
                    </div>
                    {selectedPlaylist.flagReasons && selectedPlaylist.flagReasons.length > 0 && (
                      <div>
                        <span className='text-sm font-medium text-gray-700'>Flag Reasons:</span>
                        <div className='mt-2 flex flex-wrap gap-2'>
                          {selectedPlaylist.flagReasons.map((reason, idx) => (
                            <Badge key={idx} variant='outline' className='bg-orange-50 text-orange-700 border-orange-200'>
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Report Messages */}
                    {selectedPlaylist.reportDetails && selectedPlaylist.reportDetails.length > 0 && (
                      <div>
                        <span className='text-sm font-medium text-gray-700 mb-2 block'>Report Messages:</span>
                        <div className='space-y-3'>
                          {selectedPlaylist.reportDetails.map((report, idx) => (
                            <div key={report.id || idx} className='border border-orange-200 rounded-lg p-3 bg-orange-50'>
                              <div className='flex items-start justify-between mb-2'>
                                <Badge variant='outline' className='bg-white text-gray-800 border-gray-300'>
                                  {report.reason}
                                </Badge>
                                <span className='text-xs text-gray-600'>
                                  {new Date(report.createdAt).toLocaleString()}
                                </span>
                              </div>
                              {report.details && (
                                <p className='text-sm text-gray-800 mt-2'>{report.details}</p>
                              )}
                              {!report.details && (
                                <p className='text-xs text-gray-600 italic'>No additional details provided</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className='flex items-center gap-4 text-sm text-gray-700'>
                      <div className='flex items-center gap-1'>
                        <Calendar className='w-4 h-4' />
                        <span>Created: {new Date(selectedPlaylist.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <AlertCircle className='w-4 h-4' />
                        <span>Last Flagged: {new Date(selectedPlaylist.lastFlaggedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className='pt-4 border-t border-gray-200 bg-white rounded-lg p-4'>
                  <h3 className='text-lg font-semibold mb-3 text-gray-900'>Moderation Actions</h3>
                  <div className='flex flex-wrap gap-3'>
                    {selectedPlaylist.status === 'PENDING' && (
                      <>
                        <Button
                          onClick={() => handleApprove(selectedPlaylist)}
                          disabled={actionLoading === selectedPlaylist.id}
                          className='bg-green-600 hover:bg-green-700 text-white'
                          title="Approve playlist and clear flags - makes it visible in explore section"
                        >
                          {actionLoading === selectedPlaylist.id ? (
                            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                          ) : (
                            <CheckCircle className='w-4 h-4 mr-2' />
                          )}
                          Approve & Clear Flags
                        </Button>
                        <Button
                          onClick={() => handleHide(selectedPlaylist)}
                          disabled={actionLoading === selectedPlaylist.id}
                          variant='destructive'
                          title="Hide playlist from explore section - owner will be notified with reason"
                        >
                          {actionLoading === selectedPlaylist.id ? (
                            <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                          ) : (
                            <EyeOff className='w-4 h-4 mr-2' />
                          )}
                          Hide from Public
                        </Button>
                      </>
                    )}
                    {!selectedPlaylist.isUserRestricted ? (
                      <Button
                        onClick={() => handleRestrictUser(selectedPlaylist)}
                        disabled={actionLoading === selectedPlaylist.id}
                        variant='outline'
                        className='border-orange-300 text-orange-700 hover:bg-orange-50'
                        title="Restrict this user from creating public playlists"
                      >
                        {actionLoading === selectedPlaylist.id ? (
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        ) : (
                          <Shield className='w-4 h-4 mr-2' />
                        )}
                        Restrict User
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUnrestrictUser(selectedPlaylist)}
                        disabled={actionLoading === selectedPlaylist.id}
                        variant='outline'
                        className='border-green-300 text-green-700 hover:bg-green-50'
                        title="Remove restriction and allow user to create public playlists again"
                      >
                        {actionLoading === selectedPlaylist.id ? (
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        ) : (
                          <ShieldOff className='w-4 h-4 mr-2' />
                        )}
                        Unrestrict User
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {Toast}
    </>
  )
}

