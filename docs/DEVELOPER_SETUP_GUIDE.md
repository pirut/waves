# Developer Setup Guide

## Overview

This guide provides comprehensive instructions for setting up the Make Waves development environment, including all necessary dependencies, environment variables, and development tools.

## Prerequisites

### System Requirements

- **Node.js:** Version 18.x or higher
- **npm:** Version 9.x or higher (comes with Node.js)
- **Git:** Latest version
- **VS Code:** Recommended IDE with suggested extensions

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

## Project Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd make-waves
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies listed in `package.json`, including:
- **Next.js 15.3.5** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **tRPC** - Type-safe API layer
- **Firebase** - Authentication and database
- **Tailwind CSS** - Styling framework
- **Radix UI** - Component primitives

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local  # If example exists
# OR
touch .env.local
```

Add the following environment variables:

```bash
# Firebase Client Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps Configuration (Public)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_GOOGLE_MAPS_ID=your_google_maps_id

# Firebase Admin SDK (Server-side only)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----"
```

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "make-waves-dev")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Enable **Google** provider
   - Add your domain to authorized domains
   - Configure OAuth consent screen

### 3. Create Firestore Database

1. Go to **Firestore Database** in Firebase Console
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location close to your users

### 4. Configure Firebase Storage

1. Go to **Storage** in Firebase Console
2. Click "Get started"
3. Choose security rules mode
4. Select a location

### 5. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click "Web app" icon (</>)
4. Register your app with a nickname
5. Copy the configuration values to your `.env.local`

### 6. Generate Service Account Key

1. Go to **Project Settings** > **Service accounts**
2. Click "Generate new private key"
3. Download the JSON file
4. Extract values for server-side environment variables:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)

## Google Maps Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable billing for the project

### 2. Enable APIs

Enable these APIs in Google Cloud Console:
- **Maps JavaScript API**
- **Geocoding API**
- **Places API** (if using places features)

### 3. Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "API Key"
3. Copy the API key to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 4. Create Map ID

1. Go to **Google Maps Platform** > **Map management**
2. Click "Create Map ID"
3. Choose "Vector" map type
4. Copy the Map ID to `NEXT_PUBLIC_GOOGLE_MAPS_ID`

### 5. Restrict API Key (Recommended)

1. Click on your API key in the credentials list
2. Add application restrictions:
   - **HTTP referrers**: Add your development and production domains
3. Add API restrictions:
   - Select only the APIs you're using

## Development Commands

### Start Development Server

```bash
npm run dev
```

This starts the Next.js development server with Turbo mode enabled. The app will be available at `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

Creates an optimized production build in the `.next` folder.

### Start Production Server

```bash
npm start
```

Starts the production server (requires `npm run build` first).

### Linting

```bash
npm run lint
```

Runs ESLint to check for code quality issues.

### Code Formatting

```bash
npm run format
```

Formats code using Prettier according to project standards.

## Project Structure

```
make-waves/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard page
│   │   ├── events/            # Events pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # Design system components
│   │   └── dashboard/        # Dashboard-specific components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   ├── server/               # tRPC server code
│   │   └── routers/          # API route definitions
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
├── docs/                     # Documentation files
├── .env.local               # Environment variables (create this)
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## Database Schema

### Firestore Collections

The application uses the following Firestore collections:

#### Events Collection

```typescript
// Collection: 'events'
interface Event {
  id: string;                    // Document ID
  title: string;
  description?: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  date: string;                  // ISO date string
  maxAttendees?: number;
  attendees: string[];           // Array of user IDs
  createdBy: string;             // User ID
  createdAt: string;             // ISO timestamp
  updatedAt?: string;            // ISO timestamp
}
```

#### Users Collection

```typescript
// Collection: 'users'
interface User {
  id: string;                    // Document ID (matches Auth UID)
  uid: string;                   // Firebase Auth UID
  displayName?: string;
  email: string;
  photoURL?: string;
  bio?: string;
  friends: string[];             // Array of user IDs
  attendedEvents: string[];      // Array of event IDs
  badges: string[];              // Array of badge names
  createdAt: string;             // ISO timestamp
  updatedAt?: string;            // ISO timestamp
}
```

#### Posts Collection

```typescript
// Collection: 'posts'
interface Post {
  id: string;                    // Document ID
  content: string;
  eventId: string;               // Reference to event
  authorId: string;              // Reference to user
  imageUrl?: string;
  likes: string[];               // Array of user IDs
  createdAt: string;             // ISO timestamp
  updatedAt?: string;            // ISO timestamp
}
```

### Security Rules

Add these Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Events are readable by all, writable by authenticated users
    match /events/{eventId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
    }
    
    // Users can read all profiles, but only edit their own
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts are readable by all, writable by authenticated users
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.authorId;
    }
  }
}
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push branch
git push origin feature/your-feature-name
```

