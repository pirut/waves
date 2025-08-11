# Make Waves Documentation

## Overview

Make Waves is a map-centric social application built for real-world good. This comprehensive documentation covers all aspects of the application, from setup and development to API usage and component architecture.

## Architecture

Make Waves is built using modern web technologies with a focus on type safety, performance, and developer experience:

- **Frontend:** Next.js 15 with React 19 and TypeScript
- **Styling:** Tailwind CSS with Radix UI components
- **API Layer:** tRPC for type-safe client-server communication
- **Database:** Firebase Firestore for real-time data
- **Authentication:** Firebase Auth with Google OAuth
- **Maps:** Google Maps Platform with Advanced Markers
- **Deployment:** Optimized for Vercel and other modern platforms

## Documentation Structure

### 📚 [API Documentation](./API_DOCUMENTATION.md)
Complete reference for all tRPC APIs including:
- **Events API** - Create, read, update, and delete events
- **Users API** - User profile management and authentication
- **Posts API** - Social posts tied to attended events
- **Error Handling** - Standard error patterns and responses
- **Authentication** - Firebase token-based security

### 🧩 [Components Documentation](./COMPONENTS_DOCUMENTATION.md)
Comprehensive guide to all React components:
- **UI Components** - Design system built on Radix UI
- **Feature Components** - Complex components like CreateEventModal
- **Layout Components** - Application structure and navigation
- **Best Practices** - Patterns for component development
- **Testing Strategies** - Component testing approaches

### 🪝 [Hooks Documentation](./HOOKS_DOCUMENTATION.md)
Custom React hooks for reusable logic:
- **useAuth** - Firebase authentication state management
- **useIsMobile** - Responsive design breakpoint detection
- **useMapBounds** - Map viewport state sharing
- **Best Practices** - Hook development patterns
- **Testing** - Hook testing with React Testing Library

### 🔧 [Utilities and Types](./UTILITIES_AND_TYPES.md)
Core utilities, types, and configuration:
- **Utility Functions** - Shared helper functions like `cn()`
- **TypeScript Types** - Interfaces for Events, Users, Posts
- **Firebase Configuration** - Client and server setup
- **Environment Variables** - Required configuration
- **Validation Schemas** - Zod schemas for runtime validation

### 🚀 [Developer Setup Guide](./DEVELOPER_SETUP_GUIDE.md)
Complete development environment setup:
- **Prerequisites** - System requirements and tools
- **Installation** - Step-by-step setup instructions
- **Firebase Setup** - Database and authentication configuration
- **Google Maps Setup** - Maps API configuration
- **Development Workflow** - Best practices and commands
- **Debugging** - Common issues and solutions

## Quick Start

### For Developers

1. **Setup Environment**
   ```bash
   git clone <repository-url>
   cd make-waves
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase and Google Maps credentials
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Read the Docs**
   - Start with [Developer Setup Guide](./DEVELOPER_SETUP_GUIDE.md)
   - Explore [Components Documentation](./COMPONENTS_DOCUMENTATION.md) for UI patterns
   - Reference [API Documentation](./API_DOCUMENTATION.md) for backend integration

### For API Users

1. **Authentication**
   ```typescript
   import { useAuth } from '@/hooks/useAuth';
   
   const { user, loading } = useAuth();
   ```

2. **API Calls**
   ```typescript
   import { trpc } from '@/lib/trpc';
   
   const { data: events } = trpc.events.getAll.useQuery();
   ```

3. **Component Usage**
   ```tsx
   import { Button } from '@/components/ui/button';
   import CreateEventModal from '@/components/CreateEventModal';
   
   <CreateEventModal onEventCreated={() => refetch()} />
   ```

## Key Features

### 🗺️ Interactive Map
- Google Maps integration with Advanced Markers
- Real-time event discovery based on map bounds
- Location-based filtering and search
- Responsive design for mobile and desktop

### 🎯 Event Management
- Create events with detailed information
- Address geocoding for accurate positioning
- Category-based organization
- Attendance tracking and limits

### 👥 Social Features
- User profiles with Firebase authentication
- Post creation tied to attended events
- Social feed with event-based content
- Friends system and networking

### 🔐 Security
- Firebase Authentication with Google OAuth
- Protected API endpoints with JWT tokens
- Firestore security rules
- Input validation with Zod schemas

### 📱 Responsive Design
- Mobile-first design approach
- Tailwind CSS for consistent styling
- Radix UI for accessible components
- Custom hooks for responsive behavior

## Technology Deep Dive

### Type Safety
The application leverages TypeScript throughout the stack:
- **Frontend:** React components with proper prop typing
- **API:** tRPC for end-to-end type safety
- **Database:** Typed Firestore operations
- **Validation:** Zod schemas for runtime type checking

### Performance
Optimizations for fast user experience:
- **Next.js App Router** for optimized routing
- **React Query** for efficient data fetching
- **Firebase caching** for offline support
- **Tailwind CSS** for optimized styling

### Developer Experience
Tools and patterns for productive development:
- **TypeScript** for code intelligence
- **ESLint/Prettier** for code quality
- **Hot reload** for fast iteration
- **Comprehensive documentation** for onboarding

## API Overview

### tRPC Routers

#### Events Router
```typescript
// Get all events
trpc.events.getAll.useQuery()

// Get events in map bounds
trpc.events.getByBounds.useQuery({ north, south, east, west })

// Create new event (requires auth)
trpc.events.create.useMutation()
```

#### Users Router
```typescript
// Get user profile
trpc.users.getProfile.useQuery()

// Update profile (requires auth)
trpc.users.update.useMutation()
```

#### Posts Router
```typescript
// Get all posts
trpc.posts.getAll.useQuery()

// Create post (requires auth and event attendance)
trpc.posts.create.useMutation()
```

## Component Examples

### Basic Usage
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function EventCard({ event }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{event.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{event.description}</p>
        <Button>Join Event</Button>
      </CardContent>
    </Card>
  );
}
```

### Complex Components
```tsx
import CreateEventModal from '@/components/CreateEventModal';
import { useAuth } from '@/hooks/useAuth';

function EventManagement() {
  const { user } = useAuth();
  
  if (!user) return <div>Please log in</div>;
  
  return (
    <CreateEventModal 
      onEventCreated={() => {
        // Refresh events list
        queryClient.invalidateQueries(['events']);
      }}
      defaultLocation={{ lat: 25.79, lng: -80.13 }}
    />
  );
}
```

## Contributing

### Documentation Updates

When making changes to the codebase:

1. **Update API docs** if adding/modifying tRPC procedures
2. **Update component docs** if creating/changing components
3. **Update type docs** if adding/modifying TypeScript interfaces
4. **Update setup guide** if changing development requirements

### Documentation Standards

- Use clear, descriptive headings
- Include code examples for all APIs and components
- Document all props, parameters, and return types
- Provide usage examples for common scenarios
- Keep examples up-to-date with the current codebase

## Support and Resources

### Getting Help

1. **Check Documentation** - Start with the relevant documentation section
2. **Code Examples** - Look at existing components and usage patterns
3. **TypeScript Errors** - Enable strict mode for better error messages
4. **Firebase Console** - Check authentication and database status
5. **Browser DevTools** - Use React DevTools and Network tab

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://radix-ui.com/)

### Development Tools

- **VS Code Extensions** - See setup guide for recommended extensions
- **React DevTools** - Browser extension for React debugging
- **Firebase Emulator** - Local development environment
- **Postman/Insomnia** - API testing (though tRPC Panel is recommended)

---

This documentation is actively maintained and updated with each release. For the most current information, always refer to the latest version in the repository.