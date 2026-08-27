# Project Requirements Document (PRD)

> **Documentation status (24 Aug 2026):** Retained as project documentation and design history. Current `frontend/src/` behavior is authoritative where older phase language, placeholders, or proposed structure differs.


## 1. Project Overview

### 1.1 Project Name

**SIH Tourist Safety Platform**

### 1.2 Scope of This Document

This document defines the requirements for the **frontend application only**.

The frontend is responsible for delivering the complete user-facing experience, including:

* Public landing experience
* Authentication screens
* Tourist onboarding
* Tourist dashboard
* Trip management
* Group trip management
* QR-based group joining
* Live safety and location interfaces
* Safe zone discovery
* Risk information
* SOS and emergency interfaces
* Incident reporting
* Chatbot interface
* Profile management
* Trip history
* Incident history

Backend implementation, database design, APIs, authentication server logic, infrastructure, and external services are **outside the scope of this frontend PRD**.

---

# 2. Problem Statement

Tourists travelling in unfamiliar locations may face safety challenges due to:

* Lack of familiarity with the area
* Difficulty identifying safe locations nearby
* Limited access to immediate emergency assistance
* Lack of real-time safety awareness
* Challenges during solo travel
* Difficulty coordinating safety within groups
* Lack of a simple mechanism to report incidents

The platform aims to provide tourists with a centralized digital safety experience that helps them stay informed, connected, and prepared during their trips.

---

# 3. Product Vision

Build a modern tourist safety platform that allows tourists to:

* Manage their trips
* View their current location
* Discover nearby safe zones
* Understand their current safety or risk level
* Travel individually or in groups
* Join groups using QR codes
* Trigger SOS assistance
* Report incidents
* View previous trips and incidents
* Access emergency-related information from one centralized interface

The frontend should make critical safety actions highly visible and easy to access while maintaining a simple and intuitive experience.

---

# 4. Target Users

## 4.1 Primary User

### Tourist

A tourist using the platform to manage travel-related safety information and actions.

The tourist can:

* Create an account
* Sign in
* Complete their profile and onboarding
* View their safety dashboard
* Manage trips
* Create or join travel groups
* Access safety information
* Trigger SOS
* Report incidents
* View historical trip and incident data

---

## 4.2 User Types

The frontend currently focuses primarily on the following user role:

### Authenticated Tourist

An authenticated tourist who has completed or is completing onboarding and can access the protected application.

The frontend must correctly support the following user states:

1. Unauthenticated user
2. Authenticated user with incomplete onboarding
3. Authenticated user with completed onboarding

---

# 5. Product Goals

The frontend must:

1. Provide a clear and intuitive onboarding experience.
2. Make emergency actions immediately accessible.
3. Provide a centralized safety dashboard.
4. Allow users to manage solo and group trips.
5. Support QR-based group joining.
6. Display relevant safety information in a simple and understandable format.
7. Provide clear interfaces for incident reporting.
8. Allow users to access previous trip and incident records.
9. Maintain responsive usability across desktop and mobile devices.
10. Provide clear loading, error, empty, and success states.
11. Remain scalable as additional SIH features are introduced.

---

# 6. Functional Requirements

## 6.1 Landing Page

The application must provide a public landing page.

The landing page should:

* Introduce the platform
* Communicate the core value proposition
* Explain the major safety capabilities
* Provide clear navigation to authentication
* Encourage users to sign up or sign in

Primary actions:

* Sign Up
* Sign In

---

# 7. Authentication

## 7.1 Sign Up

The frontend must provide a registration form.

Required fields:

* Name
* Username
* Email
* Phone Number
* Password
* Confirm Password

Frontend requirements:

* Validate required fields
* Validate email format
* Validate phone number input
* Validate password confirmation
* Display field-level validation errors
* Prevent submission when required validation fails
* Display loading state during submission
* Display backend or network errors clearly
* Redirect the user appropriately after successful registration

---

## 7.2 Sign In

The sign-in page must allow authentication using:

* Username or Email
* Password

The frontend must:

* Validate required inputs
* Support username or email login input
* Display loading state
* Display authentication errors
* Redirect authenticated users appropriately

---

# 8. Onboarding

After authentication, a user who has not completed onboarding must complete the onboarding flow before accessing the main application experience.

Required onboarding information:

* Gender
* Age
* Medical History
* Emergency Phone Number
* Nationality

The frontend should:

* Present onboarding as a clear guided flow
* Explain why important safety information is being collected where appropriate
* Validate required information
* Handle submission errors
* Prevent access to the complete application until onboarding is successfully completed

---

# 9. Main Dashboard

The dashboard is the primary screen for an authenticated tourist.

The dashboard must provide quick access to critical safety information and actions.

Primary dashboard information includes:

