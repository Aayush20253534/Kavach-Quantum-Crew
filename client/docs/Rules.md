# Rules.md

> **Documentation status (24 Aug 2026):** Retained as project documentation and design history. Current `frontend/src/` behavior is authoritative where older phase language, placeholders, or proposed structure differs.


## 1. Purpose

This document defines the mandatory operating rules for any AI coding agent or developer working on the **SIH Tourist Safety Frontend**.

These rules control:

* Workspace boundaries
* File modification permissions
* Coding behavior
* Dependency usage
* Architecture compliance
* Error handling
* State management
* API integration
* UI implementation
* Progress tracking

All agents must follow these rules before making changes.

---

# 2. Rule Priority

When instructions conflict, follow this priority:

```text
1. Explicit user instructions
2. Rules.md
3. PRD.md
4. Phases.md
5. Design.md
6. Architecture.md
7. Memory.md
8. Existing codebase patterns
```

If an explicit user instruction conflicts with an existing document, the explicit user instruction takes priority.

---

# 3. Workspace Boundary — CRITICAL

## The agent must only modify files inside:

```text
frontend/
```

The workspace may contain:

* Backend applications
* Databases
* Infrastructure
* Shared project files
* Other applications
* Other documentation

These files may exist for the broader project, but they are **outside the frontend agent's implementation scope**.

The agent must never create, modify, delete, rename, or move any file outside:

```text
frontend/
```

This includes, but is not limited to:

* Backend source code
* Database schemas
* Database migrations
* Server configuration
* Backend environment files
* Infrastructure files
* Deployment configuration belonging to another application
* Other project applications

The agent may inspect files outside `frontend/` only when necessary to understand:

* API contracts
* Backend endpoints
* Shared project context
* Existing project requirements

Inspection does **not** grant modification permission.

---

# 4. Mandatory Context Reading

Before starting any implementation task, the agent must read:

1. `PRD.md`
2. `Architecture.md`
3. `Rules.md`
4. `Phases.md`
5. `Design.md`
6. `Memory.md`

The agent must also inspect relevant existing frontend files before creating or modifying functionality.

The agent must not blindly assume that documentation is fully synchronized with the current codebase.

When there is a conflict between the current code and documentation, the agent should determine whether:

* The documentation is outdated, or
* The code is outdated

The agent must not silently rewrite large sections of the project without understanding the conflict.

---

# 5. Current Phase Rule

The agent must implement only the currently active phase defined in:

```text
Phases.md
```

The agent must not:

* Implement future phases prematurely
* Build unrelated features
* Add speculative functionality
* Create placeholders for features that are not part of the current phase

If a task depends on a future phase, the agent should stop and request clarification rather than implementing the entire future architecture.

---

# 6. Memory Management Rule

`docs/Memory.md` is the living context file for frontend development.

Before starting work, the agent must:

* Read `docs/Memory.md`
* Understand the current project state
* Identify the current phase
* Identify completed work
* Identify ongoing work
* Check important architectural decisions
* Check known issues

After completing meaningful work, the agent must update `docs/Memory.md`.

Updates should include:

* Current phase
* Completed work
* Files created
* Files modified
* Important decisions
* Current issues or blockers
* Next recommended step

The agent must not rewrite the entire `docs/Memory.md` unnecessarily.

It should preserve useful existing context and update it accurately.

---

# 7. No Unnecessary Dependencies

The existing frontend stack must be preferred.

Current foundation:

* React
* Vite
* Tailwind CSS
* Redux Toolkit
* TanStack Query
* Axios

The agent must not install a new dependency unless:

1. The feature cannot reasonably be implemented using the existing stack, or
2. The user explicitly requests the dependency.

Before adding a dependency, the agent must:

* Check whether the functionality already exists in the project
* Check whether an existing dependency can solve the problem
* Avoid adding multiple libraries for similar functionality

The agent must never install a library simply because it is commonly used.

---

# 8. Preserve Existing Code

The agent must inspect existing code before replacing it.

The agent must not:

* Rewrite working functionality without reason
* Delete working code unnecessarily
* Replace existing patterns purely for personal preference
* Perform large-scale refactors unrelated to the requested feature

Changes should be minimal and focused.

If existing architecture must be changed, the agent should first determine whether the change is necessary for the current requirement.

---

# 9. No Unnecessary Refactoring

Refactoring must have a clear purpose.

The agent must not:

* Refactor unrelated files while implementing a feature
* Rename large numbers of files unnecessarily
* Move files merely to match a preferred architecture
* Convert working patterns without benefit

If a refactor is required to implement the current feature:

* Keep the refactor as small as possible
* Preserve existing functionality
* Update `docs/Memory.md` if the architecture changes meaningfully

---

# 10. Follow Existing Project Patterns

