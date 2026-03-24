# Zenith - Full-Stack Business Automation Platform

A production-ready full-stack React application with integrated Express server for entrepreneurs and business owners to manage multiple business tools.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

The application will be available at `http://localhost:8080`

## 📁 Project Structure

```
client/                      # React SPA frontend
├── pages/                   # Route components
│   ├── Index.tsx           # Home page
│   ├── Landing.tsx         # Marketing landing
│   ├── Login.tsx           # User authentication
│   ├── Dashboard.tsx       # Main dashboard
│   ├── BusinessBuilder.tsx # Business plan generator
│   ├── MonetizeHub.tsx     # Social media monetization
│   ├── SocialMediaScheduler.tsx # Content scheduling
│   ├── SocialPoster.tsx    # Social media posting
│   ├── AdGen.tsx           # Ad generator
│   ├── WebsiteGenerator.tsx # Website builder
│   ├── StoreGenerator.tsx  # E-commerce store
│   ├── Credits.tsx         # Credits system
│   ├── Integrations.tsx    # Third-party integrations
│   ├── Settings.tsx        # User settings
│   ├── Pricing.tsx         # Pricing page
│   ├── Contact.tsx         # Contact form
│   ├── Terms/Privacy/Refund policies
│   └── NotFound.tsx        # 404 page
├── components/             # Reusable UI components
│   ├── ui/                 # Shadcn UI components
│   ├── Layout.tsx          # Main layout wrapper
│   ├── Navbar.tsx          # Navigation bar
│   ├── Sidebar.tsx         # Sidebar navigation
│   └── Other components
├── hooks/                  # Custom React hooks
│   ├── use-firebase-auth.ts
│   ├── use-credits.ts
│   ├── use-paddle.ts
│   └── use-mobile.tsx
├── lib/                    # Utilities and helpers
│   ├── firebase.ts         # Firebase config
│   ├── firebase-auth.ts    # Auth helpers
│   ├── firebase-database.ts # DB helpers
│   ├── firebase-storage.ts # Storage helpers
│   ├── paddle.ts           # Payment processing
│   ├── credits.ts          # Credit system
│   └── utils.ts            # Utility functions
└── App.tsx                 # App entry point

server/                     # Express backend
├── index.ts               # Server setup and routes
├── firebase-init.ts       # Firebase initialization
├── node-build.ts          # Node build config
└── routes/                # API endpoint handlers
    ├── demo.ts            # Demo endpoints
    ├── contact.ts         # Contact form
    ├── chat-with-plan.ts  # AI chat
    ├── generate-business-plan.ts
    ├── generate-website.ts
    ├── generate-store.ts
    ├── social-media-scheduler.ts
    ├── integrations.ts    # Platform integrations
    ├── youtube-api.ts     # YouTube integration
    ├── paddle-webhook.ts  # Payment webhooks
    ├── stripe-*.ts        # Stripe integration
    └── shopify-*.ts       # Shopify integration

shared/                    # Shared types
└── api.ts                # API interfaces

public/                    # Static files
└── robots.txt

dist/                      # Build output
├── spa/                   # Frontend build
└── server/                # Server build
```

## 🎯 Key Features

### Authentication
- Firebase Authentication (Google, Email/Password)
- Protected routes with auth guards
- User session management

### Connected Analytics Dashboard
- Settings → Connections (Stripe, PayPal, Shopify, Instagram, TikTok)
- Dashboard → Analytics Overview (cards + charts)
- AI insights: weekly briefs + Ask AI
- Setup: `docs/integrations.md`

### Business Tools
- **Business Builder**: AI-powered business plan generator
- **Monetize Hub**: Social media platform integration & analytics
- **Social Media Scheduler**: Schedule posts across multiple platforms (Instagram, Twitter, TikTok, YouTube)
- **Ad Generator**: AI-powered ad copy generator
- **Website Generator**: Quick website builder
- **Store Generator**: E-commerce store creation

### Integrations
- **YouTube**: Real YouTube channel data integration
- **Instagram**: Social media connection
- **Twitter/X**: Social media connection
- **TikTok**: Social media connection
- **Shopify**: E-commerce platform
- **Stripe**: Payment processing
- **Paddle**: Payment processing & subscriptions

### Monetization
- **Credits System**: User credits for tool usage
- **Paddle Payments**: Subscribe/one-time purchases
- **Stripe Integration**: Payment processing
- **Webhook Support**: Real-time payment updates

### Content & Tools
- **AI Chat**: Business plan consultation chatbot
- **Email Contact**: Contact form handling
- **Policy Pages**: Terms of Service, Privacy Policy, Refund Policy

## 🔧 Tech Stack

- **Frontend**
  - React 18 with TypeScript
  - Vite for fast development & builds
  - TailwindCSS 3 for styling
  - Radix UI for accessible components
  - Lucide React for icons
  - React Router 6 for SPA routing
  - TanStack Query for data management
  - Sonner & Radix Toast for notifications

- **Backend**
  - Express.js for REST API
  - Firebase Admin SDK for database & auth
  - YouTube Data API v3
  - Paddle SDK for payments
  - Stripe SDK for payments

