# API Documentation

## Overview

Make Waves uses tRPC for type-safe API communication between the client and server. The API is organized into three main routers: Events, Users, and Posts. All API endpoints use Zod for input validation and return type-safe responses.

## Base Configuration

### Authentication
Protected endpoints require Firebase authentication. Include the Firebase ID token in the Authorization header:
```typescript
headers: {
  authorization: `Bearer ${firebaseIdToken}`
}
```

### tRPC Client Setup
```typescript
import { trpc } from '@/lib/trpc';

// Use in React components
const { data, isLoading, error } = trpc.events.getAll.useQuery();
```

## Events API

The Events API manages event creation, retrieval, and management.

### Types

```typescript
interface Event {
  id: string;
  title: string;
  description?: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  date: string;
  maxAttendees?: number;
  attendees?: string[];
  createdBy?: string;
  createdAt?: string;
}
```

### Endpoints

#### `events.getAll`
**Type:** Public Query
**Description:** Retrieves all events from the database.

**Usage:**
```typescript
const { data: events, isLoading } = trpc.events.getAll.useQuery();
```

**Response:**
```typescript
Event[]
```

#### `events.getByBounds`
**Type:** Public Query
**Description:** Retrieves events within specified geographic bounds.

**Input:**
```typescript
{
  north: number;
  south: number;
  east: number;
  west: number;
}
```

**Usage:**
```typescript
const bounds = {
  north: 40.7831,
  south: 40.7489,
  east: -73.9441,
  west: -74.0059
};

const { data: events } = trpc.events.getByBounds.useQuery(bounds);
```

**Response:**
```typescript
Event[]
```

#### `events.getById`
**Type:** Public Query
**Description:** Retrieves a specific event by ID.

**Input:**
```typescript
{ id: string }
```

**Usage:**
```typescript
const { data: event } = trpc.events.getById.useQuery({ id: "event123" });
```

**Response:**
```typescript
Event
```

**Errors:**
- Throws "Event not found" if event doesn't exist

#### `events.create`
**Type:** Protected Mutation
**Description:** Creates a new event. Requires authentication.

**Input:**
```typescript
{
  title: string;
  description?: string;
  category: string;
  location: {
    lat: number;
    lng: number;
  };
  date: string;
  maxAttendees?: number;
}
```

**Usage:**
```typescript
const createEvent = trpc.events.create.useMutation();

const handleCreate = async () => {
  const newEvent = await createEvent.mutateAsync({
    title: "Community Cleanup",
    description: "Help clean up our local park",
    category: "Environment",
    location: { lat: 40.7589, lng: -73.9851 },
    date: "2024-02-15T10:00:00Z",
    maxAttendees: 50
  });
};
```

**Response:**
```typescript
Event & { id: string }
```

#### `events.update`
**Type:** Protected Mutation
**Description:** Updates an existing event. Only the event creator can update.

**Input:**
```typescript
{
  id: string;
  data: Partial<EventCreateInput>;
}
```

**Usage:**
```typescript
const updateEvent = trpc.events.update.useMutation();

const handleUpdate = async () => {
  await updateEvent.mutateAsync({
    id: "event123",
    data: { title: "Updated Event Title" }
  });
};
```

**Response:**
```typescript
{ success: true }
```

**Errors:**
- "Event not found" if event doesn't exist
- "Unauthorized" if user is not the creator

#### `events.delete`
**Type:** Protected Mutation
**Description:** Deletes an event. Only the event creator can delete.

**Input:**
```typescript
{ id: string }
```

**Usage:**
```typescript
const deleteEvent = trpc.events.delete.useMutation();

const handleDelete = async () => {
  await deleteEvent.mutateAsync({ id: "event123" });
};
```

**Response:**
```typescript
{ success: true }
```

**Errors:**
- "Event not found" if event doesn't exist
- "Unauthorized" if user is not the creator

## Users API

The Users API manages user profiles and authentication.

### Types

```typescript
interface User {
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

### Endpoints

#### `users.getAll`
**Type:** Public Query
**Description:** Retrieves all user profiles.

**Usage:**
```typescript
const { data: users } = trpc.users.getAll.useQuery();
```

**Response:**
```typescript
User[]
```

#### `users.getById`
**Type:** Public Query
**Description:** Retrieves a specific user by ID.

**Input:**
```typescript
{ id: string }
```

**Usage:**
```typescript
const { data: user } = trpc.users.getById.useQuery({ id: "user123" });
```

**Response:**
```typescript
User
```

**Errors:**
- "User not found" if user doesn't exist

#### `users.create`
**Type:** Protected Mutation
**Description:** Creates a new user profile. Requires authentication.

**Input:**
```typescript
{
  displayName?: string;
  email: string;
  photoURL?: string;
  bio?: string;
}
```

**Usage:**
```typescript
const createUser = trpc.users.create.useMutation();

