# MapView Component

A unified, reusable Google Maps component that can be used throughout the Make Waves app.

## Features

- **Flexible Configuration**: Supports interactive and non-interactive modes
- **Event Markers**: Displays events with category-based colored markers
- **User Location**: Automatically detects and centers on user location
- **Bounds Filtering**: Filters events based on current map view
- **Click Handling**: Supports map clicks and event marker clicks
- **Overlay Support**: Can show click overlays for non-interactive maps
- **Responsive**: Works on all screen sizes
- **Customizable**: Extensive props for different use cases

## Basic Usage

```tsx
import { MapView } from '@/components/MapView';

// Simple interactive map
<MapView events={events} className="h-[400px]" interactive={true} />;
```

## Props

### Core Props

- `events?: Event[]` - Array of events to display as markers
- `className?: string` - CSS classes for the container
- `interactive?: boolean` - Enable/disable user interaction (default: true)

### Map Behavior

- `showZoomControls?: boolean` - Show zoom in/out buttons
- `showFullscreenControl?: boolean` - Show fullscreen button
- `gestureHandling?: 'cooperative' | 'greedy' | 'none' | 'auto'` - How to handle gestures

### Initial State

- `center?: { lat: number; lng: number }` - Initial map center
- `zoom?: number` - Initial zoom level (default: 10)
- `minZoom?: number` - Minimum zoom level (default: 8)
- `maxZoom?: number` - Maximum zoom level (default: 18)

### Event Handling

- `onBoundsChanged?: (events: Event[]) => void` - Called when map bounds change
- `onEventClick?: (event: Event) => void` - Called when event marker is clicked
- `onMapClick?: (lat: number, lng: number) => void` - Called when map is clicked

### Display Options

- `showEventMarkers?: boolean` - Show event markers (default: true)
- `showUserLocation?: boolean` - Detect and show user location (default: true)
- `showInfoWindows?: boolean` - Show info windows on marker click (default: true)

### Overlay Options

- `showClickOverlay?: boolean` - Show transparent click overlay
- `overlayClickAction?: () => void` - Action when overlay is clicked
- `overlayTitle?: string` - Tooltip for overlay

### Custom Components

- `loadingComponent?: React.ReactNode` - Custom loading component
- `emptyStateComponent?: React.ReactNode` - Custom empty state component

## Common Use Cases

### 1. Dashboard Mini Map

```tsx
<MapView
  events={events}
  className="h-[400px]"
  interactive={false}
  showClickOverlay={true}
  overlayClickAction={() => router.push('/map')}
  onBoundsChanged={setEventsInView}
/>
```

### 2. Full Interactive Map

```tsx
<MapView
  events={events}
  className="h-screen"
  interactive={true}
  showZoomControls={true}
  showFullscreenControl={true}
  gestureHandling="greedy"
  onEventClick={handleEventClick}
  onMapClick={handleMapClick}
/>
```

### 3. Event Detail Map

```tsx
<MapView
  events={[event]}
  className="h-[300px]"
  center={event.location}
  zoom={15}
  showInfoWindows={false}
/>
```

### 4. Location Picker

```tsx
<MapView
  events={[]}
  className="h-[400px]"
  showEventMarkers={false}
  onMapClick={handleLocationSelect}
/>
```

### 5. Static Preview

```tsx
<MapView
  events={[event]}
  className="h-[200px]"
  interactive={false}
  center={event.location}
  zoom={14}
  showUserLocation={false}
  showInfoWindows={false}
/>
```

## Migration from Old Components

### From MiniMapView

```tsx
// Old
<MiniMapView
  events={events}
  className="h-[400px]"
  onBoundsChanged={handleBounds}
/>

// New
<MapView
  events={events}
  className="h-[400px]"
  interactive={false}
  showClickOverlay={true}
  overlayClickAction={() => router.push('/map')}
  onBoundsChanged={handleBounds}
/>
```

### From ImprovedMapView

The main map view has complex clustering and sidebar integration, so it should be migrated carefully or kept as-is for now.

## Notes

- Requires Google Maps API key in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Uses MapBoundsContext for sharing bounds across components
- Automatically handles marker cleanup and memory management
- Supports all Google Maps gesture handling modes
- Category-based marker colors are automatically applied