- **Database**
  - Firebase Realtime Database
  - Firebase Authentication

- **Testing**
  - Vitest for unit/integration tests
  - React Testing Library

- **DevOps**
  - Vite dev server with hot reload
  - Single-port development (8080)
  - Production-ready build process

## 📖 API Routes

### Demo
- `GET /api/ping` - Health check
- `GET /api/demo` - Demo data

### Business
- `POST /api/generate-business-plan` - Generate business plan
- `POST /api/chat-with-plan` - AI chat about plans

### Content
- `POST /api/generate-website` - Generate website
- `POST /api/generate-store` - Generate e-commerce store
- `POST /api/contact` - Send contact form

### Social Media
- `POST /api/social-media-scheduler/schedule` - Schedule posts
- `GET /api/social-media-scheduler/scheduled-posts` - Get scheduled posts
- `POST /api/social-media-scheduler/connect-account` - Connect social account
- `POST /api/youtube/channel-data` - Get YouTube channel data

### Integrations
- `GET /api/integrations` - Get user integrations
- `POST /api/integrations/connect` - Connect integration
- `POST /api/integrations/disconnect` - Disconnect integration
- `GET /api/integrations/data/:platform` - Get platform data

### Payments
- `POST /api/paddle/webhook` - Paddle payment webhook
- `POST /api/stripe/webhook` - Stripe payment webhook
- `POST /api/stripe-checkout` - Create Stripe checkout
- `POST /api/stripe-connect` - Stripe Connect setup

### Shopify
- `POST /api/shopify/install` - Install Shopify app

## 🔐 Environment Variables

Create a `.env` file with:

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

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Encryption
ENCRYPTION_KEY=your_32_char_encryption_key
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test utils.spec.ts

# Watch mode
pnpm test --watch
```

## 📦 Deployment

### Production Build
```bash
pnpm build
pnpm start
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify Deployment
The project includes Netlify Functions support:
- Functions are in `netlify/functions/api.ts`
- Deploy with `netlify deploy`

## 🎨 Customization

### Adding a New Page
1. Create component in `client/pages/NewPage.tsx`
2. Add route in `client/App.tsx`:
```tsx
<Route path="/new-page" element={<NewPage />} />
```

### Adding an API Endpoint
1. Create handler in `server/routes/new-endpoint.ts`
2. Register in `server/index.ts`:
```ts
import { handleNewEndpoint } from "./routes/new-endpoint";
app.post("/api/new-endpoint", handleNewEndpoint);
```

### Styling
- Theme variables in `client/global.css`
- Tailwind config in `tailwind.config.ts`
- UI components in `client/components/ui/`

## 📝 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm build:client` - Build client only
- `pnpm build:server` - Build server only
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm typecheck` - TypeScript validation
- `pnpm format.fix` - Format code with Prettier

## 🐛 Troubleshooting

### Port Already in Use
The dev server will try ports 8080-8245 automatically. If issues persist:
```bash
# Find process on port 8080
netstat -ano | findstr :8080
# Kill process
taskkill /PID <pid> /F
```

### Firebase Connection Issues
Check that:
- Firebase credentials are in `.env`
- Firebase Admin SDK is initialized
- Firestore/Realtime Database rules allow access

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

## 📞 Support

For issues, questions, or feature requests, use the Contact page in the app.

## 📄 License

Private project for Zenith platform.

## 🙏 Credits

Built with [Fusion Starter](https://github.com/yourusername/fusion-starter) template.

## Website Generator MVP

### Run Functions Locally (Emulators)
```bash
cd functions
npm install

# Set your OpenAI key for the emulator session
# macOS/Linux:
export OPENAI_API_KEY="your_key_here"
# Windows PowerShell:
$env:OPENAI_API_KEY="your_key_here"

firebase emulators:start --only functions,firestore,hosting
```

If you prefer running the Vite dev server directly, set:
```bash
# Example (functions base URL, note the /api function name)
VITE_FUNCTIONS_BASE_URL="http://localhost:5001/<project-id>/us-central1/api"
```

### Deploy Functions
```bash
# Set the secret for Cloud Functions v2
firebase functions:secrets:set OPENAI_API_KEY

# Deploy functions only
firebase deploy --only functions
```

### Use the MVP
1. Sign in and open `/dashboard/generate`.
2. Enter a prompt and click **Generate Website**.
3. Edit `index.html`, `styles.css`, and `app.js`.
4. Preview renders in the iframe (`/preview/:projectId`).
5. Click **Save Revision** to store changes.

## Workflow Automation (n8n-style)

### Firebase Storage + Execution
The workflow builder stores data in Firestore and executes runs via the API.

Set required env vars in `.env`:
```env
OPENAI_API_KEY=your_openai_key
WORKFLOW_CREDENTIALS_KEY=base64_or_hex_32_byte_key
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

Run the app:
```bash
pnpm dev
```

### UI Routes
- `/dashboard/automations` - Workflow list
- `/dashboard/automations/:id` - Builder
- `/dashboard/automations/:id/logs` - Execution logs

### Notes
- Manual runs execute the draft graph immediately.
- Publish creates an immutable version and enables webhook triggers.
