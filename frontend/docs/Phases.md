# Phases.md

# 1. Purpose

This document divides the SIH Tourist Safety frontend into manageable implementation phases.

The frontend must not be built all at once.

Each phase should:

* Have a clear objective
* Have a defined scope
* Produce a usable milestone
* Build upon previous phases
* Be verified before moving forward

The AI coding agent must implement **only the current active phase** unless explicitly instructed otherwise.

---

# 2. Implementation Strategy

The frontend will be developed progressively.

The overall flow is:

```text
Phase 0: Foundation Verification
        ↓
Phase 1: Design System and Application Shell
        ↓
Phase 2: Authentication
        ↓
Phase 3: Onboarding
        ↓
Phase 4: Core Dashboard
        ↓
Phase 5: Trip Management
        ↓
Phase 6: Group and QR Features
        ↓
Phase 7: Safety Features
        ↓
Phase 8: Incident Management
        ↓
Phase 9: Profile and History
        ↓
Phase 10: Chatbot Integration
        ↓
Phase 11: Polish and Final Verification
```

Each phase must be completed and reasonably verified before progressing.

---

# 3. Phase 0 — Foundation Verification

## Objective

Understand and verify the existing frontend foundation before adding product features.

## Scope

Inspect the existing:

* React setup
* Vite configuration
* Tailwind CSS configuration
* Redux Toolkit setup
* TanStack Query setup
* Axios setup
* Existing source structure
* Existing routing
* Existing components

## Required Tasks

* Verify the application runs
* Verify the build process
* Inspect the existing frontend structure
* Identify existing reusable components
* Identify existing state management patterns
* Identify existing API patterns
* Identify existing routing patterns
* Confirm the existing dependency set

## Deliverables

By the end of this phase:

* The existing frontend structure is understood
* No unnecessary restructuring has been performed
* The current architecture is documented in `docs/Memory.md`
* Existing patterns have been identified for future implementation

## Completion Criteria

* The frontend runs successfully
* The existing structure has been inspected
* No unrelated code has been modified
* Important findings are added to `docs/Memory.md`

---

# 4. Phase 1 — Design System and Application Shell

## Objective

Create the shared visual and structural foundation of the application.

## Scope

Implement:

* Global styles
* Shared layout
* Shared UI components
* Application shell
* Navigation foundation
* Responsive layout foundation

## Required Tasks

### Shared UI

Create or refine reusable components where genuinely needed:

* Button
* Input
* Select
* Textarea
* Card
* Modal
* Badge
* Loader
* Error state
* Empty state

### Layout

Implement the structural layout for:

* Public pages
* Authentication pages
* Authenticated application pages

### Navigation

Create the foundation for:

* Desktop navigation
* Mobile navigation
* Page content layout

## Deliverables

The application should have a reusable design and layout foundation.

## Completion Criteria

* Shared components are reusable
* Layout is responsive
* Navigation structure works
* No feature-specific business logic is implemented prematurely
* Styling follows `Design.md`

---

# 5. Phase 2 — Authentication

## Objective

Implement the complete frontend authentication flow.

## Scope

Implement:

* Sign up
* Sign in
* Authentication state handling
* Authentication loading state
* Public route handling
* Protected route handling

## Required Screens

* Sign Up
* Sign In

## Sign Up Requirements

Fields:

* Name
* Username
* Email
* Phone Number
* Password
* Confirm Password

Required behavior:

* Field validation
* Error display
* Submission loading state
* Backend error handling
* Success handling

## Sign In Requirements

Fields:

* Username or Email
* Password

Required behavior:

* Input validation
* Submission loading state
* Authentication error handling
* Success redirect

## Completion Criteria

* Users can sign up through the frontend
* Users can sign in
* Authentication state is resolved before protected content is displayed
* Public and protected routes behave correctly
* Loading and error states are handled

---

# 6. Phase 3 — Tourist Onboarding

## Objective

Collect required safety-related information from newly authenticated tourists.

## Scope

Implement:

* Onboarding route
* Onboarding form
* Validation
* Submission
* Completion handling

## Required Information