### 2. Code Quality Checks

Before committing, run:

```bash
# Check types
npx tsc --noEmit

# Lint code
npm run lint

# Format code
npm run format

# Test build
npm run build
```

### 3. Component Development

When creating new components:

1. Create component file in appropriate directory
2. Export from component's index file (if applicable)
3. Add TypeScript interfaces for props
4. Include JSDoc comments for documentation
5. Add to Storybook (if implemented)

Example component structure:

```typescript
interface MyComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

/**
 * MyComponent displays a title and optional description
 * @param title - The main title to display
 * @param description - Optional description text
 * @param onAction - Callback function for user interactions
 */
export default function MyComponent({ 
  title, 
  description, 
  onAction 
}: MyComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {onAction && <button onClick={onAction}>Action</button>}
    </div>
  );
}
```

### 4. API Development

When adding new tRPC procedures:

1. Define input/output schemas with Zod
2. Add procedure to appropriate router
3. Update router exports
4. Test with tRPC client

Example procedure:

```typescript
// In router file
export const myRouter = router({
  createItem: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementation
      const item = await createItem(input, ctx.user.uid);
      return item;
    }),
});
```

## Debugging

### Development Tools

1. **React Developer Tools** - Browser extension for React debugging
2. **Firebase Emulator Suite** - Local Firebase development
3. **tRPC Panel** - API testing interface (if configured)

### Common Issues and Solutions

#### Firebase Connection Issues

```typescript
// Check Firebase configuration
console.log('Firebase config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
```

#### tRPC Issues

```typescript
// Debug tRPC client
import { httpBatchLink } from '@trpc/client';

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      fetch: (url, options) => {
        console.log('tRPC request:', url, options);
        return fetch(url, options);
      }
    })
  ]
});
```

#### Environment Variables

```bash
# Check if environment variables are loaded
node -e "console.log(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)"
```

### Logging

Use structured logging for debugging:

```typescript
// Good logging practice
console.log('User authentication:', {
  uid: user?.uid,
  email: user?.email,
  timestamp: new Date().toISOString()
});

// Avoid logging sensitive data
console.log('API response:', {
  success: response.success,
  dataLength: response.data?.length,
  // Don't log actual data
});
```

## Deployment

### Environment Setup

Create environment variables for production:

1. **Vercel/Netlify:** Add environment variables in dashboard
2. **Docker:** Use environment file or secrets
3. **Manual deployment:** Create `.env.production.local`

### Build Optimization

The project includes several optimizations:

- **Turbo mode** for faster development builds
- **TypeScript strict mode** for better type safety
- **ESLint configuration** for code quality
- **Prettier formatting** for consistent code style

### Performance Monitoring

Consider adding:

- **Next.js Analytics** for performance metrics
- **Firebase Performance Monitoring**
- **Error tracking** (Sentry, LogRocket, etc.)

## Contributing

### Code Style Guidelines

1. Use TypeScript for all new code
2. Follow ESLint and Prettier configurations
3. Write descriptive commit messages
4. Add JSDoc comments for complex functions
5. Use meaningful variable and function names

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Run quality checks locally
4. Submit pull request with description
5. Address review feedback
6. Merge after approval

### Testing Strategy

While not currently implemented, consider adding:

- **Unit tests** with Jest and React Testing Library
- **Integration tests** for API endpoints
- **E2E tests** with Playwright or Cypress
- **Component tests** with Storybook

This completes the developer setup guide. Follow these instructions to get your development environment running smoothly.