# CAPTCHA Widget Not Loading - Troubleshooting Guide

## Issues Fixed

### 1. ✅ Environment Variable Access Pattern
**Problem:** Code was using `(import.meta as any)?.env?.VITE_TURNSTILE_SITE_KEY` instead of the correct Vite pattern.

**Fix:** Changed to `import.meta.env.VITE_TURNSTILE_SITE_KEY` in:
- `src/utils/security/turnstile.ts`
- `src/pages/Auth/LoginPage.tsx`
- `src/pages/Auth/RegisterPage.tsx`

### 2. ✅ Added Better Debug Logging
Added console warnings when the site key is missing to help identify configuration issues.

## Common Reasons CAPTCHA Won't Load

### 1. Environment Variable Not Set in Render
**Symptom:** Console shows "Turnstile site key not configured. CAPTCHA will be disabled."

**Solution:**
1. Go to Render dashboard → Your frontend service
2. Environment tab → Add `VITE_TURNSTILE_SITE_KEY`
3. Value: `0x4AAAAAACAkALqygI36ZIdY`
4. **IMPORTANT:** Render will auto-redeploy after saving

### 2. Build Happened Before Environment Variable Was Set
**Symptom:** Variable is set in Render but widget still doesn't load.

**Why:** Vite replaces environment variables at BUILD TIME, not runtime.

**Solution:**
1. Ensure `VITE_TURNSTILE_SITE_KEY` is set in Render BEFORE the build
2. Or manually trigger a rebuild in Render after setting the variable
3. Check Render build logs to verify the variable is available during build

### 3. CSP (Content Security Policy) Blocking
**Symptom:** Console shows CSP errors about `challenges.cloudflare.com`

**Status:** ✅ Already configured in `index.html`
- `script-src` includes `https://challenges.cloudflare.com`
- `connect-src` includes `https://*.cloudflare.com`
- `frame-src` includes `https://challenges.cloudflare.com`

### 4. Hostname Not Registered in Cloudflare
**Symptom:** Widget loads but shows errors or doesn't verify

**Solution:** Ensure your Render domain is added to Cloudflare Turnstile widget hostnames:
- `penguin-shift-frontend-4.onrender.com` ✅ (already configured per your screenshot)

### 5. Script Loading Issues
**Symptom:** Network errors in browser console

**Check:**
- Browser DevTools → Network tab
- Look for failed requests to `challenges.cloudflare.com/turnstile/v0/api.js`
- Check if requests are blocked by ad blockers or browser extensions

## Verification Steps

1. **Check Environment Variable:**
   ```bash
   # In Render build logs, you should see the variable is available
   # The build process should not show errors about missing VITE_TURNSTILE_SITE_KEY
   ```

2. **Check Browser Console:**
   - Open DevTools → Console
   - Look for `[Turnstile]` debug messages (in development)
   - Should NOT see "Turnstile site key not configured" if properly set

3. **Check Network Tab:**
   - DevTools → Network
   - Filter by "turnstile" or "cloudflare"
   - Should see successful request to `challenges.cloudflare.com/turnstile/v0/api.js`

4. **Check DOM:**
   - DevTools → Elements
   - Find `<div id="captcha-register">` or `<div id="captcha-login">`
   - Should contain an iframe with `src` containing `challenges.cloudflare.com`

## Quick Fix Checklist

- [ ] `VITE_TURNSTILE_SITE_KEY` is set in Render frontend service
- [ ] Render has completed a rebuild after setting the variable
- [ ] Browser console shows no CSP errors
- [ ] Network tab shows successful Turnstile script load
- [ ] Container div exists in DOM (`#captcha-register` or `#captcha-login`)
- [ ] No ad blockers or browser extensions blocking Cloudflare

## Code Changes Summary

1. **Fixed environment variable access** - Now uses correct Vite pattern
2. **Added debug logging** - Better visibility into configuration issues
3. **Container always rendered** - Prevents timing issues
4. **Improved error handling** - Better user feedback

All changes are backward compatible and won't break existing functionality.

