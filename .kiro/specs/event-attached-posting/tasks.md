# Implementation Plan

-   [ ] 1. Create attendance validation service and utilities

    -   Create `src/services/attendanceValidation.ts` with functions to fetch user's attended events and validate attendance
    -   Write utility functions for event-user relationship queries
    -   Add TypeScript interfaces for attended events and validation responses
    -   _Requirements: 1.1, 1.4, 5.2_

-   [ ] 2. Enhance post API route with event attachment validation

    -   Modify `src/app/api/posts/route.ts` to validate event attachment on post creation
    -   Add server-side validation to check if eventId exists in events collection
    -   Add validation to verify user is in the event's attendees array
    -   Implement proper error responses with detailed messages for validation failures
    -   _Requirements: 5.1, 5.2, 5.3, 5.4_

-   [ ] 3. Create event selector component for post creation

    -   Build `src/components/EventSelector.tsx` component to display user's attended events
    -   Implement event card layout showing title, date, category, and location
    -   Add search and filter functionality for events
    -   Handle empty state when user has no attended events
    -   _Requirements: 2.1, 2.2, 4.3_

-   [ ] 4. Create post creation modal with event attachment

    -   Build `src/components/CreatePostModal.tsx` with event selection interface
    -   Integrate EventSelector component into the post creation flow
    -   Add form validation to require event selection before submission
    -   Implement error handling for various validation scenarios
    -   _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1, 4.2_

-   [ ] 5. Update post display components to show event context

    -   Modify existing post display components to include event information
    -   Add clickable event references that navigate to event detail pages
    -   Create event badge/tag component for visual event context
    -   Ensure consistent styling with Make Waves design system
    -   _Requirements: 3.1, 3.2, 3.3, 3.4_

-   [ ] 6. Implement user guidance for users without attended events

    -   Add guidance messages in CreatePostModal when user has no attended events
    -   Create call-to-action components that direct users to event discovery
    -   Implement helpful messaging that explains the event attachment requirement
    -   Add links to nearby or popular events for easy discovery
    -   _Requirements: 1.3, 4.1, 4.2_

-   [ ] 7. Add comprehensive error handling and user feedback

    -   Implement client-side error states for network failures and validation errors
    -   Add retry mechanisms for failed API calls
    -   Create user-friendly error messages for all validation scenarios
    -   Add loading states and success feedback for post creation
    -   _Requirements: 2.4, 4.4, 5.3_

-   [ ] 8. Write unit tests for attendance validation service

    -   Create test file `src/services/__tests__/attendanceValidation.test.ts`
    -   Test getUserAttendedEvents function with various user states
    -   Test validateUserAttendance with valid and invalid combinations
    -   Test error handling for network failures and edge cases
    -   _Requirements: 5.1, 5.2_

-   [ ] 9. Write unit tests for enhanced post API route

    -   Create test file `src/app/api/posts/__tests__/route.test.ts`
    -   Test post creation with valid event attachment
    -   Test rejection of posts without event attachment
    -   Test validation of user attendance and proper error responses
    -   _Requirements: 5.1, 5.2, 5.3, 5.4_

-   [ ] 10. Write component tests for post creation flow

    -   Create test files for CreatePostModal and EventSelector components
    -   Test rendering with different attended event states (0, 1, many events)
    -   Test event selection functionality and form validation
    -   Test error state handling and user guidance messages
    -   _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 4.1, 4.2_

-   [ ] 11. Update existing pages to integrate new post creation flow

    -   Modify `src/app/page.tsx` to use new CreatePostModal component
    -   Update event detail pages to include new post creation with preselected event
    -   Ensure post creation is accessible from relevant user interface locations
    -   Test integration with existing authentication and user state management
    -   _Requirements: 1.1, 2.1, 3.4_

-   [ ] 12. Add data model enhancements and database constraints
    -   Update TypeScript interfaces for Post, Event, and User models
    -   Add Firestore security rules to enforce event attachment requirements
    -   Implement database indexes for efficient event-post relationship queries
    -   Add migration logic to handle existing posts without event attachments
    -   _Requirements: 2.3, 5.4, 5.5_
