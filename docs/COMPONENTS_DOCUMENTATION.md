# Components Documentation

## Overview

Make Waves uses a component-based architecture with React and TypeScript. Components are organized into several categories: UI components (design system), feature components, layout components, and page components.

## UI Components (Design System)

All UI components are built on top of Radix UI primitives with custom styling using Tailwind CSS and class-variance-authority (CVA) for variant management.

### Button

A versatile button component with multiple variants and sizes.

**Location:** `src/components/ui/button.tsx`

**Props:**
```typescript
interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
import { Button } from '@/components/ui/button';

// Default button
<Button>Click me</Button>

// Variants
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Subtle</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus className="h-4 w-4" /></Button>

// As child (renders as another element)
<Button asChild>
  <Link href="/events">Go to Events</Link>
</Button>
```

### Card Components

Card components for content organization and display.

**Location:** `src/components/ui/card.tsx`

**Components:**
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title component
- `CardDescription` - Description text
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Usage:**
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Event Title</CardTitle>
    <CardDescription>Event description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content of the card</p>
  </CardContent>
</Card>
```

### Input Components

**Input**
Basic input field with consistent styling.

```tsx
import { Input } from '@/components/ui/input';

<Input 
  type="email" 
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**Textarea**
Multi-line text input for longer content.

```tsx
import { Textarea } from '@/components/ui/textarea';

<Textarea 
  placeholder="Enter description"
  rows={4}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

### Select Components

Dropdown select component with search and filtering.

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select value={category} onValueChange={setCategory}>
  <SelectTrigger>
    <SelectValue placeholder="Select category" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="environmental">Environmental</SelectItem>
    <SelectItem value="community">Community Service</SelectItem>
  </SelectContent>
</Select>
```

### Dialog Components

Modal dialog system for overlays and forms.

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <p>Dialog content goes here</p>
  </DialogContent>
</Dialog>
```

### Navigation Menu

Accessible navigation menu component.

```tsx
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu';

<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Events</NavigationMenuTrigger>
      <NavigationMenuContent>
        <Link href="/events">All Events</Link>
        <Link href="/my-events">My Events</Link>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

## Feature Components

### CreateEventModal

A comprehensive modal for creating new events with tabbed interface.

**Location:** `src/components/CreateEventModal.tsx`

**Props:**
```typescript
interface CreateEventModalProps {
  onEventCreated?: () => void;
  defaultLocation?: { lat: number; lng: number };
}
```

**Features:**
- Multi-step form with tabs (Details, Schedule, Location)
- Address geocoding integration
- Real-time validation
- Image upload support
- Category selection
- Date and time picking

**Usage:**
```tsx
import CreateEventModal from '@/components/CreateEventModal';

<CreateEventModal 
  onEventCreated={() => {
    // Refresh events list
    queryClient.invalidateQueries(['events']);
  }}
  defaultLocation={{ lat: 25.79, lng: -80.13 }}
/>
```

**Key Features:**
- **Address Geocoding:** Automatically converts addresses to coordinates
- **Form Validation:** Real-time validation with error messages
- **Location Preview:** Shows event location on map preview
- **Category Selection:** Predefined categories for events
- **Responsive Design:** Works on mobile and desktop

### AuthWidget

Authentication component handling login, signup, and user session display.

**Location:** `src/components/AuthWidget.tsx`

**Props:** None (self-contained)

**Features:**
- Email/password authentication
- Google OAuth integration
- User profile display when authenticated
- Mode switching between login and signup
- Error handling and loading states

**Usage:**
```tsx
import AuthWidget from '@/components/AuthWidget';

// Simple usage - handles all auth states internally
<AuthWidget />
```

**States:**
- **Unauthenticated:** Shows login/signup form
- **Authenticated:** Shows user profile with sign-out option
- **Loading:** Shows loading state during auth operations

### TrpcProvider

tRPC client provider that wraps the application with React Query.

**Location:** `src/components/TrpcProvider.tsx`

**Props:**
```typescript
interface TrpcProviderProps {
  children: React.ReactNode;
}
```

**Features:**
- Automatic authentication header injection
- Environment-aware base URL configuration
- SuperJSON serialization support
- React Query integration

