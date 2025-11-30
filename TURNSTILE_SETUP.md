# Turnstile CAPTCHA Setup Guide

## Environment Variables Required

### Frontend (Render)
Set this environment variable in your **Render frontend service**:

```
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACAkALqygI36ZIdY
```

**How to set in Render:**
1. Go to your Render dashboard
2. Select your frontend service: `penguin-shift-frontend-4`
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Key: `VITE_TURNSTILE_SITE_KEY`
6. Value: `0x4AAAAAACAkALqygI36ZIdY`
7. Click **Save Changes**
8. Render will automatically redeploy

### Backend (Render)
Set this environment variable in your **Render backend service**:

```
TURNSTILE_SECRET=0x4AAAAAACAkAD_0NZNuRdP3lJo5dtJptSY
```

**How to set in Render:**
1. Go to your Render dashboard
2. Select your backend service: `penguinshift-backend-v5`
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Key: `TURNSTILE_SECRET`
6. Value: `0x4AAAAAACAkAD_0NZNuRdP3lJo5dtJptSY`
7. Click **Save Changes**
8. Render will automatically redeploy

## Local Development

For local development, create a `.env.local` file in the frontend root directory:

```bash
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACAkALqygI36ZIdY
```

**Note:** `.env.local` is gitignored and will not be committed to the repository.

## Verification

After setting the environment variables:

1. **Frontend:** Visit the sign-up page - you should see the Turnstile CAPTCHA widget
2. **Backend:** Check logs - should see "Turnstile verification enabled"
3. **Test:** Try registering a new account - CAPTCHA should work

## Troubleshooting

- **Widget not showing:** Check that `VITE_TURNSTILE_SITE_KEY` is set in Render
- **CAPTCHA verification fails:** Check that `TURNSTILE_SECRET` is set in backend
- **Console errors:** Check browser console for Turnstile-related errors

