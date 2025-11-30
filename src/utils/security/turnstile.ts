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
function waitForElement(containerId: string, timeout = 10000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    // Check immediately
    const element = document.getElementById(containerId)
    if (element) {
      debugLog('Container element found immediately:', containerId)
      resolve(element)
      return
    }

    debugLog('Container element not found, waiting for DOM...')
    let attempts = 0
    const maxAttempts = timeout / 100 // Check every 100ms

    const checkInterval = setInterval(() => {
      attempts++
      const element = document.getElementById(containerId)
      if (element) {
        clearInterval(checkInterval)
        debugLog('Container element found after', attempts * 100, 'ms')
        resolve(element)
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval)
        const error = `Container element #${containerId} not found within ${timeout}ms`
        debugLog('Error:', error)
        reject(new Error(error))
      }
    }, 100)

    // Also use MutationObserver as backup
    const observer = new MutationObserver(() => {
      const element = document.getElementById(containerId)
      if (element) {
        clearInterval(checkInterval)
        observer.disconnect()
        debugLog('Container element found via MutationObserver')
        resolve(element)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Cleanup on timeout
    setTimeout(() => {
      clearInterval(checkInterval)
      observer.disconnect()
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
  
  // Wait for container to exist in DOM (with longer timeout for React rendering)
  debugLog('Waiting for container element...')
  let container: HTMLElement | null = null
  try {
    container = await waitForElement(containerId)
    debugLog('Container element found')
  } catch (err) {
    const error = `Container element #${containerId} not found. Make sure the element exists in the DOM.`
    debugLog('Error:', error, err)
    throw new Error(error)
  }
  
  // Load Turnstile script
  debugLog('Loading Turnstile script...')
  await loadTurnstile()
  
  // Double-check that turnstile API is available
  if (!window.turnstile) {
    // Wait a bit more for the API to be available
    await new Promise(resolve => setTimeout(resolve, 200))
    if (!window.turnstile) {
      const error = 'turnstile API not available after script load. Check browser console for errors.'
      debugLog('Error:', error)
      throw new Error(error)
    }
  }
  debugLog('Turnstile API is available')

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

  // Verify container still exists (React might have unmounted it)
  const containerElement = document.getElementById(containerId)
  if (!containerElement) {
    const error = `Container element #${containerId} was removed from DOM`
    debugLog('Error:', error)
    throw new Error(error)
  }
  
  // Use the verified container
  const container = containerElement

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
        // Verify container still exists before rendering
        const containerEl = document.getElementById(containerId)
        if (!containerEl) {
          throw new Error(`Container #${containerId} not found during render`)
        }
        
        // Clear any existing content in container
        containerEl.innerHTML = ''
        
        debugLog('Calling turnstile.render() with sitekey:', SITE_KEY.substring(0, 8) + '...')
        debugLog('Container element:', containerEl.id, 'Dimensions:', containerEl.offsetWidth, 'x', containerEl.offsetHeight)
        
        widgetId = window.turnstile!.render(containerEl, {
          sitekey: SITE_KEY,
          theme: 'auto', // Auto theme (light/dark based on system)
          size: 'normal', // Normal size widget
          callback: (t: string) => { 
            debugLog('Turnstile token received:', t.substring(0, 20) + '...')
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
        
        // Verify widget was actually created by checking for iframe
        setTimeout(() => {
          const iframe = containerEl.querySelector('iframe[src*="challenges.cloudflare.com"]')
          if (iframe) {
            debugLog('Widget iframe confirmed in DOM')
          } else {
            debugLog('Warning: Widget iframe not found after render. Widget may not be visible.')
          }
        }, 500)
        
        resolve()
      } catch (err) {
        debugLog('Error rendering widget:', err)
        reject(err)
      }
    }

    // Use turnstile.ready() if available (recommended by Cloudflare), otherwise render directly
    if (window.turnstile.ready) {
      debugLog('Using turnstile.ready() callback')
      try {
        window.turnstile.ready(() => {
          debugLog('turnstile.ready() callback fired')
          renderWidget()
        })
      } catch (err) {
        debugLog('Error in turnstile.ready():', err)
        // Fallback to direct render
        debugLog('Falling back to direct render')
        renderWidget()
      }
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