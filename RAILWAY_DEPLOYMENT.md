# Railway Deployment Guide

## Environment Variables for Railway

When deploying your frontend to Railway, you need to set the following environment variables in your Railway project settings:

### Required Environment Variables

#### 1. `VITE_TURNSTILE_SITE_KEY` (Required)
Your Cloudflare Turnstile site key for captcha verification on login/register pages.

**How to get it:**
- Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
- Navigate to Turnstile
- Create or select a site
- Copy the **Site Key** (public key)

**Set in Railway:**
```
VITE_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key-here
```

### Optional Environment Variables

#### 2. `VITE_API_BASE` (Optional - Auto-detected)
The backend API base URL. **This is optional** because:
- If not set, the app automatically detects production and uses `https://penguinshift-backend.up.railway.app`
- Only set this if you need to override the default behavior

**Set in Railway (optional):**
```
VITE_API_BASE=https://penguinshift-backend.up.railway.app
```

## How to Set Environment Variables in Railway

1. Go to your Railway project dashboard
2. Select your frontend service
3. Click on the **"Variables"** tab
4. Click **"New Variable"**
5. Add each variable:
   - Key: `VITE_TURNSTILE_SITE_KEY`
   - Value: Your Cloudflare Turnstile site key
   - (Optional) Key: `VITE_API_BASE`
   - (Optional) Value: `https://penguinshift-backend.up.railway.app`
6. Click **"Add"** for each variable
7. Railway will automatically rebuild your app with the new variables

## Summary

**Minimum Required:**
- ✅ `VITE_TURNSTILE_SITE_KEY` - Your Cloudflare Turnstile site key

**Recommended (but auto-detected):**
- ⚠️ `VITE_API_BASE` - Set to `https://penguinshift-backend.up.railway.app` (optional, will auto-detect if not set)

## How Auto-Detection Works

The app automatically detects the environment:
- **Localhost** (`localhost` or `127.0.0.1`): Uses `http://127.0.0.1:8080`
- **Production** (any other domain): Uses `https://penguinshift-backend.up.railway.app`
- **Manual Override**: If `VITE_API_BASE` is set, it uses that value

## Important Notes

1. **Vite Environment Variables**: All Vite env vars must be prefixed with `VITE_` to be accessible in the browser
2. **Build Time**: These variables are embedded at **build time**, not runtime. You need to redeploy after changing them.
3. **Public Variables**: These variables will be visible in your built JavaScript bundle (they're public, which is fine for site keys)

## Testing After Deployment

After deploying with these variables:
1. ✅ Login page should show Cloudflare Turnstile captcha
2. ✅ Register page should show Cloudflare Turnstile captcha
3. ✅ API calls should go to `https://penguinshift-backend.up.railway.app`
4. ✅ Check browser console for any errors

