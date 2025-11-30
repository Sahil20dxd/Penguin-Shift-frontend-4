// src/utils/security/turnstile.ts
// --------------------------------------------------------------------
// Loader + renderer for Cloudflare Turnstile (explicit widget).
// Caches widget id and last token for submit.
// --------------------------------------------------------------------
let scriptLoaded = false
let widgetId: string | null = null
let lastToken: string | null = null

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const SITE_KEY = (import.meta as any)?.env?.VITE_TURNSTILE_SITE_KEY || ''
const CALLBACK_NAME = '__onTurnstileLoaded'

// Debug logging (only in development)
const DEBUG = import.meta.env.DEV
function debugLog(...args: any[]) {
  if (DEBUG) console.log('[Turnstile]', ...args)
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: string | HTMLElement, opts: Record<string, any>) => string
      reset: (id?: string) => void
      ready: (callback: () => void) => void
      getResponse: (id?: string) => string | undefined
      remove: (id?: string) => void
      isExpired: (id?: string) => boolean
    }
    [key: string]: any
  }
}

/** Inject Turnstile script once and resolve when ready. */
export function loadTurnstile(): Promise<void> {
if (window.turnstile) return Promise.resolve()

if (scriptLoaded) {
return new Promise((resolve, reject) => {
let attempts = 0
const maxAttempts = 100 // 5 seconds max wait (100 * 50ms)
const wait = (): void => {
if (window.turnstile) {
resolve()
} else if (attempts >= maxAttempts) {
reject(new Error('Turnstile script loaded but API not available'))
} else {
attempts++
window.setTimeout(wait, 50)
}
}
wait()
})
}

scriptLoaded = true
debugLog('Loading Turnstile script from:', SRC)
return new Promise((resolve, reject) => {
  // Set timeout for script loading (10 seconds)
  const timeout = window.setTimeout(() => {
    debugLog('Script loading timeout')
    reject(new Error('Turnstile script loading timeout'))
  }, 10000)

  window[CALLBACK_NAME] = () => {
    clearTimeout(timeout)
    debugLog('Turnstile script loaded successfully')
    // Wait a bit for turnstile API to be available
    const checkTurnstile = () => {
      if (window.turnstile) {
        debugLog('Turnstile API is available')
        resolve()
      } else {
        // Retry after a short delay
        setTimeout(() => {
          if (window.turnstile) {
            debugLog('Turnstile API is now available (delayed)')
            resolve()
          } else {
            debugLog('Warning: window.turnstile not available after script load')
            // Still resolve to allow rendering to proceed
            resolve()
          }
        }, 100)
      }
    }
    checkTurnstile()
  }
  const s = document.createElement('script')
  s.src = SRC + '?render=explicit&onload=' + CALLBACK_NAME
  s.async = true
  s.defer = true
  s.onerror = (err) => {
    clearTimeout(timeout)
    debugLog('Script loading error:', err)
    reject(new Error('Failed to load Turnstile script from Cloudflare'))
  }
  // Append to head for better loading (or body if head not available)
  const target = document.head || document.body
  target.appendChild(s)
  debugLog('Script element appended to', target.tagName)
})
}

/** Wait for container element to exist in DOM */
function waitForElement(containerId: string, timeout = 5000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const element = document.getElementById(containerId)
    if (element) {
      resolve(element)
      return
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.getElementById(containerId)
      if (element) {
        obs.disconnect()
        resolve(element)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Timeout after specified time
    setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Container element #${containerId} not found within ${timeout}ms`))
    }, timeout)
  })
}

// Track which containers have widgets to prevent duplicates
const renderedContainers = new Set<string>()

