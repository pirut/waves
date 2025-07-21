# Make Waves App Design Spec

## 🌊 Overview

**Make Waves** is a map-centric social app where users discover, attend, and post about real-world events focused on doing good. Users can only create posts if they are attached to an attended event, which ensures all shared content is rooted in real-life impact.

Target audience: **General public** Design style: **Clean and minimalist** Color theme: **Pastel peachy palette** (baby blue, sand, peach, white)

---

## 🛠️ Tech Stack Recommendations

### Frontend

- **Framework**: Next.js (deployed on Vercel)
- **Styling**: Tailwind CSS
- **Map**: `@react-google-maps/api` (Google Maps JS API)
- **State Management**: Zustand (simple and scalable)

### Backend

- **Auth, DB, Functions**: Firebase
  - Firestore for users, events, posts, friendships
  - Firebase Auth (Google login)
  - Firebase Functions for logic (e.g., validate posts)
- **Media CDN**: UploadThing (for photos/videos)

---

## 🌍 Core Screens & Layouts

### 1. **Landing Page**

- Hero section: Logo text ("Make Waves") + short description
- CTA: "Find Events Near You"
- Sign-in: Google login button

### 2. **Main Map Screen**

- Full-screen map with:
  - Event pins (category-color coded)
  - Current location marker
- Top bar: Search input, category filters
- Bottom sheet (optional): List view of upcoming events in view
- Floating Action Button: ➕ Create Event (optional/admin only)

### 3. **Event Details Page**

- Event title, category, date/time
- Location map snippet
- Description
- RSVP / Join button
- Event image carousel (from attendee posts)
- Button: "Post about this event"

### 4. **Post Creation Modal**

- File upload (image/video) via UploadThing
- Text area for caption
- Dropdown to pick event (joined + recent)
- Submit button (disabled unless event selected)

### 5. **Social Feed**

- Scrollable feed of posts
- Each post shows:
  - Media
  - User name, profile photo
  - Event it was attached to
  - Likes, comments (if implemented later)

### 6. **User Profile Page**

- Profile photo + name
- Stats: # Events attended, # Friends
- Badges (e.g., "10 Waves Made")
- Grid of media posts

### 7. **Friends System**

- Follow/unfollow or friend requests
- Optional: Messaging (future feature)

---

## 🔢 Firestore Data Models

### users

```json
{
  "id": "user_123",
  "name": "Jane Doe",
  "profilePhotoUrl": "...",
  "friends": ["user_456"],
  "attendedEvents": ["event_001"],
  "badges": ["10_events"]
}
```

### events

```json
{
  "id": "event_001",
  "title": "Beach Cleanup",
  "description": "Join us for a local cleanup.",
  "location": { "lat": 26.7, "lng": -80.0 },
  "time": "2025-07-10T15:00:00Z",
  "category": "Environmental",
  "attendees": ["user_123"]
}
```

### posts

```json
{
  "id": "post_001",
  "userId": "user_123",
  "eventId": "event_001",
  "mediaUrl": "...",
  "caption": "Had a blast cleaning the beach!",
  "timestamp": "2025-07-10T17:00:00Z"
}
```

---

## 📊 App Flow Summary

1. User signs in via Google
2. Map loads nearby events (pins)
3. User taps an event pin
4. They RSVP and attend the event
5. After event, they upload photos tied to that event
6. Post appears in feed and on event page
7. Friends can view, like, and attend their own events

---

## 🔹 Color Palette

- Baby Blue: `#B3DFF2`
- Sand: `#F6E8D6`
- Warm Peach: `#FFE5D4`
- White: `#FFFFFF`
- Accent Gray: `#7F8C8D` (optional text color)

---

## 🌌 Future Features

- Leaderboards: Top contributors
- AI event suggestions
- Event approval flow
- SMS notifications
- Messaging between friends
