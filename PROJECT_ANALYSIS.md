# PenguinShift - Complete Project Analysis

## 📋 Project Overview

**PenguinShift** is a full-stack web application for transferring music playlists between Spotify and YouTube Music platforms. The project enables users to seamlessly migrate their playlists, discover public playlists, and manage their music library across platforms.

---

## 🏗️ Architecture

### **Technology Stack**

#### **Frontend** (React + TypeScript)
- **Framework**: React 18.2.0 with TypeScript 5.9.2
- **Build Tool**: Vite 7.1.7
- **Routing**: React Router DOM 7.9.1
- **UI Components**: 
  - Radix UI (Dialog, Toast, Select, Switch, etc.)
  - Tailwind CSS 4.1.13
  - Framer Motion 12.23.22 (animations)
  - Lucide React (icons)
- **State Management**: React Context API
- **HTTP Client**: Native Fetch API
- **Security**: Cloudflare Turnstile (CAPTCHA)

#### **Backend** (Java Spring Boot)
- **Framework**: Spring Boot 3.5.5
- **Language**: Java 17
- **Database**: MySQL (Railway hosted)
- **Security**: 
  - Spring Security
  - JWT (JSON Web Tokens)
  - OAuth2 (Google)
  - BCrypt password hashing
- **APIs**: RESTful
- **Email**: Spring Mail (Gmail SMTP)
- **Logging**: SLF4J with Logback
- **Build Tool**: Maven

---

## 📁 Project Structure

