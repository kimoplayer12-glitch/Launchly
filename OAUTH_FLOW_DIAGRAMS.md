# OAuth Flow Diagrams

## Complete OAuth Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SOCIAL MEDIA SCHEDULER                              │
│                                                                               │
│  User clicks "Connect Instagram"                                             │
│  ↓                                                                            │
│  handleConnectAccount("instagram") triggered                                 │
│  ↓                                                                            │
│  Fetch /api/social/oauth-url?platform=instagram&userId=xyz                   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          YOUR BACKEND SERVER                                 │
│                                                                               │
│  Receive: platform=instagram, userId=xyz                                     │
│  ↓                                                                            │
│  Load credentials from .env:                                                 │
│  - INSTAGRAM_CLIENT_ID                                                       │
│  - INSTAGRAM_CLIENT_SECRET                                                   │
│  ↓                                                                            │
│  Generate OAuth URL:                                                         │
│  https://api.instagram.com/oauth/authorize?                                  │
│    client_id=YOUR_APP_ID&                                                    │
│    redirect_uri=http://localhost:8081/api/social/oauth/callback&             │
│    scope=user_profile,user_media&                                            │
│    response_type=code                                                        │
│  ↓                                                                            │
│  Return: { url: "https://api.instagram.com/oauth/authorize?..." }            │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND BROWSER                                     │
│                                                                               │
│  Receive OAuth URL from backend                                              │
│  ↓                                                                            │
│  window.location.href = "https://api.instagram.com/oauth/authorize?..."      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  INSTAGRAM LOGIN    │
                    │                     │
                    │ User logs in or     │
                    │ selects account     │
                    │                     │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │   AUTHORIZE APP     │
                    │                     │
                    │ "Allow access to    │
                    │  your profile?"     │
                    │                     │
                    │  [Allow] [Cancel]   │
                    └─────────────────────┘
                              ↓
                         (User clicks Allow)
                              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│              INSTAGRAM REDIRECTS TO YOUR BACKEND CALLBACK                    │
│                                                                               │
│  GET /api/social/oauth/callback?                                             │
│      platform=instagram&                                                     │
│      code=AUTHORIZATION_CODE&                                                │
│      state=SECURITY_STATE                                                    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKEND EXCHANGES CODE                                  │
│                                                                               │
│  Receive: code=AUTHORIZATION_CODE                                            │
│  ↓                                                                            │
│  POST https://graph.instagram.com/v18.0/oauth/access_token                   │
│  Body:                                                                        │
│  {                                                                            │
│    client_id: INSTAGRAM_CLIENT_ID,                                           │
│    client_secret: INSTAGRAM_CLIENT_SECRET,                                   │
│    grant_type: "authorization_code",                                         │
│    code: AUTHORIZATION_CODE,                                                 │
│    redirect_uri: "http://localhost:8081/api/social/oauth/callback"           │
│  }                                                                            │
│  ↓                                                                            │
│  Response from Instagram:                                                    │
│  {                                                                            │
│    access_token: "IGAABs...",                                                │
│    token_type: "bearer"                                                      │
│  }                                                                            │
│  ↓                                                                            │
│  Get User Info:                                                              │
│  GET https://graph.instagram.com/me?                                         │
│      fields=id,username&                                                     │
│      access_token=IGAABs...                                                  │
│  ↓                                                                            │
│  Response from Instagram:                                                    │
│  {                                                                            │
│    id: "123456789",                                                          │
│    username: "myusername"                                                    │
│  }                                                                            │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│              BACKEND REDIRECTS TO FRONTEND WITH TOKEN                        │
│                                                                               │
│  window.location.href =                                                      │
│    "/social-media-scheduler?                                                 │
│      connected=instagram&                                                    │
│      username=myusername&                                                    │
│      token=IGAABs...&                                                        │
│      expiresIn=5184000"                                                      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND RECEIVES TOKEN                                  │
│                                                                               │
│  URL params detected by useEffect:                                           │
│  - connected: "instagram"                                                    │
│  - username: "myusername"                                                    │
│  - token: "IGAABs..."                                                        │
│  ↓                                                                            │
│  Call saveSocialAccount("instagram", "myusername", "IGAABs...")              │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                   FRONTEND SAVES TO FIREBASE                                 │
│                                                                               │
│  Firebase Realtime Database Write:                                           │
│  /users/{userId}/socialAccounts/instagram                                    │
│  {                                                                            │
│    id: "instagram_user123",                                                  │
│    platform: "instagram",                                                    │
│    username: "myusername",                                                   │
│    accessToken: "[AES-256 ENCRYPTED]",                                       │
│    connectedAt: 1704067200000,                                               │
│    expiresAt: 1734651200000                                                  │
│  }                                                                            │
│  ↓                                                                            │
│  Show Toast: "Connected!"                                                    │
│  ↓                                                                            │
│  Reload accounts list                                                        │
│  ↓                                                                            │
│  Clear URL params                                                            │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                              ↓
                         ✅ SUCCESS
                   Account now connected!
