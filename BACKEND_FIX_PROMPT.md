# Backend Fix Required: Public Playlist Transfer Endpoint

## Issue Summary

The `/api/transfer/publicPlaylist` endpoint is throwing a `NullPointerException` when processing public playlist transfers. The error occurs because the backend is trying to iterate over `playlistIds` which is `null` for public playlist transfers.

**Error:**
```
java.lang.NullPointerException: Cannot invoke "java.util.List.iterator()" because "playlistIds" is null
	at org.sahil.penguinshift.service.transfer.TransferService.handleYouTubeToSpotify(TransferService.java:285)
```

## What We're Trying to Accomplish

We've implemented a feature where users can:
1. Browse public playlists on the Explore page (`/explore`)
2. Click "Add to Library" on any public playlist
3. Choose a destination platform (Spotify or YouTube Music) and authorize
4. Enter playlist name, genre, and optionally make it public
5. Start a transfer that copies tracks from the public playlist to their own library

## Frontend Changes Made

### 1. New Flow Implementation
- **Route**: `/shift/public-destination` - Combined authorization and form page
- **Authorization**: Users select destination platform (Spotify/YouTube) and authorize via OAuth
- **Form**: After authorization, users enter:
  - Playlist name (required)
  - Description (optional)
  - Genre (required)
  - Public playlist option (optional, with name validation)
- **Transfer Start**: Calls `/api/transfer/publicPlaylist` endpoint

### 2. Payload Structure

The frontend sends the following payload to `/api/transfer/publicPlaylist`:

```json
{
  "sourcePlatform": "youtube",  // or "spotify" - the original platform of the public playlist
  "destinationPlatform": "spotify",  // or "youtube" - where user wants to transfer TO
  "playlistIds": null,  // ⚠️ NULL for public playlist transfers (not used)
  "createNew": true,
  "newPlaylistName": "My Transferred Playlist",
  "newPlaylistDescription": "Description here",
  "genre": "Pop",
  "makePublic": false,  // Whether to make the NEW playlist public
  "publicPlaylistName": null,  // Only set if makePublic is true
  "includeTracks": null,  // ⚠️ NULL for public playlist transfers
  "tracks": [  // ✅ Array of track objects from the public playlist
    {
      "sourceTrackId": "track_id_1",
      "sourceTrackTitle": "Song Title",
      "sourceTrackArtist": "Artist Name",
      "sourceTrackAlbum": "Album Name"
    },
    // ... more tracks
  ],
  "transferId": 123  // ✅ The original transfer ID that created this public playlist
}
```

### Key Differences from Regular Transfer:
- `playlistIds` is **null** (we don't have source playlist IDs, we have tracks directly)
- `includeTracks` is **null** (not applicable for public playlists)
- `tracks` array contains the track data directly from the public playlist
- `transferId` is the ID of the original transfer that created the public playlist

## Backend Fix Required

### Problem
The backend's `TransferService.handleYouTubeToSpotify()` (and likely `handleSpotifyToYouTube()`) is trying to iterate over `playlistIds` which is null for public playlist transfers.

### Solution
The `/api/transfer/publicPlaylist` endpoint should:

1. **Check if this is a public playlist transfer** (e.g., `playlistIds == null` and `transferId != null` and `tracks != null`)

2. **Use the `tracks` array directly** instead of fetching tracks from `playlistIds`

3. **Handle the transfer differently**:
   - Don't iterate over `playlistIds`
   - Use the `tracks` array provided in the request
   - The `transferId` can be used to reference the original public playlist if needed

### Expected Behavior

1. **Create the destination playlist** (✅ This is working - we see the playlist created on Spotify)
2. **Process tracks from the `tracks` array**:
   - Match each track from the `tracks` array to the destination platform
   - Add matched tracks to the created playlist
   - Track unmatched songs
3. **Update transfer status** as it progresses
4. **Return transfer ID** for status polling

### Code Location
The error occurs in:
- `TransferService.handleYouTubeToSpotify()` at line 285
- Likely also needs fix in `handleSpotifyToYouTube()` method

### Suggested Fix Pattern

```java
// In TransferService.startPublicPlaylist() or similar method
if (request.getPlaylistIds() == null && request.getTracks() != null) {
    // This is a public playlist transfer
    // Use tracks array directly instead of fetching from playlistIds
    List<Track> tracksToTransfer = request.getTracks();
    // Process tracks directly
} else {
    // Regular transfer - use existing logic with playlistIds
    // ... existing code
}
```

## Testing

After the fix, the flow should work as follows:

1. User selects public playlist → clicks "Add to Library"
2. User authorizes destination platform
3. User fills form and clicks "Start Transfer"
4. Backend creates playlist on destination platform ✅ (working)
5. Backend processes tracks from `tracks` array and matches them
6. Backend adds matched tracks to the playlist
7. Frontend polls `/api/transfer/{id}` to show progress
8. Transfer completes with matched/unmatched counts

## Current Status

- ✅ Frontend flow is complete and working
- ✅ Authorization works correctly
- ✅ Playlist creation on destination platform works
- ❌ Track processing fails with NullPointerException
- ❌ Transfer status shows as FAILED

## Additional Notes

- The `transferId` field in the payload refers to the **original transfer** that created the public playlist (for reference/audit purposes)
- The `tracks` array contains all the track information needed (sourceTrackId, title, artist, album)
- The destination platform should match tracks by title/artist/album, similar to regular transfers

