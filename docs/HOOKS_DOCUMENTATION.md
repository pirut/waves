# Hooks Documentation

## Overview

Make Waves uses custom React hooks to encapsulate reusable stateful logic. These hooks follow React best practices and provide clean APIs for common functionality like authentication, responsive design, and map state management.

## Authentication Hooks

### useAuth

A hook that manages Firebase authentication state and provides user information.

**Location:** `src/hooks/useAuth.ts`

**Returns:**
```typescript
{
  user: User | null;           // Firebase user object or null
  loading: boolean;            // True while auth state is being determined
}
```

**Usage:**
```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to continue</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.displayName || user.email}!</h1>
      <p>User ID: {user.uid}</p>
    </div>
  );
}
```

**Key Features:**
- Automatically subscribes to Firebase auth state changes
- Handles loading states during authentication
- Cleans up subscriptions on unmount
- Returns null for user when not authenticated
- Provides immediate access to user information

**Implementation Details:**
```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  return { user, loading };
}
```

**Usage Patterns:**

1. **Protected Routes:**
```tsx
function ProtectedPage() {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  
  return <DashboardContent />;
}
```

2. **Conditional Rendering:**
```tsx
function Header() {
  const { user } = useAuth();
  
  return (
    <header>
      <Logo />
      {user ? <UserMenu user={user} /> : <LoginButton />}
    </header>
  );
}
```

3. **User-specific Data Fetching:**
```tsx
function UserProfile() {
  const { user } = useAuth();
  const { data: profile } = trpc.users.getProfile.useQuery(
    undefined,
    { enabled: !!user } // Only fetch when user is authenticated
  );
  
  return <ProfileDisplay profile={profile} />;
}
```

## Responsive Design Hooks

### useIsMobile

A hook that detects if the current viewport is mobile-sized based on a breakpoint.

**Location:** `src/hooks/use-mobile.ts`

**Returns:**
```typescript
boolean // True if viewport width is less than 768px
```

**Usage:**
```tsx
import { useIsMobile } from '@/hooks/use-mobile';

function ResponsiveComponent() {
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? (
        <MobileNavigation />
      ) : (
        <DesktopNavigation />
      )}
    </div>
  );
}
```

**Key Features:**
- Uses `window.matchMedia` for efficient viewport detection
- Automatically updates on window resize
- Uses a 768px breakpoint (mobile < 768px)
- Handles SSR by returning `undefined` initially
- Adds and removes event listeners properly

**Implementation Details:**
```typescript
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
```

**Usage Patterns:**

1. **Conditional Component Rendering:**
```tsx
function Layout({ children }) {
  const isMobile = useIsMobile();
  
  return (
    <div className="app-layout">
      {isMobile ? <MobileSidebar /> : <DesktopSidebar />}
      <main>{children}</main>
    </div>
  );
}
```

2. **Dynamic Styling:**
```tsx
function Modal() {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "modal",
      isMobile ? "modal-mobile" : "modal-desktop"
    )}>
      <ModalContent />
    </div>
  );
}
```

3. **Event Handling:**
```tsx
function InteractiveMap() {
  const isMobile = useIsMobile();
  
  const handleMapClick = (event) => {
    if (isMobile) {
      // Handle touch interactions differently
      handleTouchInteraction(event);
    } else {
      // Standard mouse interactions
      handleMouseInteraction(event);
    }
  };
  
  return <Map onClick={handleMapClick} />;
}
```

## Map State Hooks

### useMapBounds

A hook that provides access to the current map bounds context for location-based filtering.

**Location:** `src/contexts/MapBoundsContext.tsx`

**Returns:**
```typescript
{
  mapBounds: google.maps.LatLngBounds | null;
  setMapBounds: (bounds: google.maps.LatLngBounds | null) => void;
}
```

**Usage:**
```tsx
import { useMapBounds } from '@/contexts/MapBoundsContext';

function EventList() {
  const { mapBounds } = useMapBounds();
  
  // Only fetch events within current map bounds
  const { data: events } = trpc.events.getByBounds.useQuery(
    mapBounds ? {
      north: mapBounds.getNorthEast().lat(),
      south: mapBounds.getSouthWest().lat(),
      east: mapBounds.getNorthEast().lng(),
      west: mapBounds.getSouthWest().lng(),
    } : null,
    { enabled: !!mapBounds }
  );
  
  return <EventGrid events={events} />;
}
```