/** Render Turnstile into containerId and keep token fresh. */
export async function renderTurnstile(
  containerId: string,
  onSuccess?: (token: string) => void,
  onExpired?: () => void
): Promise<void> {
  if (!SITE_KEY) {
    const error = 'VITE_TURNSTILE_SITE_KEY is missing. Please set it in your environment variables.'
    debugLog('Error:', error)
    throw new Error(error)
  }
  
  // Check if widget already exists in this container
  if (renderedContainers.has(containerId)) {
    debugLog('Widget already rendered in container:', containerId, '- skipping')
    return
  }
  
  debugLog('Rendering Turnstile widget in container:', containerId, 'with site key:', SITE_KEY.substring(0, 8) + '...')
  
  // Wait for container to exist in DOM
  debugLog('Waiting for container element...')
  await waitForElement(containerId)
  debugLog('Container element found')
  
  await loadTurnstile()
  if (!window.turnstile) {
    const error = 'turnstile API not available after script load'
    debugLog('Error:', error)
    throw new Error(error)
  }

  // Reset existing widget if any (for different containers)
  if (widgetId) {
    try { 
      debugLog('Resetting existing widget:', widgetId)
      window.turnstile.reset(widgetId) 
      widgetId = null
    } catch (err) {
      debugLog('Error resetting widget:', err)
    }
  }

  // Get the container element
  const container = document.getElementById(containerId)
  if (!container) {
    const error = `Container element #${containerId} not found`
    debugLog('Error:', error)
    throw new Error(error)
  }

  // Check if container already has a Turnstile widget (prevent duplicates)
  // Check for both cf-turnstile class and iframe (widget creates iframe)
  if (container.querySelector('.cf-turnstile') || container.querySelector('iframe[src*="challenges.cloudflare.com"]')) {
    debugLog('Container already has a Turnstile widget - skipping render')
    renderedContainers.add(containerId)
    return
  }

  debugLog('Rendering widget...')
  // Render the widget according to Cloudflare docs using turnstile.ready()
  return new Promise<void>((resolve, reject) => {
    if (!window.turnstile) {
      reject(new Error('turnstile API not available'))
      return
    }

    const renderWidget = () => {
      try {
        widgetId = window.turnstile!.render(container, {
          sitekey: SITE_KEY,
          callback: (t: string) => { 
            debugLog('Turnstile token received')
            lastToken = t
            if (onSuccess) onSuccess(t)
          },
          'expired-callback': () => { 
            debugLog('Turnstile token expired - resetting widget')
            lastToken = null
            // Automatically reset widget to allow new challenge
            if (widgetId && window.turnstile) {
              try {
                window.turnstile.reset(widgetId)
                debugLog('Widget reset after expiration')
              } catch (err) {
                debugLog('Error resetting widget after expiration:', err)
              }
            }
            if (onExpired) onExpired()
          },
          'error-callback': (errorCode?: string) => { 
            debugLog('Turnstile widget error:', errorCode)
            lastToken = null
            // Reset widget on error to allow retry
            if (widgetId && window.turnstile) {
              try {
                window.turnstile.reset(widgetId)
                debugLog('Widget reset after error')
              } catch (err) {
                debugLog('Error resetting widget after error:', err)
              }
            }
          }
        })
        renderedContainers.add(containerId)
        debugLog('Widget rendered successfully with ID:', widgetId)
        resolve()
      } catch (err) {
        debugLog('Error rendering widget:', err)
        reject(err)
      }
    }

    // Use turnstile.ready() if available (recommended by Cloudflare), otherwise render directly
    if (window.turnstile.ready) {
      window.turnstile.ready(() => {
        renderWidget()
      })
    } else {
      // Fallback: render directly if ready() is not available
      debugLog('turnstile.ready() not available, rendering directly')
      renderWidget()
    }
  })
}

/** Get the last issued token (or null). */
export function getTurnstileToken(): string | null {
return lastToken
}

/** Reset widget and clear token. */
export function resetTurnstile(containerId?: string): void {
  if (widgetId && window.turnstile) {
    try { 
      window.turnstile.reset(widgetId) 
      debugLog('Widget reset:', widgetId)
    } catch (err) {
      debugLog('Error resetting widget:', err)
    }
  }
  if (containerId) {
    renderedContainers.delete(containerId)
    debugLog('Removed container from rendered set:', containerId)
  }
  lastToken = null
  widgetId = null
}