# API Configuration

The frontend now supports both local development and production backend URLs.

## Automatic Detection

The API base URL is automatically determined based on your environment:

1. **Environment Variable** (highest priority): If `VITE_API_BASE` is set in `.env.local`, it will be used
2. **Production Detection**: If accessed from a non-localhost URL, it uses `https://penguinshift-backend.up.railway.app`
3. **Local Development**: Defaults to `http://127.0.0.1:8080` when running on localhost

## Configuration Files

### For Local Development

Create a `.env.local` file in the project root:

```env
VITE_API_BASE=http://127.0.0.1:8080
```

### For Production

The app automatically uses `https://penguinshift-backend.up.railway.app` when deployed.

To override, set in your deployment environment:
```env
VITE_API_BASE=https://penguinshift-backend.up.railway.app
```

## Updated Files

All files now use the centralized `getApiBase()` function from `src/utils/apiConfig.ts`:

- `src/components/shift/apiClient.ts`
- `src/api/transferHistory.ts`
- `src/context/AuthContext.tsx`
- `src/components/profile/AccountSettings.tsx`
- `src/pages/Auth/AuthRouter/AuthRouter.tsx`
- `src/pages/Auth/LoginPage.tsx`
- `src/pages/Auth/RegisterPage.tsx`
- `src/pages/Auth/ForgotPasswordPage.tsx`
- `src/pages/Auth/ResetPasswordPage.tsx`
- `src/pages/Auth/VerifyEmailPage.tsx`
- `src/pages/Auth/ResendVerificationPage.tsx`
- `src/pages/Shift/SelectPlaylist.tsx`

## Usage

Import and use in any file:

```typescript
import { getApiBase } from '@/utils/apiConfig'

const API_BASE = getApiBase()
fetch(`${API_BASE}/api/endpoint`)
```