**Provider Setup:**
```tsx
import { MapBoundsProvider } from '@/contexts/MapBoundsContext';

function App() {
  return (
    <MapBoundsProvider>
      <MapView />
      <EventList />
    </MapBoundsProvider>
  );
}
```

**Key Features:**
- Shares map bounds between components
- Enables location-based data filtering
- Automatically updates when map viewport changes
- Provides null safety for bounds operations

**Implementation Details:**
```typescript
const MapBoundsContext = createContext<MapBoundsContextType | undefined>(undefined);

export function useMapBounds() {
  const context = useContext(MapBoundsContext);
  if (context === undefined) {
    throw new Error('useMapBounds must be used within a MapBoundsProvider');
  }
  return context;
}
```

**Usage Patterns:**

1. **Map Component (Setting Bounds):**
```tsx
function MapView() {
  const { setMapBounds } = useMapBounds();
  
  const handleBoundsChanged = (map: google.maps.Map) => {
    const bounds = map.getBounds();
    setMapBounds(bounds);
  };
  
  return (
    <GoogleMap
      onBoundsChanged={handleBoundsChanged}
      onLoad={handleBoundsChanged}
    >
      <MapMarkers />
    </GoogleMap>
  );
}
```

2. **Event List (Using Bounds):**
```tsx
function EventsNearby() {
  const { mapBounds } = useMapBounds();
  
  const boundsQuery = useMemo(() => {
    if (!mapBounds) return null;
    
    return {
      north: mapBounds.getNorthEast().lat(),
      south: mapBounds.getSouthWest().lat(),
      east: mapBounds.getNorthEast().lng(),
      west: mapBounds.getSouthWest().lng(),
    };
  }, [mapBounds]);
  
  const { data: events } = trpc.events.getByBounds.useQuery(
    boundsQuery,
    { enabled: !!boundsQuery }
  );
  
  return <EventList events={events || []} />;
}
```

3. **Statistics Component:**
```tsx
function MapStatistics() {
  const { mapBounds } = useMapBounds();
  
  const area = useMemo(() => {
    if (!mapBounds) return 0;
    
    const ne = mapBounds.getNorthEast();
    const sw = mapBounds.getSouthWest();
    
    // Calculate approximate area
    return Math.abs(ne.lat() - sw.lat()) * Math.abs(ne.lng() - sw.lng());
  }, [mapBounds]);
  
  return (
    <div>
      <p>Viewing area: {area.toFixed(4)}° square</p>
    </div>
  );
}
```

## Hook Best Practices

### Custom Hook Creation

Follow these patterns when creating new hooks:

```typescript
// 1. Use descriptive names starting with 'use'
export function useEventSubscription(eventId: string) {
  // 2. Handle loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // 3. Always clean up subscriptions/timers
    const unsubscribe = subscribeToEvent(eventId, {
      onData: setData,
      onError: setError,
      onLoading: setLoading
    });
    
    return () => unsubscribe();
  }, [eventId]); // 4. Include all dependencies
  
  // 5. Return a consistent interface
  return { data, loading, error };
}
```

### Error Handling

Handle errors gracefully in hooks:

```typescript
export function useAsyncOperation() {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null
  });
  
  const execute = useCallback(async (params) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await performOperation(params);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
      throw error; // Re-throw for component-level handling
    }
  }, []);
  
  return { ...state, execute };
}
```

### Dependency Management

Be careful with useEffect dependencies:

```typescript
// ❌ Missing dependencies
useEffect(() => {
  fetchData(userId, filters);
}, []); // Missing userId and filters

// ✅ All dependencies included
useEffect(() => {
  fetchData(userId, filters);
}, [userId, filters]);

// ✅ Using callback to avoid recreating functions
const fetchData = useCallback(async (id, filters) => {
  // fetch logic
}, []);

useEffect(() => {
  fetchData(userId, filters);
}, [fetchData, userId, filters]);
```

### TypeScript Integration

Use proper typing for hook parameters and returns:

```typescript
interface UseApiOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  url: string, 
  options: UseApiOptions = {}
): UseApiReturn<T> {
  // Implementation
}
```

### Testing Hooks

Test hooks using React Testing Library:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
  it('should return loading state initially', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });
  
  it('should update user when authenticated', async () => {
    const { result } = renderHook(() => useAuth());
    
    // Mock authentication
    await act(async () => {
      // Trigger auth state change
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeTruthy();
  });
});
```