* Live location
* Nearby safe zones
* Current risk level
* SOS action
* Chatbot access
* Past incidents
* Total trips

The dashboard should prioritize information based on importance.

Suggested priority:

1. SOS and emergency access
2. Current safety/risk information
3. Current location
4. Nearby safe zones
5. Active trip information
6. Historical statistics
7. Additional tools

---

# 10. Live Location

The application must provide a location interface that displays the tourist's current location.

The frontend should:

* Request location access through the browser when required
* Clearly communicate when location permission is needed
* Handle denied permissions
* Handle unavailable location services
* Display location-related loading states
* Present location information in a clear visual format

The frontend must not assume that location access is always available.

---

# 11. Nearby Safe Zones

Users must be able to view safe zones near their current location.

The interface should:

* Display available nearby safe zones
* Clearly differentiate safe zones from general map information
* Support location-based context
* Handle empty results
* Handle unavailable location data
* Provide loading and error states

---

# 12. Risk Level

The dashboard must display the tourist's current safety or risk level.

The risk level interface should:

* Make the current level easy to understand
* Avoid ambiguous presentation
* Clearly communicate relative risk
* Be visually distinguishable without overwhelming the user

Risk information should not be hidden behind multiple navigation steps.

---

# 13. SOS System

The SOS action is one of the most critical features of the application.

The frontend must provide highly accessible SOS functionality.

Requirements:

* SOS action must be visible from important safety-related screens
* Accidental triggering should be minimized through an appropriate confirmation flow
* Emergency state should provide clear feedback
* Loading or processing state should be visible
* Failure states must clearly communicate when the action could not be completed

The SOS interface must prioritize clarity and speed over unnecessary visual complexity.

---

# 14. Chatbot

The application must provide an interface for accessing the safety chatbot.

The chatbot interface should support:

* Viewing conversation messages
* Sending messages
* Loading states
* Error states
* Empty conversation state

The frontend is responsible only for the chatbot user interface and integration layer.

Chatbot intelligence, model processing, and backend logic are outside the frontend scope.

---

# 15. Trip Management

Users must be able to create and manage trips.

Trip-related functionality includes:

* Creating a trip
* Viewing the current trip
* Viewing previous trips
* Accessing trip details

Trip creation must allow the user to select whether the trip is:

* Solo
* Group

---

# 16. Solo Trip

For a solo trip, the frontend must allow the user to create and manage an individual trip.

The user should be able to:

* Enter the required trip information
* Start or create the trip
* View trip details
* Access trip-related safety actions

---

# 17. Group Trip

The application must support group-based travel.

A user should be able to:

* Create a group
* Join an existing group
* View group-related trip information
* Access group details during the trip

---

# 18. Group Creation

When creating a group, the user should be able to create a new travel group associated with the trip.

The group interface should support:

* Group creation
* Viewing relevant group information
* QR generation for joining

---

# 19. Joining a Group

A user should be able to join a group.

The joining flow must support:

* QR code scanning
* Appropriate validation
* Success feedback
* Invalid or unavailable group handling
* Loading state
* Error state

---

# 20. QR Code Support

The frontend must support QR-based group joining.

Required capabilities:

### QR Generation

Users creating a group should be able to access a QR code for that group.

### QR Scanning

Users joining a group should be able to scan a QR code.

The interface must handle:

* Camera permission
* Camera access denial
* Unsupported devices
* Invalid QR codes
* Invalid group information
* Processing state

---

# 21. Current Trip

The application must provide a dedicated current trip experience.

The current trip should provide access to:

* Current trip information
* Group details when applicable
* Incident reporting
* SOS functionality
* Other relevant safety information

The current trip experience should allow users to quickly understand:

* Whether they have an active trip
* Whether the trip is solo or group-based
* Relevant trip and group information
* Available safety actions

---

# 22. Incident Reporting

Users must be able to report incidents.

The frontend must provide:

* Incident reporting interface
* Input validation
* Submission state
* Success feedback
* Error feedback

The reporting experience should remain simple because it may be used during stressful situations.

---

# 23. Incident History

Users must be able to view previously recorded incidents.

The interface should support:

* Incident listing
* Incident summary information
* Empty state
* Loading state
* Error state

---

# 24. Trip History

Users must be able to view their previous trips.

The interface should support:

* List of past trips
* Relevant trip summary information
* Empty state
* Loading state
* Error state

---

# 25. Profile

Users must have access to their profile.

The profile should display and allow management of relevant user information.

Profile information includes information collected during:

* Sign up
* Onboarding

The frontend should support:

* Viewing profile information
* Editing supported information
* Validation
* Save feedback
* Loading state
* Error handling

---

# 26. Navigation Requirements

The application must provide a clear navigation system.

The authenticated navigation should provide access to the major areas of the platform.

Primary areas include:

