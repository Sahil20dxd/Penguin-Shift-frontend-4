/**
 * Utility functions for user-friendly error messages and status updates
 * Converts technical errors (HTTP codes, status codes) into user-friendly messages
 */

/**
 * Converts HTTP status codes to user-friendly error messages
 */
export function getUserFriendlyError(status: number | undefined, defaultMessage?: string): string {
  if (!status) {
    return defaultMessage || 'Something went wrong. Please try again.'
  }

  const statusMessages: Record<number, string> = {
    400: 'Please check your input and try again.',
    401: 'Your session has expired. Please log in again.',
    403: 'You don\'t have permission to perform this action.',
    404: 'The requested item could not be found.',
    409: 'YouTube API quota limit has been reached. Please try again after 24 hours.',
    422: 'The information provided is invalid. Please check and try again.',
    423: 'Your account is temporarily locked. Please try again later.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Our servers are experiencing issues. Please try again in a few moments.',
    502: 'Service temporarily unavailable. Please try again later.',
    503: 'Service is temporarily down for maintenance. Please try again later.',
    504: 'The request took too long. Please try again.',
  }

  return statusMessages[status] || defaultMessage || 'Something went wrong. Please try again.'
}

/**
 * Converts error objects to user-friendly messages
 */
export function getErrorMessage(error: any, context?: string): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.'
  }

  // If it's already a user-friendly message, return it
  if (typeof error === 'string' && !error.match(/^\d{3}/) && !error.includes('HTTP')) {
    return error
  }

  // Extract status code from error
  const status = error?.status || error?.response?.status
  
  // Check for specific error messages in the error object
  const errorMessage = error?.message || error?.error || String(error)
  
  // Remove HTTP codes and technical terms
  let cleanMessage = errorMessage
    .replace(/HTTP \d{3}/gi, '')
    .replace(/\d{3} (Unauthorized|Forbidden|Not Found|Internal Server Error)/gi, '')
    .replace(/status code \d{3}/gi, '')
    .replace(/status: \d{3}/gi, '')
    .trim()

  // If we have a status code, use the user-friendly message
  if (status) {
    return getUserFriendlyError(status, cleanMessage || undefined)
  }

  // If the message still contains technical terms, provide a generic message
  if (cleanMessage.match(/^\d{3}/) || cleanMessage.includes('HTTP') || cleanMessage.includes('status code')) {
    return context 
      ? `Unable to ${context}. Please try again.`
      : 'Something went wrong. Please try again.'
  }

  return cleanMessage || 'Something went wrong. Please try again.'
}

/**
 * Transfer process status messages
 */
export const TransferStatusMessages = {
  IDLE: 'Ready to start your transfer',
  PENDING: 'Preparing your transfer...',
  RUNNING: 'Transferring your music...',
  IN_PROGRESS: 'Transfer in progress...',
  COMPLETED: 'Transfer completed successfully!',
  FAILED: 'Transfer failed. Please try again.',
}

/**
 * Transfer phase messages for user updates
 */
export const TransferPhaseMessages: Record<string, string> = {
  'Idle': 'Ready to begin',
  'Connecting': 'Connecting to your music platforms...',
  'Fetching': 'Fetching your playlists...',
  'Matching': 'Finding matching songs...',
  'Transferring': 'Adding songs to your destination playlist...',
  'Completed': 'Transfer completed!',
  'Failed': 'Transfer encountered an issue',
}

/**
 * Gets a user-friendly message for a transfer phase
 */
export function getTransferPhaseMessage(phase: string | null | undefined): string {
  if (!phase) return 'Processing your transfer...'
  return TransferPhaseMessages[phase] || `Processing: ${phase}...`
}

/**
 * Progress percentage message
 */
export function getProgressMessage(processed: number, total: number, phase?: string): string {
  if (total === 0) return 'Preparing...'
  
  const percentage = Math.round((processed / total) * 100)
  const phaseMsg = phase ? `${getTransferPhaseMessage(phase)} ` : ''
  
  return `${phaseMsg}${processed} of ${total} songs processed (${percentage}%)`
}