```

## Token Encryption

```
┌──────────────────────────────┐
│  Raw Access Token            │
│  "IGAABs1234567890xyzABC..." │
└──────────────────────────────┘
         ↓
┌──────────────────────────────┐
│  Generate Random IV          │
│  (Initialization Vector)     │
│  "a1b2c3d4e5f6g7h8..."       │
└──────────────────────────────┘
         ↓
┌──────────────────────────────┐
│  AES-256 Encrypt             │
│  (using ENCRYPTION_KEY)      │
└──────────────────────────────┘
         ↓
┌──────────────────────────────────────────────┐
│  Encrypted Token Format                      │
│  "iv:encrypteddata"                          │
│  "a1b2c3d4e5f6g7h8:x7y8z9a0b1c2d3e4f..."    │
└──────────────────────────────────────────────┘
         ↓
┌──────────────────────────────┐
│  Save to Firebase            │
│  /users/{id}/socialAccounts/ │
│  instagram/accessToken       │
└──────────────────────────────┘
```

## Platform Comparison

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│              │  Instagram   │    TikTok    │   Twitter    │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Site         │ Meta         │ TikTok       │ Twitter      │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Dev Portal   │ developers   │ developers   │ developer    │
│              │ .facebook    │ .tiktok.com  │ .twitter.com │
│              │ .com         │              │              │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Credential 1 │ App ID       │ Client Key   │ API Key      │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Credential 2 │ App Secret   │ Client       │ API Key      │
│              │              │ Secret       │ Secret       │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Auth URL     │ /oauth/      │ /oauth/      │ /i/oauth2/   │
│              │ authorize    │ authorize    │ authorize    │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Token URL    │ /v18.0/      │ /oauth/      │ /2/oauth2/   │
│              │ oauth/       │ token/       │ token        │
│              │ access_token │              │              │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ User API     │ /me?         │ /v1/user/    │ /2/users/me  │
│              │ fields=id,   │ info/        │              │
│              │ username     │              │              │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Scopes       │ user_profile │ video.upload │ tweet.write  │
│              │ user_media   │              │ tweet.read   │
│              │              │              │ users.read   │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

## Data Flow in Firebase

```
Firebase Realtime Database
│
└── users/
    │
    └── user123/
        │
        ├── socialAccounts/
        │   │
        │   ├── instagram/
        │   │   ├── id: "instagram_user123"
        │   │   ├── platform: "instagram"
        │   │   ├── username: "@myaccount"
        │   │   ├── accessToken: "[ENCRYPTED]"
        │   │   ├── connectedAt: 1704067200000
        │   │   └── expiresAt: 1734651200000
        │   │
        │   ├── twitter/
        │   │   ├── id: "twitter_user123"
        │   │   ├── platform: "twitter"
        │   │   ├── username: "@myhandle"
        │   │   ├── accessToken: "[ENCRYPTED]"
        │   │   └── connectedAt: 1704067201000
        │   │
        │   └── tiktok/
        │       ├── id: "tiktok_user123"
        │       ├── platform: "tiktok"
        │       ├── username: "myusername"
        │       ├── accessToken: "[ENCRYPTED]"
        │       └── connectedAt: 1704067202000
        │
        └── scheduledPosts/
            ├── post001/
            │   ├── platform: "instagram"
            │   ├── caption: "..."
            │   └── scheduledFor: 1704153600000
            │
            └── post002/
                ├── platform: "twitter"
                ├── caption: "..."
                └── scheduledFor: 1704153601000
```

## Error Handling Flow

```
┌─────────────────────────────┐
│  User clicks "Connect"      │
└─────────────────────────────┘
             │
    ┌────────┴────────┐
    ↓                 ↓
[Success]         [Error]
    │                 │
    ├─→ OAuth redirect    ├─→ Toast error message
    │   Platform login    │   "Authentication failed"
    │   User authorizes   │
    │   Code received     │
    │                     │
    ├─→ Token exchange    ├─→ "Invalid credentials"
    │   Code → Token      │   "Network error"
    │   User info fetch   │   "Token expired"
    │                     │
    ├─→ Firebase save     ├─→ "Failed to save"
    │   Encrypt token     │   "Permission denied"
    │   Write to DB       │
    │                     │
    └─→ Show success      └─→ Redirect with error param
        "Connected!"          /scheduler?error=...
        Reload list
```

---

**Visual Guides:**
- [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md) - Detailed setup instructions
- [LINK_SOCIAL_ACCOUNTS.md](./LINK_SOCIAL_ACCOUNTS.md) - Quick start guide
- [OAUTH_SUMMARY.md](./OAUTH_SUMMARY.md) - Technical summary