* Dashboard
* Current Trip
* Trip History
* Incident History
* Profile

Additional safety-related actions such as SOS should remain easily accessible.

Navigation should adapt appropriately for:

* Desktop devices
* Tablet devices
* Mobile devices

---

# 27. User Flows

## 27.1 New User Flow

```text
Landing Page
    ↓
Sign Up
    ↓
Account Created
    ↓
Onboarding
    ↓
Onboarding Completed
    ↓
Dashboard
```

---

## 27.2 Existing User Flow

```text
Landing Page
    ↓
Sign In
    ↓
Authentication Successful
    ↓
Onboarding Check
    ├── Incomplete → Onboarding
    └── Complete → Dashboard
```

---

## 27.3 Trip Creation Flow

```text
Dashboard
    ↓
Create Trip
    ↓
Select Trip Type
    ├── Solo Trip
    │      ↓
    │   Create Trip
    │      ↓
    │   Current Trip
    │
    └── Group Trip
           ↓
       Create or Join Group
           ├── Create Group
           │      ↓
           │   Generate QR
           │
           └── Join Group
                  ↓
               Scan QR
                  ↓
               Current Trip
```

---

## 27.4 Emergency Flow

```text
Dashboard / Current Trip
    ↓
SOS
    ↓
Confirmation
    ↓
Processing
    ↓
Success or Error Feedback
```

---

## 27.5 Incident Reporting Flow

```text
Dashboard / Current Trip
    ↓
Report Incident
    ↓
Enter Incident Details
    ↓
Validate
    ↓
Submit
    ↓
Success or Error Feedback
```

---

# 28. Frontend Route Structure

The exact route implementation may evolve, but the product should conceptually support:

```text
/
├── /
│   └── Landing Page
│
├── /auth
│   ├── /signin
│   └── /signup
│
├── /onboarding
│
└── /app
    ├── /dashboard
    ├── /trip
    ├── /trip/create
    ├── /trip/history
    ├── /incidents
    ├── /profile
    └── additional protected routes
```

Routes should distinguish between:

* Public routes
* Authentication routes
* Onboarding routes
* Protected application routes

---

# 29. Frontend State Requirements

The frontend must correctly handle the following categories of state.

## 29.1 Global State

Potential global state includes:

* Authentication state
* User information
* Onboarding completion status
* Application-level UI state

Global state should only be used where appropriate.

---

## 29.2 Server State

Data fetched from APIs should be treated as server state.

Examples:

* User profile
* Trips
* Incidents
* Safe zones
* Risk information

Server state should support:

* Loading
* Error
* Empty
* Success
* Refetching where appropriate

---

## 29.3 Local UI State

Local component state should be used for UI-specific behavior.

Examples:

* Modal visibility
* Form state
* Input state
* Confirmation dialogs
* Temporary UI interactions

---

# 30. Error Handling Requirements

Every major user-facing asynchronous feature must handle:

1. Loading state
2. Success state
3. Error state
4. Empty state where applicable

The frontend must:

* Avoid silent failures
* Display understandable error messages
* Avoid exposing technical implementation details unnecessarily
* Allow retrying failed operations where appropriate

---

# 31. Responsive Requirements

The application must support:

* Mobile
* Tablet
* Desktop

The UI must be designed mobile-first for critical safety interactions.

Critical actions such as:

* SOS
* Location access
* Incident reporting
* Current trip access

must remain accessible on smaller screens.

---

# 32. Accessibility Requirements

The frontend should provide reasonable accessibility support.

Requirements include:

* Keyboard-accessible interactive elements
* Clear focus states
* Semantic HTML where appropriate
* Form labels
* Sufficient visual distinction between states
* Error messages associated with relevant inputs
* Avoiding color as the only indicator of critical information

---

# 33. Non-Functional Requirements

## Performance

The application should:

* Avoid unnecessary re-renders
* Avoid unnecessary API requests
* Load major routes efficiently
* Handle slow networks gracefully

## Maintainability

The codebase should:

* Use reusable components
* Separate UI, feature, state, and API concerns appropriately
* Avoid unnecessary duplication
* Remain understandable for multiple developers and AI coding agents

## Scalability

The frontend architecture should support future additions without requiring major restructuring.

---

# 34. Scope Boundaries

This PRD defines frontend requirements only.

The frontend team or agent must only work inside:

```text
frontend/
```

The agent may inspect the broader workspace only when necessary for context.

However, it must never:

* Create files outside `frontend/`
* Modify files outside `frontend/`
* Delete files outside `frontend/`
* Move files outside `frontend/`
* Refactor backend code
* Change database schemas
* Modify infrastructure
* Change backend configuration

This includes all backend and non-frontend project directories.

---

# 35. Out of Scope for the Frontend

The following are not implementation responsibilities of the frontend:

