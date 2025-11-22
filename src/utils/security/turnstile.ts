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
    if (!window.turnstile) {
      debugLog('Warning: window.turnstile not available after script load')
    }
    resolve()
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
  document.body.appendChild(s)
  debugLog('Script element appended to body')
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

  // Reset existing widget if any
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

  debugLog('Rendering widget...')
  // Render the widget according to Cloudflare docs
  try {
    widgetId = window.turnstile.render(container, {
      sitekey: SITE_KEY,
      callback: (t: string) => { 
        debugLog('Turnstile token received')
        lastToken = t
        if (onSuccess) onSuccess(t)
      },
      'expired-callback': () => { 
        debugLog('Turnstile token expired')
        lastToken = null
        if (onExpired) onExpired()
      },
      'error-callback': () => { 
        debugLog('Turnstile widget error')
        lastToken = null
      }
    })
    debugLog('Widget rendered successfully with ID:', widgetId)
  } catch (err) {
    debugLog('Error rendering widget:', err)
    throw err
  }
}

/** Get the last issued token (or null). */
export function getTurnstileToken(): string | null {
return lastToken
}

/** Reset widget and clear token. */
export function resetTurnstile(): void {
if (widgetId && window.turnstile) {
try { window.turnstile.reset(widgetId) } catch {}
}
lastToken = null
}