# Utilities and Types Documentation

## Overview

This document covers utility functions, TypeScript interfaces, shared services, and configuration files that provide foundational functionality for the Make Waves application.

## Utility Functions

### cn (Class Name Utility)

A utility function for conditionally combining CSS class names using clsx and tailwind-merge.

**Location:** `src/lib/utils.ts`

**Function Signature:**
```typescript
function cn(...inputs: ClassValue[]): string
```

**Usage:**
```tsx
import { cn } from '@/lib/utils';

// Combine classes conditionally
const buttonClass = cn(
  'base-button-class',
  isActive && 'active-class',
  variant === 'primary' && 'primary-class',
  className // Allow external classes to override
);

// Use in components
<button className={cn(
  'px-4 py-2 rounded',
  isLoading && 'opacity-50 cursor-not-allowed',
  variant === 'destructive' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
)}>
  {children}
</button>
```

**Key Features:**
- Combines clsx for conditional classes
- Uses tailwind-merge to resolve Tailwind CSS conflicts
- Handles arrays, objects, and conditional expressions
- Automatically deduplicates conflicting Tailwind classes

**Examples:**
```typescript
// Basic usage
cn('text-red-500', 'bg-blue-500') // "text-red-500 bg-blue-500"

// Conditional classes
cn('base-class', isActive && 'active', !isActive && 'inactive')

// Object syntax
cn({
  'text-red-500': hasError,
  'text-green-500': isSuccess,
  'text-gray-500': isPending
})

// Tailwind conflict resolution
cn('p-4', 'p-2') // "p-2" (latter wins)
cn('text-red-500', 'text-blue-500') // "text-blue-500"
```

## TypeScript Types and Interfaces

### Event Types

**Location:** `src/types/event.ts`

Core interface for event data throughout the application.

```typescript
interface Event {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  attendees?: string[];
  maxAttendees?: number;
  createdBy?: string;
  time?: string;
  date?: string;
  createdAt?: string;
}
```

**Usage:**
```typescript
// In components
interface EventListProps {
  events: Event[];
  onEventSelect: (event: Event) => void;
}

// In API calls
const createEvent = (eventData: Omit<Event, 'id' | 'createdAt'>) => {
  // Create event logic
};

// Type guards
function isValidEvent(obj: any): obj is Event {
  return obj && typeof obj.id === 'string';
}
```

### User Types

User interface based on Firebase Auth User extended with application-specific fields.

```typescript
interface AppUser {
  id: string;
  uid: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  bio?: string;
  friends: string[];
  attendedEvents: string[];
  badges: string[];
  createdAt: string;
  updatedAt?: string;
}
```

### Post Types

Interface for social posts tied to events.

```typescript
interface Post {
  id: string;
  content: string;
  eventId: string;
  imageUrl?: string;
  authorId: string;
  likes: string[];
  createdAt: string;
  updatedAt?: string;
}
```

### API Response Types

Standard response types for API operations.

```typescript
// Success response
interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

// Error response
interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// Generic API response
type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Location bounds for map queries
interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Geocoding response
interface GeocodeResponse {
  success: boolean;
  lat?: number;
  lng?: number;
  formatted_address?: string;
  error?: string;
}
```

## Firebase Configuration

### Client-side Firebase

**Location:** `src/firebase.ts`

Client-side Firebase configuration for authentication and Firestore.

```typescript
// Firebase configuration object
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Exported services
export const auth: Auth;        // Firebase Authentication
export const db: Firestore;    // Cloud Firestore
export const storage: FirebaseStorage; // Cloud Storage
```

**Usage:**
```typescript
import { auth, db, storage } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Authentication
const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Firestore operations
const getUserProfile = async (userId: string) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists() ? userDoc.data() : null;
};
```

### Server-side Firebase Admin

**Location:** `src/firebaseAdmin.ts`

Server-side Firebase Admin SDK configuration for privileged operations.

```typescript
// Exported admin services
export const adminAuth: Auth;     // Admin Authentication
export const adminDb: Firestore; // Admin Firestore
```

**Usage:**
```typescript
import { adminAuth, adminDb } from '@/firebaseAdmin';

// Verify tokens on server
const verifyIdToken = async (token: string) => {
  const decodedToken = await adminAuth.verifyIdToken(token);
  return decodedToken;
};

// Server-side database operations
const createServerEvent = async (eventData: Event) => {
  const docRef = await adminDb.collection('events').add(eventData);
  return docRef.id;
};
```

## tRPC Configuration

### Client Configuration

**Location:** `src/lib/trpc.ts`

Type-safe tRPC client setup.

```typescript
import type { AppRouter } from '@/server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();
```

**Usage:**
```typescript
import { trpc } from '@/lib/trpc';

// Queries
const { data: events, isLoading } = trpc.events.getAll.useQuery();

// Mutations
const createEvent = trpc.events.create.useMutation({
  onSuccess: (data) => {
    console.log('Event created:', data);
  }
});
```