* Backend API implementation
* Database design
* Database migrations
* Server-side authentication implementation
* Token generation
* Geospatial backend logic
* Risk calculation algorithms
* Chatbot model implementation
* Emergency service backend integrations
* Notification delivery infrastructure
* Deployment infrastructure

The frontend may integrate with these capabilities only through approved interfaces.

---

# 36. Success Criteria

The frontend implementation is successful when:

* Users can successfully sign up and sign in.
* New users can complete onboarding.
* Authenticated users can access the dashboard.
* The dashboard clearly presents safety information.
* Users can access SOS functionality quickly.
* Users can create solo trips.
* Users can create or join group trips.
* Users can use QR functionality for group joining.
* Users can access current trip information.
* Users can report incidents.
* Users can view past trips.
* Users can view incident history.
* Users can manage their profile.
* Major screens are responsive.
* Major asynchronous features have loading and error states.
* The frontend architecture remains modular and maintainable.
* No files outside the `frontend/` directory are modified by the frontend coding agent.

---

# 37. Product Principle

The product must prioritize:

> **Safety, clarity, speed, and ease of use over unnecessary complexity.**

A tourist should be able to understand their current safety situation and access critical actions with minimal effort.

---

# 38. Tracking, Map, Geofencing, & Real-Time Requirements

## 38.1 Authentication (OTP Integration)
- The registration flow must create an unverified account.
- The user must complete an email OTP verification step to receive their access session.
- The UI must support "Resend OTP", handling cooldowns and generic responses securely.

## 38.2 GPS Tracking & Map Integration
- The application must request browser location permissions and gracefully handle denial or unavailability.
- Continuous location tracking (`watchPosition`) must be active during active trips and strictly stopped otherwise.
- The map must visually represent the user's location, active geofences (safety zones), and group members.
- OpenStreetMap is the primary mapping provider.

## 38.3 Geofencing
- The frontend will visualize geofences provided by the backend API.
- **Critical:** The frontend MUST NOT execute independent local algorithms for authoritative safety alerts based on geofence overlap. The backend remains the sole authority for safety states and evaluations.

## 38.4 Real-Time (Socket.IO) & Notifications
- Socket.IO will be used to stream real-time alerts, incidents, location updates, and notifications when authenticated gateways are exposed.
- Events will immediately synchronize with the TanStack Query cache.
- Notifications require clear visual states: unread, historical, critical.

# 39. Latest Operational Requirements

1. Danger-zone detection must notify the tourist and Disaster Management immediately by in-app/web notification and email, without automatic Police/Fire/Ambulance dispatch.
2. Group-member signal loss must create a leader decision workflow after the tracking-gap threshold (default 5 minutes). The leader has 5 minutes to mark false alarm or confirm danger; timeout/confirmation escalates to Disaster Management. Offline reminders repeat every 5 minutes after a handled response.
3. Police, Fire, and Ambulance/Hospital are unified fleet accounts with Active Dispatch, Live Tracking, and Dispatch History backed by real APIs.
4. Affected tourists, Disaster Management, and authorized responders must be able to view live responder tracking.
5. Group QR must be a normal HTTPS deep link and work with generic QR scanners.
6. During a planned/active trip, tourist name, DOB, email, and phone must be immutable from tourist profile controls and backend APIs.
7. Blockchain must preserve the existing credential `idHash`, append encrypted individual/group snapshots, append a new group snapshot as membership grows, and support server-side restoration of protected individual-trip fields if PostgreSQL differs from the verified chain snapshot.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


## 2026-08-27 implemented product addendum

### Administration UX

System Admin uses an enterprise administration visual language: neutral black/gray palette, white cards, restrained radius, dark external card borders, lighter internal table separators, dense professional tables, two-column forms, and white diagnostics.

### Disaster Management UX

Disaster Management is an emergency-operations command center using silver/graphite surfaces with red reserved for urgency and critical actions. Incident management favors operational context, live map/fleet visibility, clear status progression, and command-oriented terminology over generic admin-card presentation.

### Emergency responder UX

Police, Ambulance/Hospital, and Fire share the same operational product architecture while retaining distinct service identity. A fleet account has a fixed configured base location. Active dispatch tracking uses the responder's live location and displays a road route to the tourist/incident. Dispatch history remains available after completion/cancellation.

### Safety lifecycle acceptance rule

Ending a trip must remove or expire trip-derived active alerts/incidents from all active views. A stale alert from a completed/cancelled trip is a product defect, not a historical record to display as active.

---

## Repository synchronization — 2026-08-27

Implemented product behavior now includes persistent responder background tracking, combined tourist group+fleet live tracking, danger-zone/group-boundary incident automation, SOS location integrity, trip-end alert expiry, password-reset email OTP, and system/disaster/fleet role-specific dashboards. These should be treated as current requirements, not future-only items.
