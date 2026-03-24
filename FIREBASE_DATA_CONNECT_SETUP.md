# Firebase Data Connect Setup Guide for Zenith

## What is Firebase Data Connect?

Firebase Data Connect is a managed GraphQL API service that provides:
- Auto-generated GraphQL API from your schema
- Type-safe SDKs for React/TypeScript
- Built-in authentication with Firebase Auth
- Real-time subscriptions
- Offline support
- Fast query execution without cold starts

## Your Zenith Schema Overview

The schema includes 6 main entities:

### 1. **User**
- Stores user profiles and subscription status
- Tracks current credits and total purchased
- Links to all user-owned resources

### 2. **BusinessPlan**
- Full business plans with content
- Status tracking (draft, completed, in-progress)
- Credit cost tracking
- Links to chat history

### 3. **Project**
- Websites, stores, ads, social posts
- Status management (draft, published, archived)
- Type and configuration storage

### 4. **ChatMessage**
- Conversation history for business plan advisor
- Role tracking (user vs assistant)
- Timestamps for ordering

### 5. **CreditTransaction**
- Purchase history
- Usage tracking
- Refunds
- Full audit trail

### 6. **Document**
- Legal documents, templates
- Status tracking
- User-owned documents

## Setup Instructions

### Step 1: Enable Firebase Data Connect

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your Zenith project
3. Navigate to **Build** → **Data Connect** (currently in preview)
4. Click **Enable**

### Step 2: Deploy Your Schema

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy the dataconnect.yaml schema
firebase dataconnect:deploy
```

### Step 3: Generate TypeScript Types

```bash
# After deployment, generate SDK
firebase dataconnect:codegen --language typescript
```

This creates a `generated/` folder with type-safe query/mutation functions.

### Step 4: Install Data Connect SDK

```bash
pnpm add @firebase/data-connect
```

### Step 5: Update Your React Code

Example in your UserProfile component:

```typescript
import { initializeDataConnect, connectDataConnectEmulator } from '@firebase/data-connect';
import { getUser, updateUserProfile } from '../generated/dataconnect';

// Initialize (in App.tsx or main.tsx)
const dc = initializeDataConnect({
  connector: 'zenith-connector'
});

// In your component
const user = await getUser({ uid: currentUser.uid });

// Update user
await updateUserProfile({
  uid: currentUser.uid,
  displayName: newName,
  avatar: newAvatarUrl
});
```

## Migration Path

### Current: Firebase Realtime Database
```typescript
// Old way
const ref = firebase.database().ref(`users/${uid}`);
const snapshot = await ref.get();
const user = snapshot.val();
```

### New: Firebase Data Connect
```typescript
// New way
const user = await getUser({ uid });
```

## Benefits for Zenith

| Feature | Benefit |
|---------|---------|
| **Type Safety** | Compile-time errors caught |
| **Auto Caching** | Faster queries, less bandwidth |
| **Offline Support** | Works without internet |
| **Subscriptions** | Real-time chat updates |
| **Authorization Rules** | Built-in row-level security |
| **Performance** | No cold starts, sub-100ms queries |

## Next Steps

1. **Enable Data Connect** in Firebase Console
2. **Deploy the schema** using Firebase CLI
3. **Update key components**:
   - [client/lib/firebase-auth.ts](client/lib/firebase-auth.ts) - User auth
   - [client/lib/credits.ts](client/lib/credits.ts) - Credit management
   - [client/components/BusinessPlanChat.tsx](client/components/BusinessPlanChat.tsx) - Chat history
   - [server/routes/](server/routes/) - API endpoints
4. **Test locally** with emulator
5. **Deploy to production**

## Files Created

- `dataconnect.yaml` - Schema definition
- `FIREBASE_DATA_CONNECT_QUERIES.md` - All available queries
- `FIREBASE_DATA_CONNECT_MUTATIONS.md` - All available mutations
- `FIREBASE_DATA_CONNECT_SETUP.md` - This guide

## Security Considerations

Add authorization rules to your schema:

```yaml
type User {
  uid: String! @primary @auth(allow: owner)
  email: String! @auth(allow: owner)
  currentCredits: Int! @auth(allow: owner)
}
```

This ensures users can only access their own data.

## Pricing

- **Free tier**: Up to 100 connections, 50GB data, 100M operations/month
- **Pay as you go**: $0.06 per 1M read operations

For Zenith, likely free tier is sufficient to start.

## Support

- [Firebase Data Connect Docs](https://firebase.google.com/docs/data-connect)
- [GraphQL Query Guide](https://firebase.google.com/docs/data-connect/graphql)
- [Codelab](https://firebase.google.com/codelabs/dataconnect-web)
