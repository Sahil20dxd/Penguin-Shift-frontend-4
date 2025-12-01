# Google OAuth Scope Usage Explanation for Verification

## Application Overview
**PenguinShift** is a music playlist transfer service that enables users to migrate their playlists between different music streaming platforms (Spotify and YouTube Music). Our service helps users preserve their music collections when switching between platforms.

---

## Scope: `https://www.googleapis.com/auth/youtube.readonly`

### Purpose
This scope is used to **read** the user's YouTube playlists and playlist items (videos) when YouTube Music is the **source platform** for transfers.

### How It's Used

1. **Listing User's Playlists**
   - **API Endpoint:** `GET /youtube/v3/playlists?part=snippet,contentDetails&mine=true`
   - **Purpose:** Retrieve a list of all playlists owned by the authenticated user
   - **Data Accessed:** Playlist IDs, titles, descriptions, and item counts
   - **Use Case:** When a user wants to transfer FROM YouTube Music TO Spotify, they need to select which playlists to transfer. We display their available playlists for selection.

2. **Reading Playlist Contents**
   - **API Endpoint:** `GET /youtube/v3/playlistItems?part=snippet,contentDetails&playlistId={playlistId}`
   - **Purpose:** Retrieve all videos/tracks within a specific playlist
   - **Data Accessed:** Video IDs, titles, and metadata for each track in the playlist
   - **Use Case:** To extract track information (title, artist) from YouTube playlists so we can search for matching tracks on the destination platform (Spotify)

### Why This Scope Is Necessary
- Users must be able to see and select their existing YouTube playlists to transfer
- We need to read playlist contents to identify individual tracks for matching
- This is essential for the core functionality: transferring FROM YouTube Music

### Data Handling
- Playlist data is only accessed during active transfer operations initiated by the user
- We do not store playlist contents permanently; data is processed in-memory during transfers
- Users can disconnect their YouTube account at any time, which revokes all access

---

## Scope: `https://www.googleapis.com/auth/youtube`

### Purpose
This scope is used to **create playlists** and **add videos** to playlists when YouTube Music is the **destination platform** for transfers.

### How It's Used

1. **Creating New Playlists**
   - **API Endpoint:** `POST /youtube/v3/playlists?part=snippet,status`
   - **Purpose:** Create a new playlist on the user's YouTube Music account
   - **Data Modified:** Creates a new playlist with user-specified name and description
   - **Use Case:** When transferring FROM Spotify TO YouTube Music, we create a new playlist on YouTube to hold the transferred tracks

2. **Adding Videos to Playlists**
   - **API Endpoint:** `POST /youtube/v3/playlistItems?part=snippet`
   - **Purpose:** Add individual videos (tracks) to a playlist
   - **Data Modified:** Adds videos to the user's playlist
   - **Use Case:** After matching Spotify tracks to YouTube videos, we add the matched videos to the newly created playlist

3. **Searching for Videos**
   - **API Endpoint:** `GET /youtube/v3/search?part=snippet&type=video&q={query}`
   - **Purpose:** Search YouTube for videos matching track titles/artists from the source platform
   - **Data Accessed:** Public video metadata (titles, descriptions) to find matching tracks
   - **Use Case:** When transferring FROM Spotify TO YouTube, we search YouTube for videos that match each Spotify track, then add the best matches to the destination playlist

### Why This Scope Is Necessary
- Users need playlists created on their YouTube Music account to receive transferred tracks
- We must add videos to playlists to complete the transfer process
- This is essential for the core functionality: transferring TO YouTube Music

### Data Handling
- We only create playlists and add videos when explicitly requested by the user during a transfer
- Playlists are created as private by default (unless user explicitly chooses public)
- Users maintain full control over their playlists and can delete them at any time
- We do not modify existing playlists without user consent

---

## User-Facing Descriptions

### For `youtube.readonly`:
**"View your YouTube activity"** - We need to read your YouTube Music playlists and their contents so you can select which playlists to transfer to other platforms.

### For `youtube`:
**"Manage your YouTube account"** - We need to create new playlists and add videos to them on your YouTube Music account when transferring playlists from other platforms.

---

## Security and Privacy

- **OAuth 2.0:** All access is granted through Google's OAuth 2.0 flow with explicit user consent
- **Token Storage:** Access tokens are securely stored and encrypted
- **Limited Access:** We only access data necessary for playlist transfers
- **User Control:** Users can revoke access at any time through their Google account settings
- **No Data Sharing:** We never share user playlist data with third parties
- **Transparency:** Users see exactly what data is being accessed during each transfer operation

---

## Compliance

- We have implemented Privacy Policy and Terms of Service pages
- Links to these policies are displayed on login/register pages and in the footer
- All data access is logged for audit purposes
- We comply with Google's API Services User Data Policy

---

## Example User Flow

1. **User connects YouTube account** → OAuth consent screen requests both scopes
2. **User initiates transfer FROM YouTube TO Spotify:**
   - Uses `youtube.readonly` to list playlists and read track data
   - Transfers data to Spotify (no YouTube write operations)
3. **User initiates transfer FROM Spotify TO YouTube:**
   - Uses `youtube` to create new playlist and add matched videos
   - Uses `youtube.readonly` to verify playlist creation (optional)

---

## Contact Information

For questions about our use of these scopes, please contact:
- Email: penguinshift42@gmail.com
- Privacy Policy: [Your Domain]/privacy-policy
- Terms of Service: [Your Domain]/terms-of-service

