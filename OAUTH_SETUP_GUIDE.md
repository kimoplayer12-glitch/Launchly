# OAuth Setup Guide - TikTok, Instagram, Twitter

## Quick Start

This guide shows you how to set up real OAuth to connect TikTok, Instagram, and Twitter accounts to your Social Media Scheduler.

## What Happens During OAuth

```
User clicks "Connect Instagram"
        ↓
Frontend redirects to Instagram login
        ↓
User authorizes your app
        ↓
Instagram redirects back to your server with authorization code
        ↓
Server exchanges code for access token
        ↓
Server saves encrypted token to Firebase
        ↓
Frontend redirects back to scheduler
        ↓
User sees "Connected!" message
```

## Step 1: Register Your Apps

### A) Instagram/Meta Setup

1. Go to https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Choose "Consumer" → Click "Next"
4. Pick "Social Media App" and click "Next"
5. Fill in app name, app contact email, app purpose
6. Complete setup
7. Add "Instagram Graph API" product
8. Go to Settings → Basic
9. Copy **App ID** and **App Secret**

**Configure OAuth Redirect:**
1. Go to Instagram Basic Display → Settings
2. Add Valid OAuth Redirect URIs:
   ```
   http://localhost:8081/api/social/oauth/callback
   https://yourdomain.com/api/social/oauth/callback  (for production)
   ```
3. Save changes

### B) TikTok Setup

1. Go to https://developers.tiktok.com/
2. Click "Applications" → "Create an application"
3. Fill in app name and description
4. Accept terms and create app
5. Get **Client Key** and **Client Secret** from settings

**Configure OAuth Redirect:**
1. Go to app settings
2. Add Redirect URLs:
   ```
   http://localhost:8081/api/social/oauth/callback
   https://yourdomain.com/api/social/oauth/callback  (for production)
   ```

### C) Twitter Setup

1. Go to https://developer.twitter.com/
2. Go to "Standalone Apps" → "Create App"
3. Fill in app details and use case
4. Accept terms and create
5. Go to "Keys and tokens" tab
6. Copy **API Key** (as Client ID) and **API Key Secret** (as Client Secret)

**Configure OAuth Redirect:**
1. Go to App Settings → Authentication Settings
2. Enable "3-legged OAuth"
3. Add Redirect URIs:
   ```
   http://localhost:8081/api/social/oauth/callback
   https://yourdomain.com/api/social/oauth/callback  (for production)
   ```
4. Save

## Step 2: Add Environment Variables

Create `.env` file in your project root (copy from `.env.example`):

```bash
# Instagram/Meta
INSTAGRAM_CLIENT_ID=your_instagram_app_id_here
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret_here

# TikTok
TIKTOK_CLIENT_ID=your_tiktok_client_key_here
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret_here

# Twitter
TWITTER_CLIENT_ID=your_twitter_api_key_here
TWITTER_CLIENT_SECRET=your_twitter_api_secret_here

# OAuth Redirect (change for production)
OAUTH_REDIRECT_URI=http://localhost:8081/api/social/oauth/callback

# Token Encryption (generate a random 32-char hex string)
ENCRYPTION_KEY=your_32_character_hex_encryption_key
```

**To generate ENCRYPTION_KEY:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy output and paste as ENCRYPTION_KEY value.

## Step 3: Install Dependencies

Make sure you have axios and firebase-admin installed:

```bash
pnpm add axios dotenv
pnpm add -D @types/node
```

## Step 4: Restart Server

```bash
# Kill current server (Ctrl+C)
# Then restart:
pnpm dev
```

## Step 5: Test the OAuth Flow

1. Go to http://localhost:8081/social-media-scheduler
2. Click "Connect" on any platform
3. You should be redirected to that platform's login
4. Log in and authorize the app
5. Should redirect back with "Connected!" message
6. Check Firebase Console to see the saved token

## How It Works

### Backend Flow

**File**: `server/routes/social-media-scheduler.ts`

When user clicks "Connect":

```typescript
// 1. Frontend requests OAuth URL
GET /api/social/oauth-url?platform=instagram&userId=user123
// Response: { url: "https://api.instagram.com/oauth/authorize?..." }

// 2. User logs in at platform, grants permission

// 3. Platform redirects back to:
GET /api/social/oauth/callback?code=xyz&state=abc

// 4. Backend exchanges code for token
POST https://graph.instagram.com/v18.0/oauth/access_token
Body: {
  client_id: "YOUR_APP_ID",
  client_secret: "YOUR_APP_SECRET",
  code: "xyz",
  grant_type: "authorization_code"
}
// Response: { access_token: "token", expires_in: 5184000 }

// 5. Backend saves encrypted token to Firebase
/users/{userId}/socialAccounts/instagram
{
  id: "instagram_user123",
  username: "@myaccount",
  accessToken: "[ENCRYPTED]",
  connectedAt: 1704067200000
}

// 6. Frontend redirects back to scheduler
GET /social-media-scheduler?connected=instagram
```

