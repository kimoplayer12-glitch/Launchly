# 🚀 Quick Start Guide

## Installation & Setup

### 1. Install Dependencies
```bash
cd zenith
pnpm install
```

### 2. Environment Configuration
Create `.env` file with required keys:

```env
# Firebase
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# YouTube
YOUTUBE_API_KEY=your_youtube_api_key

# Paddle
PADDLE_API_KEY=your_paddle_api_key
PADDLE_VENDOR_ID=your_vendor_id
VITE_PADDLE_VENDOR_ID=your_vendor_id

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 3. Development Server
```bash
pnpm dev
```
Open http://localhost:8080

### 4. Production Build
```bash
pnpm build
pnpm start
```

## Feature Overview

### Authentication
- **Login**: `/login` - Email/password or Google Sign-In
- **Register**: `/signup` - New user registration

### Main Tools
- **Dashboard**: `/dashboard` - Overview and quick stats
- **Business Builder**: `/business-builder` - AI business plan generator
- **Social Media Scheduler**: `/social-media-scheduler` - Multi-platform posting
- **Monetize Hub**: `/monetize-hub` - Social media analytics & earnings
- **Ad Generator**: `/adgen` - AI-powered ad copy
- **Website Builder**: `/generate-website` - Quick website creation
- **Store Generator**: `/generate-store` - E-commerce setup

### Account Management
- **Credits**: `/credits` - Buy credits or subscribe
- **Integrations**: `/integrations` - Connect social platforms
- **Settings**: `/settings` - Account preferences
- **Pricing**: `/pricing` - View pricing plans

## Available Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm dev --host       # Expose to network

# Building
pnpm build            # Full build (client + server)
pnpm build:client     # Client only
pnpm build:server     # Server only

# Production
pnpm start            # Run production server

# Testing
pnpm test             # Run tests
pnpm typecheck        # TypeScript check

# Code Quality
pnpm format.fix       # Format code with Prettier
```

## Project Structure

```
zenith/
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared types
├── public/           # Static files
├── dist/             # Build output
└── [config files]    # Vite, Tailwind, etc.
```

## Key Technologies

- **Frontend**: React 18, TypeScript, TailwindCSS, Radix UI
- **Backend**: Express.js, Firebase
- **Build**: Vite 7, esbuild
- **Database**: Firebase Realtime DB
- **Auth**: Firebase Authentication
- **Payments**: Paddle, Stripe
- **APIs**: YouTube Data API v3

## Development Workflow

1. **Create Feature Branch**
```bash
git checkout -b feature/feature-name
```

2. **Make Changes**
- Modify components in `client/`
- Update API routes in `server/routes/`
- Update types in `shared/`

3. **Test Locally**
```bash
pnpm dev
# Test in browser at http://localhost:8080
```

4. **Build & Verify**
```bash
pnpm build
```

5. **Commit & Push**
```bash
git add .
git commit -m "feat: description of changes"
git push origin feature/feature-name
```

## Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm i -g netlify-cli
netlify deploy
```

### Self-Hosted
```bash
pnpm build
pnpm start
```

## Troubleshooting

### Port Already in Use
```bash
# The dev server will try ports 8080-8245 automatically
# If issues persist, find and kill the process:
lsof -i :8080
kill -9 <PID>
```

### Firebase Not Connecting
- Check `.env` file has all required keys
- Verify Firebase project settings
- Check Firestore/Realtime DB rules

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules pnpm-lock.yaml dist
pnpm install
pnpm build
```

### TypeScript Errors
```bash
# Check and fix TypeScript issues
pnpm typecheck
```

## Performance Tips

- Use Chrome DevTools for performance profiling
- Check build size: `pnpm build` shows chunk sizes
- Monitor API calls in Network tab
- Use React DevTools to track re-renders

## Security Notes

- ✅ Never commit `.env` files to git
- ✅ Use environment variables for secrets
- ✅ Validate all user inputs
- ✅ Keep dependencies updated
- ✅ Use HTTPS in production

## Support & Documentation

- **README.md** - Full project documentation
- **IMPROVEMENTS.md** - What was improved
- **LAUNCH_READY.md** - Launch checklist
- **API Routes** - See server/routes/ directory

## Next Steps

1. ✅ Customize branding (colors, logo, company name)
2. ✅ Set up email service (contact form, notifications)
3. ✅ Configure analytics (Google Analytics, Mixpanel)
4. ✅ Add user onboarding flow
5. ✅ Set up support system (Help Scout, Zendesk)

---

**Happy Coding! 🎉**

For questions or issues, check the documentation files or review the code comments.