### Server Configuration

**Location:** `src/server/trpc.ts`

Server-side tRPC setup with middleware.

```typescript
// Base procedure types
export const router: RouterFactory;
export const publicProcedure: ProcedureBuilder;
export const protectedProcedure: ProcedureBuilder; // Requires authentication
```

**Usage:**
```typescript
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const myRouter = router({
  // Public endpoint
  getPublicData: publicProcedure.query(() => {
    return { message: 'Hello, world!' };
  }),
  
  // Protected endpoint
  createPrivateData: protectedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(({ input, ctx }) => {
      // ctx.user is available and verified
      return createData(input.title, ctx.user.uid);
    })
});
```

## Environment Variables

### Required Environment Variables

```bash
# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
NEXT_PUBLIC_GOOGLE_MAPS_ID=your_map_id

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key
```

### Environment Variable Usage

```typescript
// Client-side (prefixed with NEXT_PUBLIC_)
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Server-side only
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

// With defaults
const port = process.env.PORT || 3000;

// Type-safe environment variables
const requiredEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};
```

## API Routes

### Geocoding API

**Location:** `src/app/api/geocode/route.ts`

Server-side geocoding service for converting addresses to coordinates.

**Endpoint:** `POST /api/geocode`

**Request Body:**
```typescript
{
  address: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  lat?: number;
  lng?: number;
  formatted_address?: string;
  error?: string;
}
```

**Usage:**
```typescript
const geocodeAddress = async (address: string): Promise<GeocodeResponse> => {
  const response = await fetch('/api/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  
  return response.json();
};
```

### tRPC API Handler

**Location:** `src/app/api/trpc/[trpc]/route.ts`

Handles all tRPC API requests.

**Endpoints:** `GET|POST /api/trpc/*`

```typescript
// Automatic handling of all tRPC procedures
export { handler as GET, handler as POST };
```

## Constants and Enums

### Event Categories

```typescript
export const EVENT_CATEGORIES = [
  'Environmental',
  'Community Service',
  'Education',
  'Health & Wellness',
  'Arts & Culture',
  'Social Justice',
  'Animal Welfare',
  'Disaster Relief',
  'Youth Development',
  'Senior Support',
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];
```

### Responsive Breakpoints

```typescript
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

export const MOBILE_BREAKPOINT = 768;
```

### Map Configuration

```typescript
export const DEFAULT_MAP_CENTER = {
  lat: 25.79,
  lng: -80.13, // Miami, FL
} as const;

export const DEFAULT_MAP_ZOOM = 12;
```

## Validation Schemas

### Zod Schemas

Used for runtime type validation in API endpoints.

```typescript
import { z } from 'zod';

// Event validation schema
export const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(EVENT_CATEGORIES),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format'
  }),
  maxAttendees: z.number().positive().optional(),
});

// User validation schema
export const userSchema = z.object({
  displayName: z.string().optional(),
  email: z.string().email('Invalid email format'),
  photoURL: z.string().url().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

// Post validation schema
export const postSchema = z.object({
  content: z.string().min(1, 'Content is required').max(1000),
  eventId: z.string().min(1, 'Event ID is required'),
  imageUrl: z.string().url().optional(),
});
```

**Usage:**
```typescript
// Validate data
try {
  const validatedEvent = eventSchema.parse(eventData);
  // Data is now type-safe and validated
} catch (error) {
  // Handle validation errors
  console.error('Validation failed:', error.errors);
}

// Type inference from schema
type EventInput = z.infer<typeof eventSchema>;
```

## Error Handling Utilities

### Error Types

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}
```

### Error Handling Utilities

```typescript
// Safe async operation wrapper
export async function safeAsync<T>(
  operation: () => Promise<T>
): Promise<[T | null, Error | null]> {
  try {
    const result = await operation();
    return [result, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

// Usage
const [user, error] = await safeAsync(() => fetchUser(userId));
if (error) {
  console.error('Failed to fetch user:', error.message);
  return;
}
// user is guaranteed to be non-null here
```

## Performance Utilities

### Debounce

```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Usage
const debouncedSearch = debounce((query: string) => {
  performSearch(query);
}, 300);
```

### Throttle

```typescript
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage for scroll events
const throttledScrollHandler = throttle(() => {
  handleScroll();
}, 100);
```

## Type Utility Functions

### Type Guards

```typescript
export function isEvent(obj: any): obj is Event {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    obj.location &&
    typeof obj.location.lat === 'number' &&
    typeof obj.location.lng === 'number'
  );
}

export function isUser(obj: any): obj is AppUser {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string'
  );
}
```

### Utility Types

```typescript
// Make specific fields required
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Example usage
type EventWithLocation = RequiredFields<Event, 'location' | 'date'>;

// Deep partial type
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Extract array element type
export type ArrayElement<T> = T extends (infer U)[] ? U : never;
```