### Frontend Flow

**File**: `client/pages/SocialMediaScheduler.tsx`

```typescript
const handleConnectAccount = async (platform) => {
  // 1. Get OAuth URL from backend
  const response = await fetch(
    `/api/social/oauth-url?platform=${platform}&userId=${user.uid}`
  );
  const { url } = await response.json();

  // 2. Redirect to platform login
  window.location.href = url;

  // 3. After user logs in and authorizes:
  // Platform redirects to /api/social/oauth/callback
  // Backend processes and saves token
  // Backend redirects back to /social-media-scheduler?connected=instagram

  // 4. Frontend detects URL param and reloads accounts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected')) {
      loadAccounts(); // Reload from Firebase
      showToast("Connected!");
    }
  }, []);
};
```

### Token Storage

Tokens are:
- Encrypted with AES-256 before saving
- Stored in Firebase Realtime Database
- Scoped to each user
- Not accessible from frontend

**Encrypted token format:**
```
iv_in_hex:encrypted_token_in_hex
```

## Production Checklist

Before deploying to production:

### Security
- [ ] Change all redirect URIs to production domain
- [ ] Use strong ENCRYPTION_KEY (not dev key)
- [ ] Enable Firebase security rules to protect tokens
- [ ] Use HTTPS everywhere
- [ ] Store secrets in environment variables (not in code)
- [ ] Rotate keys periodically

### Platforms
- [ ] Instagram: Request "user_media" permission
- [ ] TikTok: Request "video.upload" scope
- [ ] Twitter: Request "tweet.write" scope

### Testing
- [ ] Test with real platform accounts
- [ ] Test OAuth flow end-to-end
- [ ] Test token refresh (if supported)
- [ ] Test error scenarios
- [ ] Verify tokens save to Firebase
- [ ] Test on production domain

### Deployment
- [ ] Update all environment variables
- [ ] Update OAuth redirect URIs in each platform's settings
- [ ] Test OAuth flow on production domain
- [ ] Monitor logs for errors
- [ ] Set up token refresh job (Phase 2)

## Troubleshooting

### "Invalid Client ID" Error

**Issue**: Platform says your app ID is invalid

**Solutions**:
- Verify Client ID matches platform settings exactly
- Check for extra spaces or typos
- Ensure environment variable is loaded: `echo $INSTAGRAM_CLIENT_ID`
- Restart server after changing .env

### "Redirect URI mismatch"

**Issue**: Platform says redirect URL doesn't match

**Solutions**:
- Exact match required: `http://localhost:8081/api/social/oauth/callback`
- No trailing slash
- Check platform settings match your .env OAUTH_REDIRECT_URI
- For production, update both .env and platform settings

### "Access Token Expired"

**Issue**: Token works at first, then stops working

**Solutions** (Phase 2):
- Implement token refresh endpoint
- Check `expiresAt` field in Firebase
- Refresh before token expires

### Token Not Saving to Firebase

**Issue**: Authentication succeeds but no token in Firebase

**Solutions**:
- Check Firebase has read/write permissions
- Verify user UID is correct
- Check Firebase Rules allow writes
- Check browser console for errors
- Check server logs for errors

### Can't Get User Info After Auth

**Issue**: Token saved but username shows as undefined

**Solutions**:
- Verify API endpoint URL is correct
- Check API documentation for user info endpoint
- Some platforms require additional scopes
- Test API call manually with Postman

## API Reference

### Get OAuth URL

```
GET /api/social/oauth-url?platform=instagram&userId=user123
```

**Response:**
```json
{
  "success": true,
  "url": "https://api.instagram.com/oauth/authorize?...",
  "state": "random_state_for_security"
}
```

### OAuth Callback

```
GET /api/social/oauth/callback?platform=instagram&code=xyz&state=abc
```

Backend handles this. Redirects to:
```
/social-media-scheduler?connected=instagram
```

Or on error:
```
/social-media-scheduler?error=Error%20message
```

## Next Steps

1. **Set up OAuth** (this guide) - Get tokens from platforms
2. **Test scheduling** - Posts save with real tokens
3. **Build auto-publishing** (Phase 2) - Cloud Functions execute posts
4. **Add analytics** (Phase 3) - Track engagement

## Useful Links

- **Instagram Graph API**: https://developers.facebook.com/docs/instagram-graph-api
- **TikTok Open API**: https://developers.tiktok.com/doc/open-api-overview
- **Twitter API v2**: https://developer.twitter.com/en/docs/twitter-api
- **OAuth 2.0 Spec**: https://oauth.net/2/
- **Firebase Security Rules**: https://firebase.google.com/docs/rules

## Questions?

Check the [SCHEDULER_ROADMAP.md](./SCHEDULER_ROADMAP.md) for Phase 1 implementation details.

---

**Key Files Modified**:
- `server/routes/social-media-scheduler.ts` - OAuth endpoints
- `client/pages/SocialMediaScheduler.tsx` - OAuth redirect flow
- `.env.example` - Environment variables
