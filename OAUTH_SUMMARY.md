You are building one feature module inside a larger SaaS app called Launchly.

Launchly is an AI-powered startup operating system. It has many tools, but this task is ONLY for the AI Website Generator feature.

This feature must be simple, fun, fast, and not overwhelming. The user should feel excited, not confused.

⸻

🎯 Goal of This Feature

Allow users to:
	1.	Type a prompt describing their business
	2.	Instantly generate a full website using AI
	3.	Preview the website inside Launchly
	4.	Click Publish to make it live on the internet using Vercel

No complicated settings. No technical jargon.

⸻

🧩 USER EXPERIENCE FLOW

Step 1 — Prompt Input (Simple & Fun)

The page should have:
	•	A large friendly input box:
“Describe your business…”
	•	Example placeholder text:
“A futuristic fitness app for busy professionals”

Below it:
	•	Style selector (Modern / Futuristic / Minimal / Luxury)
	•	Button: ✨ Generate My Website

UI should feel playful and exciting, not technical.

⸻

Step 2 — Generation (Loading State)

When user clicks Generate:
	•	Show animated loading state:
“🚀 Building your website…”
	•	Progress steps like:
	•	Writing content…
	•	Designing layout…
	•	Preparing preview…

No technical details shown.

⸻

Step 3 — Preview (Main Focus)

When done, show the website in a large preview iframe.

Preview section must be the primary focus of the screen.

Above preview show buttons:
	•	🌍 Open in new tab
	•	🔁 Regenerate
	•	🚀 Publish

The preview should feel like the user already has a website.

⸻

Step 4 — Code Section (Optional & Secondary)

Below or in a side panel:

Button: View Code

When clicked, show:
	•	File list (index.html, styles.css, main.js, etc.)
	•	Read-only code viewer
	•	Buttons:
	•	Copy file
	•	Download ZIP

This section should NOT distract from the preview.

⸻

⚙️ TECHNICAL FLOW

1️⃣ Generate Website

Frontend sends:
POST /api/websites/generate

Backend:
	•	Sends user prompt to AI
	•	AI returns full website files (HTML/CSS/JS)
	•	Save files as a draft site
	•	Return:
{
siteId,
previewUrl: /preview/:siteId/index.html
}

⸻

2️⃣ Preview