const handleCreateProfile = async () => {
  const profile = await createUser.mutateAsync({
    displayName: "John Doe",
    email: "john@example.com",
    bio: "Community volunteer and environmental advocate"
  });
};
```

**Response:**
```typescript
User
```

#### `users.update`
**Type:** Protected Mutation
**Description:** Updates the authenticated user's profile.

**Input:**
```typescript
{
  displayName?: string;
  email?: string;
  photoURL?: string;
  bio?: string;
}
```

**Usage:**
```typescript
const updateUser = trpc.users.update.useMutation();

const handleUpdate = async () => {
  await updateUser.mutateAsync({
    displayName: "Jane Doe",
    bio: "Updated bio"
  });
};
```

**Response:**
```typescript
{ success: true }
```

#### `users.getProfile`
**Type:** Protected Query
**Description:** Retrieves the authenticated user's profile.

**Usage:**
```typescript
const { data: profile } = trpc.users.getProfile.useQuery();
```

**Response:**
```typescript
User | null
```

## Posts API

The Posts API manages social posts tied to attended events.

### Types

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

### Endpoints

#### `posts.getAll`
**Type:** Public Query
**Description:** Retrieves all posts ordered by creation date (newest first).

**Usage:**
```typescript
const { data: posts } = trpc.posts.getAll.useQuery();
```

**Response:**
```typescript
Post[]
```

#### `posts.getById`
**Type:** Public Query
**Description:** Retrieves a specific post by ID.

**Input:**
```typescript
{ id: string }
```

**Usage:**
```typescript
const { data: post } = trpc.posts.getById.useQuery({ id: "post123" });
```

**Response:**
```typescript
Post
```

**Errors:**
- "Post not found" if post doesn't exist

#### `posts.getByEventId`
**Type:** Public Query
**Description:** Retrieves all posts for a specific event.

**Input:**
```typescript
{ eventId: string }
```

**Usage:**
```typescript
const { data: posts } = trpc.posts.getByEventId.useQuery({ eventId: "event123" });
```

**Response:**
```typescript
Post[]
```

#### `posts.create`
**Type:** Protected Mutation
**Description:** Creates a new post. User must have attended the event.

**Input:**
```typescript
{
  content: string;
  eventId: string;
  imageUrl?: string;
}
```

**Usage:**
```typescript
const createPost = trpc.posts.create.useMutation();

const handleCreatePost = async () => {
  const post = await createPost.mutateAsync({
    content: "Great event! Thanks to everyone who participated.",
    eventId: "event123",
    imageUrl: "https://example.com/image.jpg"
  });
};
```

**Response:**
```typescript
Post & { id: string }
```

**Errors:**
- "You can only post about events you have attended" if user hasn't attended the event

#### `posts.update`
**Type:** Protected Mutation
**Description:** Updates an existing post. Only the post author can update.

**Input:**
```typescript
{
  id: string;
  data: {
    content?: string;
    imageUrl?: string;
  };
}
```

**Usage:**
```typescript
const updatePost = trpc.posts.update.useMutation();

const handleUpdate = async () => {
  await updatePost.mutateAsync({
    id: "post123",
    data: { content: "Updated post content" }
  });
};
```

**Response:**
```typescript
{ success: true }
```

**Errors:**
- "Post not found" if post doesn't exist
- "Unauthorized" if user is not the author

#### `posts.delete`
**Type:** Protected Mutation
**Description:** Deletes a post. Only the post author can delete.

**Input:**
```typescript
{ id: string }
```

**Usage:**
```typescript
const deletePost = trpc.posts.delete.useMutation();

const handleDelete = async () => {
  await deletePost.mutateAsync({ id: "post123" });
};
```

**Response:**
```typescript
{ success: true }
```

**Errors:**
- "Post not found" if post doesn't exist
- "Unauthorized" if user is not the author

## Error Handling

All tRPC procedures follow standard error conventions:

```typescript
const { data, error, isLoading } = trpc.events.getById.useQuery({ id: "123" });

if (error) {
  // Handle specific errors
  switch (error.message) {
    case 'Event not found':
      // Handle not found
      break;
    case 'Unauthorized':
      // Handle unauthorized
      break;
    default:
      // Handle general error
  }
}
```

## Authentication Context

Use the Firebase authentication context to check user state:

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;
  
  // User is authenticated
  return <div>Welcome, {user.displayName}</div>;
}
```

## Rate Limiting and Best Practices

- Use React Query's built-in caching for GET requests
- Implement optimistic updates for mutations
- Handle loading and error states appropriately
- Use TypeScript for full type safety
- Validate inputs on both client and server sides