# Project Structure & Organization

## Directory Layout

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── events/            # Event-related pages
│   ├── map/               # Map view pages
│   ├── login/             # Authentication pages
│   ├── profile/           # User profile pages
│   └── account/           # Account management
├── components/            # Reusable React components
│   └── ui/               # Base UI components (Radix-based)
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── firebase.ts           # Firebase client configuration
└── firebaseAdmin.ts      # Firebase admin configuration
```

## File Naming Conventions

- **Pages**: Use folder structure with `page.tsx` files
- **Components**: PascalCase (e.g., `CreateEventModal.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **API Routes**: `route.ts` files in folder structure
- **Types**: Define in component files or separate `.types.ts` files

## Component Organization

- **UI Components**: Base components in `src/components/ui/`
- **Feature Components**: Domain-specific components in `src/components/`
- **Page Components**: In respective `src/app/` directories
- Use default exports for page components
- Use named exports for utility components

## Data Models (Firestore)

- **users**: User profiles, friends, attended events, badges
- **events**: Event details, location, attendees, categories
- **posts**: User posts tied to attended events

## Import Patterns

- Use `@/` alias for src directory imports
- Group imports: external libraries, then internal modules
- Firebase services imported from `@/firebase` or `@/firebaseAdmin`