* Gender
* Age
* Medical History
* Emergency Phone Number
* Nationality

## Required Behavior

* Authenticated users with incomplete onboarding are redirected to onboarding
* Users cannot unnecessarily repeat completed onboarding
* Form fields are validated
* Submission errors are displayed
* Successful onboarding unlocks the main application

## Completion Criteria

* Incomplete users reach onboarding
* Completed users reach the application
* Validation works
* Loading and errors are handled
* Onboarding completion state is correctly reflected

---

# 7. Phase 4 — Core Dashboard

## Objective

Build the primary tourist safety dashboard.

## Scope

Implement the visual and data architecture for:

* Current location
* Nearby safe zones
* Current risk level
* SOS quick access
* Chatbot quick access
* Past incidents summary
* Total trips summary

## Dashboard Priorities

The information hierarchy should prioritize:

```text
1. Emergency and SOS actions
2. Current safety status
3. Current location
4. Nearby safe zones
5. Current trip information
6. Historical summaries
7. Additional tools
```

## Required States

The dashboard must handle:

* Initial loading
* Partial section loading
* API errors
* Empty states
* Unavailable location

## Completion Criteria

* Dashboard is responsive
* Critical information is clearly visible
* Dashboard sections handle loading and errors
* Critical actions remain easily accessible

---

# 8. Phase 5 — Trip Management

## Objective

Allow tourists to create and manage their trips.

## Scope

Implement:

* Create trip flow
* Trip type selection
* Solo trip flow
* Group trip entry point
* Current trip page
* Active trip state

## Required User Flow

```text
Dashboard
    ↓
Create Trip
    ↓
Select Trip Type
    ├── Solo
    │      ↓
    │   Create Trip
    │      ↓
    │   Current Trip
    │
    └── Group
           ↓
     Group Management
```

## Required Screens

* Create Trip
* Trip Type Selection
* Current Trip

## Completion Criteria

* User can initiate trip creation
* Solo and group paths are clearly separated
* Current trip information can be displayed
* No active trip state is handled properly

---

# 9. Phase 6 — Group Trips and QR Features

## Objective

Implement group-based travel functionality.

## Scope

Implement:

* Group creation
* Group joining
* Group information
* QR code generation
* QR code scanning

## Group Creation

The user should be able to:

* Create a group
* Access relevant group information
* Generate or display a joinable QR code

## Group Joining

The user should be able to:

* Open the group joining flow
* Scan a QR code
* Join the associated group

## QR Requirements

The frontend must handle:

* Camera permission
* Camera denial
* Unsupported devices
* Invalid QR codes
* Invalid group information
* Processing states
* Error states

## Completion Criteria

* Group creation flow works
* QR-based joining works with the defined API contract
* Permission errors are handled
* Invalid QR data is handled
* Responsive behavior is preserved

---

# 10. Phase 7 — Core Safety Features

## Objective

Implement the primary safety-related interactions.

## Scope

Implement and refine:

* SOS
* Location access
* Risk information
* Safe zone access

## SOS

Requirements:

* Easy access
* Appropriate confirmation
* Processing state
* Success feedback
* Failure feedback

## Location

Requirements:

* Permission handling
* Location loading
* Permission denial handling
* Unavailable location handling

## Safe Zones

Requirements:

* Safe zone display
* Empty state
* Loading state
* Error state

## Risk Information

Requirements:

* Clear current risk presentation
* Easy interpretation
* Appropriate visual hierarchy

## Completion Criteria

* Safety features are easily accessible
* Errors are clearly communicated
* No fake success states exist
* Safety information is understandable

---

# 11. Phase 8 — Incident Management

## Objective

Allow tourists to report and review incidents.

## Scope

Implement:

* Incident reporting
* Incident submission
* Incident history
* Incident listing
* Incident states

## Incident Reporting Flow

```text
Current Trip / Dashboard
        ↓
Report Incident
        ↓
Enter Details
        ↓
Validate
        ↓
Submit
        ↓
Success or Error
```

## Required Behavior

* Validate input
* Prevent duplicate submission
* Show loading state
* Show success feedback
* Show backend errors

## Incident History