Backend must serve draft files from:
GET /preview/:siteId/*

Frontend loads preview in iframe.

⸻

3️⃣ Publish to Vercel

When user clicks Publish:

Frontend calls:
POST /api/websites/:siteId/publish

Backend:
	•	Takes saved files
	•	Uses Vercel Deploy API
	•	Deploys static site
	•	Gets live URL
	•	Updates site status = “published”
	•	Returns live URL

Frontend shows:
🎉 “Your site is live!”
Button: Open Live Site

⸻

🧠 DESIGN STYLE

The generator UI must feel:
	•	Clean
	•	Friendly
	•	Modern SaaS
	•	Dark mode with soft gradients
	•	Rounded corners
	•	Smooth animations

Avoid:
	•	Technical dashboards
	•	Overloaded settings
	•	Complex options

⸻

🔒 RULES
	•	This is one feature inside Launchly
	•	Keep UI minimal and fun
	•	Preview first, code second
	•	Publishing uses Vercel only
	•	Users do not see technical deployment steps

⸻

🏁 RESULT

This feature should make users feel like:

“I just described my business… and now I have a real website live on the internet.”

Simple. Magical. Fast.# Real OAuth Integration - Quick Summary

## What's Now Implemented

✅ **Real OAuth flow** for TikTok, Instagram, and Twitter
✅ **Token exchange** - Converts OAuth codes to access tokens
✅ **Secure storage** - Encrypted tokens in Firebase
✅ **User info** - Fetches username from each platform
✅ **Error handling** - Graceful error messages
✅ **Frontend redirect** - Seamless callback handling

## How It Works Now

### 1. User Clicks "Connect Instagram"
```
User in scheduler
    ↓
handleConnectAccount("instagram")
    ↓
Fetch /api/social/oauth-url?platform=instagram&userId=user123
    ↓
Backend generates Instagram OAuth URL
    ↓
Frontend redirects to Instagram login
```

### 2. User Logs In & Authorizes
```
Instagram asks for permission
    ↓
User clicks "Allow"
    ↓
Instagram redirects back to:
/api/social/oauth/callback?code=xyz&state=abc&platform=instagram
```

### 3. Backend Exchanges Code for Token
```
Backend receives code
    ↓
Backend calls Instagram API:
POST https://graph.instagram.com/v18.0/oauth/access_token
    ↓
Instagram returns access token
    ↓
Backend fetches user info (username)
    ↓
Backend redirects to frontend with token
```

### 4. Frontend Saves Token
```
Frontend receives redirect:
/social-media-scheduler?connected=instagram&token=xyz&username=@user
    ↓
useEffect detects URL params
    ↓
Calls saveSocialAccount(platform, username, token)
    ↓
Token saved to Firebase encrypted
    ↓
Shows "Connected!" toast
```

## Files Updated

### Backend
**`server/routes/social-media-scheduler.ts`**
- Added `handleGetOAuthUrl` - Generates OAuth URLs
- Added `handleOAuthCallback` - Handles platform redirects
- Added platform-specific token exchange functions
- Added user info fetching functions

### Frontend
**`client/pages/SocialMediaScheduler.tsx`**
- Updated `handleConnectAccount` - Redirects to OAuth
- Updated useEffect - Handles callback and saves token
- Integrated with saveSocialAccount from Firebase library

### Configuration
**`.env.example`**
- Added all OAuth client IDs and secrets
- Added ENCRYPTION_KEY for token security
- Added OAUTH_REDIRECT_URI

## To Use This

### Step 1: Register Apps
Follow [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md)

Get credentials from:
- **Instagram**: https://developers.facebook.com/
- **TikTok**: https://developers.tiktok.com/
- **Twitter**: https://developer.twitter.com/

### Step 2: Fill in .env
Copy `.env.example` → `.env` and add your credentials:
```
INSTAGRAM_CLIENT_ID=your_id
INSTAGRAM_CLIENT_SECRET=your_secret
TIKTOK_CLIENT_ID=your_id
TIKTOK_CLIENT_SECRET=your_secret
TWITTER_CLIENT_ID=your_id
TWITTER_CLIENT_SECRET=your_secret
ENCRYPTION_KEY=generate_a_32_char_hex_string
OAUTH_REDIRECT_URI=http://localhost:8081/api/social/oauth/callback
```

### Step 3: Install Dependencies
```bash
pnpm add axios
# firebase-admin and crypto are already included
```

### Step 4: Restart Server
```bash
pnpm dev
```

### Step 5: Test
1. Go to Social Media Scheduler
2. Click "Connect Instagram"
3. Log in with your Instagram account
4. Should see "Connected!" message
5. Check Firebase console - token should be saved

## API Endpoints

### Get OAuth URL
```
GET /api/social/oauth-url?platform=instagram&userId=user123

Response:
{
  success: true,
  url: "https://api.instagram.com/oauth/authorize?...",
  state: "random_security_string"
}
```

### OAuth Callback
```
GET /api/social/oauth/callback?platform=instagram&code=xyz&state=abc

Redirects to:
/social-media-scheduler?connected=instagram&token=abc&username=@user
```

## Security

✅ **Encrypted tokens** - AES-256 encryption
✅ **User-scoped** - Each user has their own tokens
✅ **State verification** - CSRF protection
✅ **Environment variables** - Secrets not in code
✅ **HTTPS ready** - For production

## What's Next

1. **Test thoroughly** - Try connecting all 3 platforms
2. **Use real tokens** - Replace mock tokens with OAuth tokens
3. **Auto-publishing** (Phase 2) - Use tokens to post automatically
4. **Analytics** (Phase 3) - Get engagement metrics

## Troubleshooting

**"Invalid Client ID"**
- Check Client ID in .env matches platform settings
- Restart server after changing .env
- Check for spaces/typos

**"Redirect URI mismatch"**
- Exact match required: `http://localhost:8081/api/social/oauth/callback`
- Update in platform settings
- Update in .env

**Token not saving to Firebase**
- Check Firebase is writable
- Check user UID is correct
- Check browser console for errors

**Can't login to platform**
- Verify platform credentials are correct
- Check internet connection
- Try incognito browser

## Code Files

**Backend OAuth handling:**
```typescript
// Get OAuth URL
GET /api/social/oauth-url

// Handle OAuth callback from platform
GET /api/social/oauth/callback

// Exchange code for token
exchangeInstagramToken(code)
exchangeTwitterToken(code)
exchangeTikTokToken(code)

// Get user info
getInstagramUserInfo(token)
getTwitterUserInfo(token)
getTikTokUserInfo(token)
```

**Frontend OAuth handling:**
```typescript
// Trigger OAuth flow
handleConnectAccount(platform)

// Handle callback
useEffect(() => {
  // Detect URL params
  // Save token to Firebase
  // Show success/error message
})
```

## Key Features

✅ Real OAuth - Not mock tokens
✅ Token encryption - Secure storage
✅ Multi-platform - Instagram, TikTok, Twitter
✅ Error handling - User-friendly messages
✅ Automatic save - Token persists
✅ Seamless - No page reloads visible

---

**Status**: Ready to test with real platform credentials!

See [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md) for detailed setup instructions.