**Usage:**
```tsx
import { TrpcProvider } from '@/components/TrpcProvider';

// Wrap your app or specific sections
<TrpcProvider>
  <App />
</TrpcProvider>
```

### ModeToggle

Theme toggle component for switching between light and dark modes.

**Location:** `src/components/ModeToggle.tsx`

**Props:** None

**Usage:**
```tsx
import { ModeToggle } from '@/components/ModeToggle';

// Typically placed in header or settings
<ModeToggle />
```

### EventList

Component for displaying a list of events with filtering and search.

**Location:** `src/components/EventList.tsx`

**Usage:**
```tsx
import EventList from '@/components/EventList';

<EventList />
```

## Layout Components

### Sidebar Layout

Application sidebar layout with navigation and responsive behavior.

**Location:** `src/components/sidebar-layout.tsx`

**Usage:**
```tsx
import SidebarLayout from '@/components/sidebar-layout';

<SidebarLayout>
  <YourPageContent />
</SidebarLayout>
```

### AppSidebar

Main application sidebar with navigation items.

**Location:** `src/components/app-sidebar.tsx`

**Features:**
- Navigation menu
- User profile section
- Responsive collapse/expand
- Current page highlighting

### Header

Application header with branding and navigation.

**Location:** `src/components/Header.tsx`

**Features:**
- Application logo/branding
- Primary navigation
- User account controls
- Mobile menu toggle

### Footer

Application footer with links and information.

**Location:** `src/components/Footer.tsx`

## Dashboard Components

### DashboardHeader

Header section for the dashboard with welcome message and quick stats.

**Location:** `src/components/dashboard/DashboardHeader.tsx`

### RecentPostsSection

Displays recent posts from attended events.

**Location:** `src/components/dashboard/RecentPostsSection.tsx`

### NearbyEventsSection

Shows events near the user's location.

**Location:** `src/components/dashboard/NearbyEventsSection.tsx`

### UpcomingEventsSection

Displays user's upcoming events and RSVPs.

**Location:** `src/components/dashboard/UpcomingEventsSection.tsx`

### MiniMapView

Compact map view for dashboard showing nearby events.

**Location:** `src/components/dashboard/MiniMapView.tsx`

## Utility Components

### ConditionalLayout

Wrapper component for conditional rendering based on authentication state.

**Location:** `src/components/conditional-layout.tsx`

**Usage:**
```tsx
import ConditionalLayout from '@/components/conditional-layout';

<ConditionalLayout>
  <ProtectedContent />
</ConditionalLayout>
```

### ThemeProvider

Theme provider component using next-themes for theme management.

**Location:** `src/components/theme-provider.tsx`

**Props:**
```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
}
```

**Usage:**
```tsx
import { ThemeProvider } from '@/components/theme-provider';

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <App />
</ThemeProvider>
```

### NavUser

User navigation component showing user profile and account options.

**Location:** `src/components/nav-user.tsx`

## Component Best Practices

### Props Interface

Always define TypeScript interfaces for component props:

```typescript
interface MyComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export default function MyComponent({ title, description, onAction }: MyComponentProps) {
  // Component implementation
}
```

### Event Handling

Use proper event typing and error handling:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await submitData();
  } catch (error) {
    console.error('Failed to submit:', error);
  }
};
```

### State Management

Use appropriate state management patterns:

```typescript
// Local state for component-specific data
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string>('');

// tRPC queries for server state
const { data: events, isLoading } = trpc.events.getAll.useQuery();

// Mutations for server updates
const createEvent = trpc.events.create.useMutation({
  onSuccess: () => {
    // Handle success
  },
  onError: (error) => {
    setError(error.message);
  }
});
```

### Accessibility

Ensure components are accessible:

```tsx
// Use semantic HTML
<button type="button" aria-label="Close dialog" onClick={onClose}>
  <X className="h-4 w-4" />
</button>

// Provide labels for form inputs
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" required />

// Use ARIA attributes when needed
<div role="alert" aria-live="polite">
  {error && <p>{error}</p>}
</div>
```

### Responsive Design

Components should work across all device sizes:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>

<Button className="w-full sm:w-auto">
  {/* Full width on mobile, auto on larger screens */}
</Button>
```

### Error Boundaries

Wrap components with error boundaries for better error handling:

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <YourComponent />
</ErrorBoundary>
```

## Testing Components

### Component Testing Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```