Before creating new code, inspect:

* Existing components
* Existing API utilities
* Existing hooks
* Existing Redux slices
* Existing query patterns
* Existing routing
* Existing styling conventions

If a suitable pattern already exists, reuse it.

The agent should not introduce a completely different pattern for similar functionality without a strong reason.

---

# 11. Component Creation Rules

Before creating a component, determine whether:

1. A similar component already exists
2. An existing component can be extended
3. The component is feature-specific
4. The component will genuinely be reused

Use the following rule:

```text
Used by one feature
        ↓
Keep inside that feature

Used across multiple unrelated features
        ↓
Move to shared components
```

Do not place every new component inside a global `components/` folder.

---

# 12. Avoid Over-Abstraction

The agent must not create abstractions too early.

Avoid:

* Generic wrappers for one-time use
* Complex component factories
* Unnecessary custom hooks
* Overly configurable components
* Deep prop abstraction for simple UI
* Multiple files for trivial logic

Prefer clear and direct code.

Abstraction should be introduced when it provides a genuine benefit through:

* Reuse
* Maintainability
* Separation of concerns

---

# 13. State Management Rules

## Redux Toolkit

Use Redux Toolkit only for appropriate global client-side state.

Examples:

* Authentication state
* Global user state
* Global UI state
* Application-wide preferences

Do not place all application state into Redux.

---

## TanStack Query

Use TanStack Query for server state.

Examples:

* User data
* Trips
* Active trip
* Incident history
* Safe zones
* Risk information

Server data should generally not be duplicated unnecessarily in Redux.

---

## Local State

Use local component state for UI-specific behavior.

Examples:

* Form input
* Modal visibility
* Local interaction state
* Temporary UI state

---

# 14. API Rules

All API communication must follow the established frontend API architecture.

The agent must:

* Use the centralized Axios configuration
* Keep feature-specific API functions close to their features
* Avoid placing raw API calls directly inside UI components
* Reuse existing API patterns
* Handle API errors explicitly

The agent must not:

* Invent backend endpoints
* Invent request formats
* Invent response structures
* Assume backend behavior

If an API contract is unclear:

1. Inspect available backend code or API documentation for context
2. Do not modify backend files
3. Ask for clarification if the contract cannot be determined

---

# 15. No Fake Backend Logic

The agent must not implement fake backend behavior as production functionality.

Avoid:

* Hardcoded fake API responses
* Fake authentication systems
* Fake persistent state
* Simulated backend logic

Mock data may only be used when:

* Explicitly requested
* Required temporarily for UI development
* Clearly separated from production API logic

Temporary mock implementations must be easy to remove later.

---

# 16. Error Handling Rules

Every major asynchronous operation must handle:

```text
Loading
Error
Success
```

Where relevant, it must also handle:

```text
Empty
```

The agent must not silently swallow errors.

Do not use patterns such as:

```javascript
catch (error) {}
```

Errors must be handled appropriately.

User-facing error messages should:

* Be understandable
* Be actionable where possible
* Avoid exposing unnecessary internal technical details

---

# 17. Loading State Rules

The agent must implement appropriate loading states.

Examples:

* Application initialization loader
* Page loading state
* Component loading state
* Button loading state

Do not block the entire page when only a small action is loading.

Avoid duplicate loading indicators for the same operation.

---

# 18. Empty State Rules

When data may legitimately be absent, provide an intentional empty state.

Examples:

* No trips
* No active trip
* No incidents
* No nearby safe zones
* No chatbot messages

An empty state should communicate:

* What is empty
* Why it may be empty
* What the user can do next when applicable

---

# 19. Form Rules

All forms must:

* Validate required fields
* Display field-level errors where appropriate
* Prevent duplicate submission
* Provide submission feedback
* Handle backend validation errors
* Handle network failures

The agent must not rely solely on backend validation when frontend validation is appropriate.

Form validation should remain close to the relevant feature.

---

# 20. Safety-Critical Feature Rules

The following features are safety-critical:

* SOS
* Location
* Risk information
* Incident reporting

These features must prioritize:

* Clarity
* Accessibility
* Fast interaction
* Explicit feedback
* Reliable error handling

Do not hide critical safety actions behind unnecessary navigation or complex interactions.

Do not add decorative complexity that makes emergency actions harder to use.

---

# 21. SOS Rules

SOS is a critical action.

The frontend must:

* Make the action easily accessible
* Prevent accidental triggering through an appropriate confirmation mechanism
* Show clear processing state
* Show clear success feedback
* Show clear failure feedback

The agent must not create a fake successful SOS state if the actual backend request fails.

---

# 22. Location Rules

Location functionality must handle:

* Permission requests
* Permission denial
* Unavailable location
* Loading state
* Errors

The application must never assume location access is guaranteed.