Support:

* Incident list
* Empty state
* Loading state
* Error state

## Completion Criteria

* Users can report incidents
* Submission states work correctly
* History is displayed correctly
* Empty and error states are handled

---

# 12. Phase 9 — Profile and History

## Objective

Complete user account and historical data experiences.

## Scope

Implement:

* Profile
* Profile editing
* Trip history
* Incident history refinement

## Profile

The user should be able to:

* View relevant profile information
* Update supported information
* Save changes
* Receive success or error feedback

## Trip History

Support:

* Past trip list
* Trip summary
* Empty state
* Loading state
* Error state

## Completion Criteria

* Profile information is accessible
* Supported information can be updated
* Past trips can be viewed
* History states are handled correctly

---

# 13. Phase 10 — Chatbot

## Objective

Implement the tourist safety chatbot interface.

## Scope

Implement:

* Chat interface
* Message list
* Message input
* Sending state
* Loading state
* Error state
* Empty conversation state

## Requirements

The chatbot UI should:

* Clearly distinguish user and assistant messages
* Support scrolling through messages
* Display sending or processing feedback
* Handle failed messages appropriately

The frontend should integrate with the approved chatbot API.

The frontend must not implement chatbot intelligence or backend model logic.

## Completion Criteria

* Messages can be sent
* Responses can be displayed
* Loading is clear
* Errors are handled
* Empty state exists

---

# 14. Phase 11 — Final Polish and Verification

## Objective

Prepare the frontend for final presentation and evaluation.

## Scope

Review and improve:

* Responsiveness
* Accessibility
* Loading states
* Error states
* Empty states
* Navigation
* Visual consistency
* Performance
* User experience

## Required Review

Verify:

* Mobile behavior
* Tablet behavior
* Desktop behavior
* Authentication flows
* Onboarding flow
* Dashboard
* Trip creation
* Group joining
* QR functionality
* SOS flow
* Incident reporting
* Profile
* History
* Chatbot

## Code Quality Review

Check:

* Unused imports
* Dead code
* Debugging logs
* Duplicate components
* Duplicate API calls
* Unnecessary state duplication
* Broken routes
* Broken imports

## Completion Criteria

* No known critical frontend bugs
* Major flows are usable
* Responsive behavior is verified
* Critical safety actions are accessible
* Code follows the architecture
* `docs/Memory.md` accurately reflects final project state

---

# 15. Phase Progress Tracking

`docs/Memory.md` must always contain the current phase.

Use the following format:

```text
Current Phase: Phase X — Phase Name

Status: Not Started / In Progress / Completed
```

Only one implementation phase should normally be marked as:

```text
In Progress
```

A phase should be marked as completed only after its completion criteria have been reasonably verified.

---

# 16. Phase Dependencies

The expected dependencies are:

```text
Phase 0
   ↓
Phase 1
   ↓
Phase 2
   ↓
Phase 3
   ↓
Phase 4
   ↓
Phase 5
   ↓
Phase 6
   ↓
Phase 7
   ↓
Phase 8
   ↓
Phase 9
   ↓
Phase 10
   ↓
Phase 11
```

Minor adjustments may be made when features are independent, but the agent must not begin large future implementations without completing the foundational dependencies.

---

# 17. Agent Rules for Phase Execution

For every phase:

1. Read all project documentation.
2. Read `docs/Memory.md`.
3. Confirm the current phase.
4. Inspect relevant existing code.
5. Implement only the current phase.
6. Verify the implementation.
7. Fix discovered issues within scope.
8. Update `docs/Memory.md`.
9. Mark the phase status accurately.
10. Move to the next phase only when instructed or when the implementation workflow explicitly continues.

---

# 18. Current Project Status

At the time this document is created:

```text
Phase 0 — Foundation Verification
Status: In Progress
```

The immediate goal is to verify and document the existing frontend foundation before beginning feature implementation.

---

# 19. Core Principle

> **Complete one meaningful phase at a time. Do not sacrifice stability and clarity by trying to build the entire product in a single implementation step.**

Each completed phase should leave the frontend in a more functional, stable, and maintainable state than before.
