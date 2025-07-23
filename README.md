# Make Waves

Map-centric social app for real-world good.

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with the following variables:

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_ID=  # Required for Advanced Markers

# Firebase Admin SDK (for server-side)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

4. Run the development server: `npm run dev`

## Google Maps Advanced Markers

To use Google Maps Advanced Markers, you need to create a Map ID in the Google Cloud Console:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to the Google Maps Platform > Maps Management
4. Click "Create Map ID"
5. Give your map a name (e.g., "MakeWavesMap")
6. Select "Vector" as the map type
7. Click "Create"
8. Copy the generated Map ID to your `.env.local` file as `NEXT_PUBLIC_GOOGLE_MAPS_ID`

## Features

- Interactive map with event discovery
- Event attendance tracking
- Post creation tied to attended events
- Social feed and user profiles
- Friends system