Location-related failures should provide useful user feedback.

---

# 23. Responsive Design Rules

Every implemented feature must be responsive.

Before considering a task complete, verify behavior for:

* Mobile
* Tablet
* Desktop

Critical interactions must remain accessible on smaller screens.

Do not create entirely separate mobile and desktop implementations unless genuinely necessary.

Prefer responsive styling using the established Tailwind conventions.

---

# 24. Accessibility Rules

The agent should maintain reasonable accessibility.

Use:

* Semantic HTML
* Proper form labels
* Keyboard-accessible controls
* Clear focus states
* Accessible button behavior
* Clear error messages

Do not rely only on color to communicate critical information.

Interactive elements must not be implemented as non-interactive elements when proper semantic elements are available.

---

# 25. Styling Rules

Styling must follow:

```text
Design.md
```

The agent must:

* Use the established design system
* Reuse defined colors and tokens
* Maintain typography consistency
* Maintain spacing consistency
* Preserve visual consistency across pages

The agent must not randomly introduce:

* New color systems
* New font families
* Inconsistent border radii
* Inconsistent shadows
* Unrelated visual styles

Do not add styling frameworks when Tailwind CSS is already the established solution.

---

# 26. Hardcoded Value Rules

Avoid unnecessary hardcoding.

Repeated values should be extracted when they represent:

* Shared constants
* Configuration
* Reused labels
* Common behavior

However, do not extract trivial one-time values into separate files unnecessarily.

Use judgment.

---

# 27. Security Rules

The frontend must never contain:

* Private API keys
* Backend secrets
* Database credentials
* Private tokens
* Service account credentials

Environment variables must follow the frontend environment conventions.

Remember:

```text
Frontend environment variables are not secret.
```

Anything included in the frontend build may be accessible to users.

---

# 28. Environment Variable Rules

Configuration values should use environment variables where appropriate.

Example:

```text
VITE_API_BASE_URL
```

The agent must:

* Follow Vite conventions
* Avoid exposing secrets
* Avoid hardcoding environment-specific API URLs when configuration already exists

---

# 29. File Creation Rules

Before creating a file, determine whether an existing file already serves the purpose.

Do not create:

* Duplicate utilities
* Duplicate API files
* Duplicate components
* Multiple files with overlapping responsibilities

File names must be meaningful and consistent with the existing project.

---

# 30. Naming Rules

Use clear and descriptive names.

Examples:

```text
Good:
TripCard
CreateTripForm
useActiveTrip
tripApi

Avoid:
Component1
Helper
Data
Utils2
FinalNew
```

Avoid meaningless suffixes such as:

```text
New
Final
Latest
Updated
V2
```

unless they have an actual domain meaning.

---

# 31. Code Quality Rules

Code should be:

* Readable
* Maintainable
* Consistent
* Focused

Prefer simple solutions.

Avoid unnecessary nesting.

Avoid unnecessary complexity.

Comments should explain:

* Why something exists
* Non-obvious behavior
* Important decisions

Do not add comments that merely repeat obvious code.

---

# 32. No Dead Code

The agent must not leave unnecessary:

* Unused imports
* Unused variables
* Commented-out implementation
* Abandoned components
* Temporary debugging code

Temporary debugging code must be removed before completing the task.

---

# 33. Console Logging

Do not leave unnecessary `console.log()` statements in completed implementation code.

Temporary debugging logs should be removed after debugging.

Meaningful error logging may remain when it serves a legitimate purpose.

---

# 34. Routing Rules

Before adding a route:

* Check the existing routing architecture
* Determine whether the route is public, authentication-related, onboarding-related, or protected
* Apply the appropriate route guard

The agent must not duplicate route protection logic across every page.

Route protection should remain centralized.

---

# 35. Authentication Rules

The frontend must clearly distinguish between:

* Authentication loading
* Unauthenticated users
* Authenticated users
* Users with incomplete onboarding
* Users with completed onboarding

Protected content must not briefly appear before authentication resolution is complete.

The frontend must not implement authentication backend logic.

---

# 36. Query and Mutation Rules

For TanStack Query:

* Use predictable query keys
* Keep queries close to their features
* Invalidate or update relevant queries after mutations
* Avoid unnecessary refetches
* Avoid duplicating server data in Redux

Mutations must provide appropriate:

* Loading state
* Success handling
* Error handling

---

# 37. Verification Rule

Before considering a task complete, the agent should verify:

* The application builds successfully
* The application runs without new critical errors
* The changed functionality works as intended
* No unrelated functionality was intentionally broken
* Loading states are handled
* Error states are handled
* Empty states are handled where applicable
* Responsive behavior is preserved

The agent must not claim successful implementation without performing reasonable verification.

---

# 38. Build and Error Rules

If a build or runtime error occurs:

