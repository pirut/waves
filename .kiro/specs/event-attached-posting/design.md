# Design Document

## Overview

The event-attached posting system enforces Make Waves' core constraint that all user-generated content must be tied to real-world events that users have attended. This design builds upon the existing Next.js/Firebase architecture to add validation layers, user experience enhancements, and data integrity measures that ensure posts can only be created when attached to attended events.

## Architecture

### High-Level Flow

1. User attempts to create a post
2. System validates user has attended at least one event
3. User selects from their attended events
4. System validates the event selection and user attendance
5. Post is created with required event attachment
6. Post appears in feeds with event context

### Key Components

-   **Post Creation Interface**: Enhanced UI with event selection
-   **Attendance Validation Service**: Server-side validation logic
-   **Event-Post Relationship Management**: Data model updates
-   **User Experience Enhancements**: Guidance and error handling

## Components and Interfaces

### 1. Enhanced Post Creation Component (`CreatePostModal.tsx`)

```typescript
interface CreatePostModalProps {
    onPostCreated?: () => void;
    preselectedEventId?: string;
}

interface AttendedEvent {
    id: string;
    title: string;
    date: string;
    category: string;
    location: {
        address: string;
    };
}

interface PostFormData {
    caption: string;
    mediaUrl?: string;
    eventId: string;
    userId: string;
}
```

**Key Features:**

-   Fetches user's attended events on component mount
-   Displays event selection interface with event details
-   Shows guidance messages when no attended events exist
-   Validates event selection before submission
-   Provides clear error messaging

### 2. Attendance Validation Service

**Client-side validation:**

```typescript
// src/services/attendanceValidation.ts
export async function getUserAttendedEvents(userId: string): Promise<AttendedEvent[]>;
export async function validateUserAttendance(userId: string, eventId: string): Promise<boolean>;
```

**Server-side validation:**

```typescript
// Enhanced POST /api/posts route
- Validate eventId exists in events collection
- Validate user is in event's attendees array
- Validate user attendance record exists
- Return detailed error messages for validation failures
```

### 3. Enhanced Data Models

**Post Model (Firestore document):**

```typescript
interface Post {
    id: string;
    caption: string;
    mediaUrl?: string;
    userId: string;
    eventId: string; // Required field
    createdAt: string;
    updatedAt: string;
}
```

**Event Model (existing, with attendance tracking):**

```typescript
interface Event {
    id: string;
    title: string;
    description: string;
    category: string;
    time: string;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    attendees: string[]; // Array of user IDs
    createdBy: string;
    createdAt: string;
    status: "active" | "completed" | "cancelled";
}
```

**User Model (enhanced with attended events):**

```typescript
interface User {
    id: string;
    email: string;
    displayName: string;
    attendedEvents: string[]; // Array of event IDs for quick lookup
    createdAt: string;
    updatedAt: string;
}
```

### 4. Event Selection Interface

**EventSelector Component:**

-   Grid/list view of attended events
-   Event cards showing title, date, category, and location
-   Search/filter functionality for users with many attended events
-   Visual indicators for recently attended events
-   Empty state with call-to-action to attend events

### 5. Post Display Components

**Enhanced PostCard Component:**

-   Display event context (title, date, category)
-   Clickable event reference that navigates to event detail page
-   Visual event badge/tag
-   Consistent styling with Make Waves design system

## Data Models

### Firestore Collections Structure

**posts collection:**

```json
{
    "id": "post_123",
    "caption": "Amazing beach cleanup today!",
    "mediaUrl": "https://storage.googleapis.com/...",
    "userId": "user_456",
    "eventId": "event_789", // Required foreign key
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
}
```

**events collection (existing):**

```json
{
    "id": "event_789",
    "title": "South Beach Cleanup",
    "attendees": ["user_456", "user_123"]
    // ... other event fields
}
```

**users collection (enhanced):**

```json
{
    "id": "user_456",
    "attendedEvents": ["event_789", "event_101"]
    // ... other user fields
}
```

### Data Relationships

-   **One-to-Many**: Event → Posts (one event can have many posts)
-   **Many-to-Many**: Users ↔ Events (users can attend multiple events, events can have multiple attendees)
-   **One-to-Many**: User → Posts (one user can create many posts)

## Error Handling

### Client-Side Error States

1. **No Attended Events:**

    - Display encouraging message with event discovery CTA
    - Show nearby events or popular events
    - Disable post creation with clear explanation

2. **Event Selection Required:**

    - Highlight event selection field
    - Show validation message
    - Prevent form submission

3. **Network/API Errors:**
    - Show retry mechanisms
    - Graceful degradation
    - Clear error messaging

### Server-Side Validation Errors

1. **Invalid Event ID (400):**

    ```json
    {
        "error": "Invalid event ID",
        "message": "The selected event does not exist",
        "code": "INVALID_EVENT_ID"
    }
    ```

2. **User Not Attended (403):**

    ```json
    {
        "error": "Attendance required",
        "message": "You must attend an event before posting about it",
        "code": "ATTENDANCE_REQUIRED"
    }
    ```

3. **Missing Event Attachment (400):**
    ```json
    {
        "error": "Event attachment required",
        "message": "All posts must be attached to an attended event",
        "code": "EVENT_ATTACHMENT_REQUIRED"
    }
    ```

## Testing Strategy

### Unit Tests

1. **Attendance Validation Service:**

    - Test getUserAttendedEvents with various user states
    - Test validateUserAttendance with valid/invalid combinations
    - Test error handling for network failures

2. **Post Creation Component:**

    - Test rendering with/without attended events
    - Test event selection functionality
    - Test form validation and submission
    - Test error state handling

3. **API Route Validation:**
    - Test post creation with valid event attachment
    - Test rejection of posts without event attachment
    - Test validation of user attendance
    - Test error response formats

### Integration Tests

1. **End-to-End Post Creation Flow:**

    - User attends event → creates post → post appears with event context
    - User without attended events → sees guidance message
    - Invalid event selection → shows appropriate error

2. **Data Consistency Tests:**
    - Verify post-event relationships in database
    - Test cascade behavior when events are deleted
    - Verify user attendance tracking accuracy

### User Experience Tests

1. **Event Selection Interface:**

    - Test with 0, 1, and many attended events
    - Test search and filter functionality
    - Test responsive design across devices

2. **Error State Handling:**
    - Test all error scenarios with appropriate messaging
    - Test recovery flows and retry mechanisms
    - Test accessibility of error states

## Implementation Considerations

### Performance Optimizations

-   Cache user's attended events in component state
-   Implement pagination for users with many attended events
-   Use Firestore compound queries for efficient event-post lookups
-   Optimize image uploads with compression and CDN

### Security Measures

-   Server-side validation of all event-post relationships
-   Rate limiting on post creation endpoints
-   Input sanitization for post content
-   Firebase Security Rules updates for post collection

### Accessibility

-   Screen reader support for event selection interface
-   Keyboard navigation for all interactive elements
-   High contrast mode support
-   Clear focus indicators and error announcements

### Mobile Considerations

-   Touch-friendly event selection interface
-   Optimized image upload flow
-   Responsive design for various screen sizes
-   Offline capability for draft posts