### **Frontend Structure**
```
Front-end/
├── src/
│   ├── api/                    # API client functions
│   │   ├── publicPlaylists.ts
│   │   └── transferHistory.ts
│   ├── components/
│   │   ├── explore/            # Public playlist exploration
│   │   ├── profile/            # User profile components
│   │   ├── shift/              # Transfer flow components
│   │   └── ui/                 # Reusable UI components
│   ├── context/                # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── useAuth.ts
│   ├── hooks/                  # Custom React hooks
│   │   ├── useContentModeration.tsx
│   │   ├── useToast.tsx
│   │   └── usePageTitle.tsx
│   ├── pages/
│   │   ├── Auth/               # Authentication pages
│   │   ├── Dashboard/
│   │   ├── Profile/
│   │   ├── Shift/              # Transfer workflow pages
│   │   ├── LandingPage/
│   │   └── ExplorePublicPlaylists.tsx
│   ├── utils/
│   │   ├── apiConfig.ts
│   │   ├── contentModeration.ts
│   │   └── security/
│   │       └── turnstile.ts
│   └── types/                  # TypeScript type definitions
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### **Backend Structure**
```
Back-end/capstone-project-Sahil20dxd/
├── src/main/java/org/sahil/penguinshift/
│   ├── aspect/                 # AOP logging
│   ├── config/                 # Spring configuration
│   │   ├── SecurityConfig.java
│   │   ├── HttpConfig.java
│   │   └── AsyncConfig.java
│   ├── controller/             # REST controllers
│   │   ├── auth/
│   │   ├── platform/
│   │   ├── playlist/
│   │   ├── publicPlaylist/
│   │   ├── security/
│   │   └── transfer/
│   ├── dto/                    # Data Transfer Objects
│   ├── model/                  # Entity models
│   ├── repository/             # Data access layer
│   ├── service/                # Business logic
│   │   ├── auth/
│   │   ├── platform/
│   │   ├── publicPlaylist/
│   │   ├── security/
│   │   └── transfer/
│   ├── security/               # Security components
│   │   ├── captcha/
│   │   ├── BruteForceGuard.java
│   │   ├── JwtAuthFilter.java
│   │   └── SimpleRateLimitFilter.java
│   └── util/                   # Utility classes
├── src/main/resources/
│   ├── application.properties
│   ├── schema.sql
│   └── templates/              # Email templates
└── pom.xml
```

---

## 🗄️ Database Schema

### **Core Tables**

1. **users**
   - User accounts (local + OAuth)
   - Fields: id, username, email, password_hash, role, verified, created_at

2. **email_verification_tokens**
   - Email verification workflow
   - Fields: id, email, token, expires_at

3. **password_reset_tokens**
   - Password reset workflow
   - Fields: id, email, token, expires_at

4. **email_change_tokens** & **email_change_history**
   - Email change workflow with audit trail

5. **oauth_connections**
   - Platform OAuth tokens (Spotify/YouTube)
   - Fields: user_id, platform, access_token, refresh_token, expires_at

6. **transfers**
   - Active transfer jobs
   - Fields: id, user_id, source_platform, destination_platform, status, percent, phase, processed, total, matched, unmatched

7. **transfer_items**
   - Individual tracks in a transfer
   - Fields: id, transfer_id, src_playlist_id, track_title, track_artist, is_matched, suggested_match

8. **transfer_history**
   - Completed transfer records
   - Fields: id, user_id, transfer_id, source_platform, destination_platform, source_playlist_id, destination_playlist_id, total_tracks, matched_tracks, unmatched_tracks, genre, is_public, public_playlist_id

9. **transfer_history_tracks**
   - Detailed track matching records
   - Fields: id, transfer_history_id, source_track_id, destination_track_id, track metadata

10. **public_playlists**
    - Publicly shared playlists
    - Fields: id, user_id, transfer_id, owner_name, owner_email, platform, title, genre, track_count, is_public, public_slug, cover_url
    - **Unique constraint on `title`** (enforces unique playlist names)

---

## 🔐 Authentication & Security

### **Authentication Methods**

1. **Local Authentication**
   - Email/Username + Password
   - Email verification required
   - Password reset via email

2. **OAuth2 (Google)**
   - Google Sign-In integration
   - Automatic account creation
   - Email verification bypassed

### **Security Features**

1. **JWT Tokens**
   - Access token: 15 minutes (cookie: `PS_ACCESS`)
   - Refresh token: 7 days (cookie: `PS_REFRESH`)
   - HttpOnly cookies for XSS protection

2. **CAPTCHA (Cloudflare Turnstile)**
   - Registration protection
   - Login protection (via BruteForceGuard)
   - Configurable via `security.captcha.enabled`

3. **Brute Force Protection**
   - `BruteForceGuard`: Tracks failed login attempts
   - Account lockout after multiple failures
   - Rate limiting via `SimpleRateLimitFilter`

4. **Content Moderation**
   - Client-side: Real-time validation with debouncing
   - Server-side: **MISSING** (needs implementation)
   - Regex-based profanity detection

5. **CORS Configuration**
   - Configured for frontend origin
   - Credentials enabled
   - Preflight caching (1 hour)

---

## 🎵 Core Features

### **1. Playlist Transfer**

**Flow:**
1. User selects source platform (Spotify/YouTube)
2. User selects playlists to transfer
3. User authorizes destination platform
4. User configures transfer options:
   - Create new playlist or use existing
   - Playlist name, description, genre
   - Make public option
5. Transfer starts (async job)
6. Real-time progress polling
7. Results page with matched/unmatched tracks

**Endpoints:**
- `POST /api/transfers/start` - Start transfer
- `GET /api/transfers/{id}/status` - Get transfer status
- `GET /api/transfers/{id}` - Get transfer details

### **2. Public Playlists (Explore)**

**Features:**
- Browse public playlists
- Filter by genre, platform, search
- Pagination
- View playlist details
- Transfer public playlists to your account

**Endpoints:**
- `GET /api/public-playlists` - List public playlists (public)
- `GET /api/public-playlists/{id}` - Get playlist details
- `POST /api/public-playlists` - Create public playlist
- `PUT /api/public-playlists/{id}/visibility` - Toggle visibility
- `GET /api/public-playlists/check-name?name={name}` - Check name availability

### **3. Transfer History**

**Features:**
- View all completed transfers
- Track matching statistics
- Export to PDF/CSV
- Link to public playlists

**Endpoints:**
- `GET /api/transfer-history` - List user's transfer history
- `GET /api/transfer-history/{id}` - Get transfer details
- `GET /api/transfer-history/{id}/export?format=pdf|csv` - Export transfer

### **4. User Profile**

**Features:**
- Account settings (username, email)
- Password management
- Transfer history
- Public playlists management
- Account deletion

**Endpoints:**
- `GET /auth/me` - Get current user
- `PUT /auth/update` - Update username/email
- `POST /auth/logout` - Logout

---

## 🔄 API Integration

### **Spotify API**
- OAuth2 flow
- Playlist CRUD operations
- Track search and matching
- Client: `SpotifyClient.java`

### **YouTube Music API**
- OAuth2 flow (via Google)
- Playlist CRUD operations
- Track search and matching
- Client: `YouTubeClient.java`

### **Platform Client Architecture**
- `ProviderClient` interface
- `PlatformClientRegistry` for client management
- `MusicPlatformClient` abstraction
- `OAuthTokenService` for token management

---

## 📧 Email System

**Email Templates:**
- `verification_email.html` - Email verification
- `password_reset_email.html` - Password reset
- `email_change_verify.html` - Email change verification

**Configuration:**
- SMTP: Gmail (smtp.gmail.com:587)
- Sender: penguinshift42@gmail.com
- App password authentication

---

## 🚀 Deployment

### **Frontend**
- **Build**: `npm run build` (Vite)
- **Preview**: `npm run preview`
- **Dev Server**: `npm run dev` (port 5173)

### **Backend**
- **Build**: Maven (`mvn clean package`)
- **Run**: `java -jar target/*.jar`
- **Port**: 8080
- **Database**: MySQL on Railway

### **Environment Variables**

**Frontend:**
- `VITE_API_BASE` - Backend API URL
- `VITE_TURNSTILE_SITE_KEY` - Turnstile site key

**Backend:**
- Database credentials (Railway)
- JWT secret
- OAuth credentials (Google, Spotify, YouTube)
- SMTP credentials
- Turnstile secret

---

## 🔍 Key Components Analysis

### **Frontend**

1. **AuthContext** (`context/AuthContext.tsx`)
   - Manages authentication state
   - Handles JWT tokens (localStorage + cookies)
   - Provides `authFetch` for authenticated requests

2. **ShiftContext** (`components/shift/ShiftContext.tsx`)
   - Manages transfer workflow state
   - Persists selected playlists, platform choices

3. **Content Moderation** (`utils/contentModeration.ts`)
   - Client-side profanity filtering
   - Debounced validation (500ms)
   - Regex-based pattern matching
   - **Issue**: No server-side validation

4. **Turnstile Integration** (`utils/security/turnstile.ts`)
   - Cloudflare Turnstile widget loading
   - Token management
   - Error handling

### **Backend**

1. **SecurityConfig** (`config/SecurityConfig.java`)
   - Spring Security configuration
   - JWT filter chain
   - OAuth2 login configuration
   - CORS setup

2. **AuthRegistrationService** (`service/auth/AuthRegistrationService.java`)
   - User registration logic
   - Email verification token generation
   - OAuth user creation
   - **Missing**: Content moderation validation

3. **TransferService** (`service/transfer/TransferService.java`)
   - Async transfer processing
   - Track matching algorithm
   - Progress tracking
   - Playlist creation

4. **BruteForceGuard** (`security/BruteForceGuard.java`)
   - Failed login attempt tracking
   - Account lockout logic
   - Rate limiting

---

## ⚠️ Known Issues & Improvements Needed

### **Critical**

1. **Server-Side Content Moderation Missing**
   - Client-side can be bypassed
   - Need: `ContentModerationUtil.java` in backend
   - Integration points:
     - `AuthRegistrationService.register()` (line 74-83)
     - `AuthLoginController.updateUsernameAndEmail()` (line 172)

2. **Database Credentials in Code**
   - `application.properties` contains production credentials
   - Should use environment variables

### **High Priority**

1. **Error Handling**
   - Some endpoints lack comprehensive error handling
   - Frontend error messages could be more user-friendly

2. **Input Validation**
   - Backend DTOs lack validation annotations
   - Should use `@Valid` and Bean Validation

3. **Logging**
   - Some sensitive data might be logged
   - Need to sanitize logs

### **Medium Priority**

1. **Testing**
   - No test files found (except basic Spring Boot test)
   - Need unit tests for services
   - Need integration tests for controllers

2. **Documentation**
   - API documentation missing (Swagger/OpenAPI)
   - Code comments could be more comprehensive

3. **Performance**
   - Transfer polling interval (1200ms) could be optimized
   - Database queries could be optimized with indexes

---

## 📊 Statistics

### **Codebase Size**

**Frontend:**
- ~50+ React components
- ~15 pages
- ~10 utility modules
- TypeScript strict mode enabled

**Backend:**
- ~30+ Java classes
- ~10 controllers
- ~15 services
- ~10 repositories
- ~8 models

### **Database**
- 10 tables
- Foreign key relationships
- Indexes on frequently queried columns
- Unique constraints on critical fields

---

## 🎯 Project Strengths

1. **Clean Architecture**
   - Separation of concerns (Controller → Service → Repository)
   - Modular frontend structure
   - Reusable components

2. **Security**
   - JWT authentication
   - OAuth2 integration
   - CAPTCHA protection
   - Brute force prevention

3. **User Experience**
   - Real-time transfer progress
   - Toast notifications
   - Loading states
   - Error handling

4. **Features**
   - Multi-platform support (Spotify, YouTube)
   - Public playlist sharing
   - Transfer history
   - Export functionality

---

## 🔮 Future Enhancements

1. **Additional Platforms**
   - Apple Music
   - Amazon Music
   - Tidal

2. **Advanced Features**
   - Playlist merging
   - Duplicate detection
   - Smart matching improvements
   - Batch transfers

3. **Social Features**
   - Playlist comments
   - User profiles
   - Follow system

4. **Analytics**
   - Transfer statistics dashboard
   - Popular playlists
   - Genre trends

---

## 📝 Notes

- **Project Name**: PenguinShift
- **Purpose**: Music playlist transfer platform
- **Tech Stack**: React + TypeScript (Frontend) | Spring Boot + Java (Backend)
- **Database**: MySQL (Railway)
- **Deployment**: Railway (Backend) | Vercel/Netlify (Frontend - assumed)

---

**Last Updated**: 2025-01-22
**Analysis Version**: 1.0