1. Read the actual error
2. Identify the root cause
3. Fix the root cause
4. Verify the fix

Do not hide errors using:

* Empty catch blocks
* Broad error suppression
* Ignoring TypeScript or lint errors
* Arbitrary `any` types, when TypeScript is used
* Removing functionality simply to eliminate an error

---

# 39. Scope Discipline

The agent must implement the requested task and current phase.

Do not:

* Add unrelated features
* Improve unrelated pages
* Redesign the entire application
* Refactor unrelated architecture
* Install packages for hypothetical future features

If the task reveals a genuine issue outside the requested scope, mention it rather than automatically fixing unrelated parts.

---

# 40. Documentation Update Rules

The agent must update documentation when implementation changes make existing documentation materially inaccurate.

Most importantly:

```text
docs/Memory.md
```

must be updated after meaningful progress.

The agent should not update every documentation file after every small code change.

Documentation updates should be meaningful and accurate.

---

# 41. Completion Report Rule

After completing a meaningful implementation task, the agent should clearly report:

## Completed

* What was implemented

## Modified

* Important files changed

## Verification

* What was tested or checked

## Remaining

* Any known issues or next steps

The report should be concise and factual.

Do not claim that something was tested if it was not tested.

---

# 42. When Information Is Missing

If required information is missing, the agent must not invent critical requirements.

Examples:

* Unknown API endpoint
* Unknown request structure
* Unknown response structure
* Undefined safety behavior
* Ambiguous user flow

The agent should:

1. Inspect available frontend and project context
2. Inspect relevant API documentation or backend contracts if available
3. Ask for clarification if the information remains unknown

Do not guess production behavior.

---

# 43. Agent Workflow

The mandatory development workflow is:

```text
1. Read project documents
        ↓
2. Read docs/Memory.md
        ↓
3. Inspect relevant existing frontend code
        ↓
4. Identify current phase
        ↓
5. Implement only the required task
        ↓
6. Verify the implementation
        ↓
7. Fix discovered issues
        ↓
8. Update docs/Memory.md
        ↓
9. Report completed work
```

---

# 44. Final Agent Checklist

Before completing any task, verify:

* [ ] Only files inside `frontend/` were modified
* [ ] Existing code was inspected before creating duplicates
* [ ] Current phase requirements were followed
* [ ] No unnecessary dependency was added
* [ ] No unrelated refactor was performed
* [ ] Loading states are handled
* [ ] Error states are handled
* [ ] Empty states are handled where required
* [ ] Responsive behavior is preserved
* [ ] Existing architecture patterns were followed
* [ ] No fake production backend logic was introduced
* [ ] No secrets were exposed
* [ ] Temporary debug code was removed
* [ ] The implementation was reasonably verified
* [ ] `docs/Memory.md` was updated after meaningful work

---

# 45. Core Principle

> **Implement exactly what is required, preserve what already works, avoid unnecessary complexity, and never modify anything outside the frontend directory.**

The agent's goal is not to generate the maximum amount of code.

The goal is to produce the **smallest correct, maintainable, and scalable implementation that satisfies the current frontend requirement**.

---

# 46. Map & Geofencing Rules
* Do not invent map data contracts.
* Do not hardcode fake coordinates as production behavior.
* Keep GPS logic independent from map rendering.
* Do not make the map the source of truth for safety state.
* Backend is authoritative for critical geofence decisions.
* Do not duplicate critical backend safety logic without explicit requirement.
* Do not invent polygon/zone formats.

# 47. Socket.IO Rules
* Inspect actual backend Socket.IO implementation.
* Never invent event names.
* Never invent payload formats.
* Prevent duplicate listeners.
* Prevent duplicate connections.
* Clean up listeners on unmount.
* Follow backend authentication requirements.
* Update TanStack Query server state appropriately.

# 48. UI Ownership Rules
* Do not design pages that are assigned to Prachi.
* Implement UI according to Prachi's approved handoff.
* Technical integration may proceed independently where UI is not required.
* Document UI requirements but do not independently make visual decisions.

# 49. Dependency Rules
Before installing Map libraries, Socket.IO clients, or any geospatial library:
* Inspect existing dependencies and determine whether the package is genuinely required.
* `socket.io-client` may be necessary if the project does not already contain an appropriate Socket.IO client, but do not install dependencies blindly.

## Latest safety-state rules

- Do not ship mock responder dispatches as fallback data in operational pages. Backend failure must surface as an error/empty state.
- Do not implement the signal-loss 5-minute or hourly timers in React; display server-owned deadlines/state.
- Do not expose blockchain snapshot ciphertext decryption secrets to the client.
- Use the backend-provided HTTPS group join URL as the QR payload.
- Profile field disabling during a trip is UX only; backend rejection remains authoritative.
