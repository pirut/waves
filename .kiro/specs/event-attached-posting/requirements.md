# Requirements Document

## Introduction

The event-attached posting system ensures that all user-generated content (posts) in Make Waves is tied to real-world events that users have attended. This core constraint maintains the app's focus on authentic, impact-driven social sharing by preventing generic social media posts and ensuring all content is rooted in actual community engagement and social good activities.

## Requirements

### Requirement 1

**User Story:** As a user, I want to create posts only after attending events, so that all shared content represents real-world impact and community engagement.

#### Acceptance Criteria

1. WHEN a user attempts to create a post THEN the system SHALL only allow post creation if the user has attended at least one event
2. WHEN a user creates a post THEN the system SHALL require the user to select from their attended events to attach the post to
3. IF a user has not attended any events THEN the system SHALL display a message encouraging them to attend events before posting
4. WHEN a user selects an event to attach their post to THEN the system SHALL validate that the user actually attended that event

### Requirement 2

**User Story:** As a user, I want to attach my posts to specific events I attended, so that my content is contextually relevant and tied to meaningful activities.

#### Acceptance Criteria

1. WHEN creating a post THEN the system SHALL display a list of events the user has attended
2. WHEN a user selects an event THEN the system SHALL associate the post with that specific event
3. WHEN a post is created THEN the system SHALL store the event ID as a required field in the post data
4. IF no event is selected THEN the system SHALL prevent post creation and display an error message

### Requirement 3

**User Story:** As a user, I want to see posts organized by events, so that I can understand the context and impact of shared content.

#### Acceptance Criteria

1. WHEN viewing a post THEN the system SHALL display which event the post is attached to
2. WHEN viewing an event page THEN the system SHALL show all posts attached to that event
3. WHEN browsing the social feed THEN the system SHALL include event context for each post
4. WHEN a user clicks on an event reference in a post THEN the system SHALL navigate to that event's detail page

### Requirement 4

**User Story:** As a user, I want the posting interface to guide me through the event selection process, so that I understand why event attachment is required.

#### Acceptance Criteria

1. WHEN accessing the post creation interface THEN the system SHALL clearly explain the event attachment requirement
2. WHEN no attended events are available THEN the system SHALL provide clear guidance on how to attend events
3. WHEN selecting an event THEN the system SHALL show event details to help users choose the most relevant event
4. WHEN creating a post THEN the system SHALL validate all required fields including event attachment before submission

### Requirement 5

**User Story:** As a system administrator, I want to ensure data integrity for event-post relationships, so that the core product constraint is technically enforced.

#### Acceptance Criteria

1. WHEN a post is submitted THEN the system SHALL validate that the attached event ID exists in the database
2. WHEN a post is submitted THEN the system SHALL verify that the user is marked as having attended the attached event
3. IF validation fails THEN the system SHALL reject the post creation and return appropriate error messages
4. WHEN storing posts THEN the system SHALL enforce foreign key constraints between posts and events
5. WHEN storing posts THEN the system SHALL enforce foreign key constraints between posts and user attendance records
