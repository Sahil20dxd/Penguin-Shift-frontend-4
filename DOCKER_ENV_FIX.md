# Docker Build Environment Variable Fix

## Critical Issue Found

**Problem:** The Turnstile CAPTCHA widget is not loading because `VITE_TURNSTILE_SITE_KEY` is not available during the Docker build process.

**Root Cause:** 
- Vite replaces `import.meta.env.VITE_*` variables at **BUILD TIME**, not runtime
- The Dockerfile was not accepting build arguments for environment variables
- Render's environment variables need to be passed as Docker build arguments

## Solution Applied

### Updated Dockerfile

The Dockerfile now accepts build arguments and sets them as environment variables before the build:

```dockerfile
# Accept build arguments for environment variables
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_API_BASE

# Set as environment variables for Vite to access during build
ENV VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY}
ENV VITE_API_BASE=${VITE_API_BASE}
```

## Render Configuration

### Option 1: Render Auto-Passes Environment Variables (Recommended)

Render **automatically passes environment variables as build arguments** when building Docker images. So if you have `VITE_TURNSTILE_SITE_KEY` set in Render's environment variables, it should work automatically.

**Steps:**
1. Go to Render Dashboard → Your frontend service
2. Environment tab
3. Ensure `VITE_TURNSTILE_SITE_KEY=0x4AAAAAACAkALqygI36ZIdY` is set
4. Save and trigger a rebuild

### Option 2: Manual Build Args (If Auto-Pass Doesn't Work)

If Render doesn't automatically pass them, you may need to configure build arguments in Render's service settings.

## Verification

After deploying:

1. **Check Build Logs:**
   - Look for the build process
   - Should NOT see "VITE_TURNSTILE_SITE_KEY is not set" warnings

2. **Check Browser Console:**
   - Visit: https://penguin-shift-frontend-4.onrender.com/auth?mode=register
   - Open DevTools → Console
   - Should NOT see: "[Turnstile] VITE_TURNSTILE_SITE_KEY is not set"
   - Should see: The CAPTCHA widget rendered

3. **Check Network Tab:**
   - Should see successful request to `challenges.cloudflare.com/turnstile/v0/api.js`

## Cloudflare Turnstile Configuration Verification

Based on Cloudflare documentation and your screenshot:

✅ **Widget Name:** PenguinShift Local  
✅ **Hostnames Configured:**
   - `127.0.0.1` (local development)
   - `penguin-shift-frontend-4.onrender.com` (production frontend)
   - `penguinshift-backend-v5.onrender.com` (production backend)

✅ **Widget Mode:** Managed (correct for most use cases)

✅ **Site Key:** `0x4AAAAAACAkALqygI36ZIdY`  
✅ **Secret Key:** `0x4AAAAAACAkAD_0NZNuRdP3lJo5dtJptSY`

## Implementation Verification

### ✅ Code Implementation Matches Cloudflare Docs

1. **Script Loading: Correct
   ```typescript
   s.src = SRC + '?render=explicit&onload=' + CALLBACK_NAME
   ```
   - Uses `render=explicit` (correct for explicit widget rendering)
   - Uses callback for onload (correct)

2. **Widget Rendering: Correct
   ```typescript
   window.turnstile.render(containerEl, {
     sitekey: SITE_KEY,
     theme: 'auto',
     size: 'normal',
     callback: (t: string) => { ... },
     'expired-callback': () => { ... },
     'error-callback': (errorCode?: string) => { ... }
   })
   ```
   - Matches Cloudflare's explicit widget API
   - Includes all recommended callbacks

3. **CSP Configuration: Correct
   ```html
   script-src 'self' ... https://challenges.cloudflare.com ...
   frame-src 'self' https://challenges.cloudflare.com ...
   connect-src 'self' ... https://*.cloudflare.com ...
   ```
   - Allows Turnstile script, iframe, and API calls

4. **Preconnect: Correct
   ```html
   <link rel="preconnect" href="https://challenges.cloudflare.com" />
   ```
   - Improves loading performance

## Next Steps

1. ✅ Dockerfile updated to accept build arguments
2. ⏳ Commit and push changes
3. ⏳ Verify `VITE_TURNSTILE_SITE_KEY` is set in Render
4. ⏳ Wait for Render to rebuild
5. ⏳ Test the CAPTCHA widget on deployed site

## Troubleshooting

If the widget still doesn't load after this fix:

1. **Check Render Build Logs:**
   - Look for `VITE_TURNSTILE_SITE_KEY` in build output
   - Should see it being used during `npm run build`

2. **Verify Environment Variable:**
   - Render Dashboard → Service → Environment
   - Key: `VITE_TURNSTILE_SITE_KEY`
   - Value: `0x4AAAAAACAkALqygI36ZIdY`

3. **Check Build Arguments:**
   - Some platforms require explicit build arg configuration
   - Check Render's Docker build settings

4. **Test Locally:**
   ```bash
   docker build --build-arg VITE_TURNSTILE_SITE_KEY=0x4AAAAAACAkALqygI36ZIdY -t test-build .
   ```

