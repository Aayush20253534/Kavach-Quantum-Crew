# Design.md

# 1. Purpose

This document defines the visual design system for the **SIH Tourist Safety Frontend**.

It establishes:

* Design philosophy
* Visual direction
* Color system
* Typography
* Spacing
* Layout
* Components
* States
* Responsive behavior
* Motion
* Accessibility

All frontend UI should follow this document unless an explicit user instruction overrides it.

---

# 2. Design Philosophy

The SIH Tourist Safety Platform should feel:

* Modern
* Trustworthy
* Premium
* Calm
* Intelligent
* Safe
* Fast
* Professional

The interface must balance two goals:

1. **Communicate safety and urgency when necessary**
2. **Avoid making the entire application feel alarming or stressful**

The product should not look like:

* A generic government portal
* An outdated dashboard
* A cluttered emergency application
* A gaming interface
* An overly decorative travel website

The desired experience is:

> **A modern, intelligent safety platform that feels reliable enough to trust during travel.**

---

# 3. Core Visual Principles

## 3.1 Clarity Over Decoration

Visual elements must serve a purpose.

Avoid:

* Excessive gradients
* Decorative elements without meaning
* Overuse of glass effects
* Excessive animations
* Too many colors
* Dense dashboards

The user should immediately understand:

* Where they are
* What information matters
* What action they can take

---

## 3.2 Safety-Critical Hierarchy

Safety actions must have stronger visual priority than normal navigation actions.

Priority:

```text id="4p8eex"
Critical Action
      ↓
Safety Status
      ↓
Primary Information
      ↓
Secondary Information
      ↓
Supporting Content
```

Examples:

* SOS should be immediately visible
* Risk information should be easy to locate
* Important alerts should not blend into ordinary cards

---

## 3.3 Calm Default State

The default interface should feel calm.

Do not use emergency colors throughout the application.

Danger-related colors should be reserved for:

* SOS
* High risk
* Critical warnings
* Destructive actions
* Serious errors

---

# 4. Theme

The primary theme should be a **dark, modern interface** with a premium technology-oriented appearance.

The UI should use:

* Deep background surfaces
* Layered cards
* Soft borders
* Controlled transparency
* Subtle shadows
* Bright accent colors

The design should support visual depth without making text difficult to read.

Light mode should not be introduced unless explicitly required.

---

# 5. Color System

The color palette should communicate safety and trust.

## 5.1 Background Colors

### Primary Background

Used for the main application background.

Suggested direction:

```text id="bzxrbw"
Deep Navy / Blue-Black
```

Example range:

```text id="8lwtjt"
#060B16
#080D18
#0A1020
```

---

### Secondary Background

Used for:

* Sections
* Containers
* Sidebar areas

Example range:

```text id="qejrf1"
#0D1526
#101827
```

---

### Elevated Surface

Used for:

* Cards
* Modals
* Popovers
* Elevated content

Example range:

```text id="8s54er"
#111C30
#152238
```

---

## 5.2 Primary Accent

The primary accent should communicate:

* Trust
* Technology
* Reliability

Recommended direction:

```text id="dgwgs5"
Electric Blue
Cyan
Blue-Cyan
```

Example colors:

```text id="3lm96c"
#38BDF8
#0EA5E9
#2563EB
```

The exact implementation should remain consistent throughout the application.

---

## 5.3 Secondary Accent

Used for:

* Secondary highlights
* Active states
* Supporting emphasis

Recommended direction:

```text id="x5up9w"
Violet
Indigo
```

Example:

```text id="srtb6m"
#6366F1
#8B5CF6
```

Secondary accents should not compete with critical safety actions.

---

## 5.4 Success

Used for:

* Successful actions
* Safe states
* Positive status

Suggested direction:

```text id="65tlvs"
#22C55E
#16A34A
```

---

## 5.5 Warning

Used for:

* Caution
* Medium risk
* Attention-required states

Suggested direction:

```text id="gmpn3e"
#F59E0B
#FBBF24
```

---

## 5.6 Danger

Reserved for:

* SOS
* Critical risk
* Serious errors
* Destructive actions

Suggested direction:

```text id="rb5qwm"
#EF4444
#DC2626
```

Danger colors must not be used for ordinary primary actions.

---

## 5.7 Text Colors

### Primary Text

```text id="2tuy0h"
#F8FAFC
```

### Secondary Text

```text id="yl8hfj"
#CBD5E1
```

### Muted Text

```text id="5ph4qx"
#94A3B8
```

Text must remain readable against the selected background.

---

# 6. Safety Status Colors

Safety status should use a consistent semantic system.

```text id="ffoe6s"
Low Risk       → Green
Medium Risk    → Amber / Yellow
High Risk      → Orange / Red
Critical Risk  → Red
```

Do not rely only on color.

Risk states should also use:

* Text
* Icons
* Labels
* Clear descriptions

---

# 7. Typography

The application should use a clean, modern sans-serif typeface.

The font must prioritize:

* Readability
* Modern appearance
* Good mobile rendering
* Strong hierarchy

The exact font should use the existing project configuration if one is already defined.

Do not introduce multiple unrelated font families.

---

# 8. Typography Scale

The UI should maintain a clear hierarchy.

Suggested scale:

```text id="63lx9g"
Display
Page Title
Section Title
Card Title
Body
Secondary Body
Caption
```

Example visual hierarchy:

```text id="wqyx7s"
Display         Large and bold
Page Title      Large and strong
Section Title   Medium and semibold
Card Title      Medium
Body            Regular
Secondary       Muted
Caption         Small
```

Do not create arbitrary font sizes on every component.

Use a consistent typography scale.

---

# 9. Font Weight

Suggested usage:

```text id="6pgz5z"
Regular    → Body content
Medium     → Interactive labels
Semibold   → Section titles
Bold       → Important headings
```

Avoid using extremely bold text throughout the entire interface.

Strong weight should indicate importance.

---

# 10. Spacing System

Use a consistent spacing system.

Recommended rhythm:

```text id="0qpjiv"
4
8
12
16
20
24
32
40
48
64
```

Spacing should be based on consistent increments rather than arbitrary values.

The interface should feel spacious but not waste screen area.

---

# 11. Layout Principles

## 11.1 Content Width

Desktop content should not stretch excessively across large screens.

Use:

* Maximum content widths
* Responsive containers
* Intentional grid layouts

---

## 11.2 Page Padding

Page padding should adapt by device size.

Conceptually:

```text id="b4o15w"
Mobile  → Compact
Tablet  → Medium
Desktop → Spacious
```

---

## 11.3 Visual Grouping

Related content should be grouped using:

* Cards
* Spacing
* Borders
* Background separation

Avoid excessive use of borders.

Spacing should be the primary grouping mechanism.

---

# 12. Application Layout

The authenticated application layout should conceptually contain:

```text id="b9blqt"
Application Shell
│
├── Sidebar / Desktop Navigation
│
├── Top Area
│   ├── Page Context
│   ├── User Actions
│   └── Safety Actions
│
├── Main Content
│
└── Mobile Navigation
```

The exact structure should adapt responsively.

---

# 13. Desktop Layout

Desktop should prioritize:

* Clear navigation
* Comfortable information density
* Dashboard overview
* Multi-column layouts where useful

The sidebar should not consume unnecessary horizontal space.

Main content should remain the primary focus.

---

# 14. Mobile Layout

Mobile is important because the product is intended for tourists who may use the application while travelling.

The mobile experience must prioritize:

* Quick access
* Readability
* Large touch targets
* Minimal clutter
* Critical actions

Important safety actions must remain easy to access.

Avoid simply shrinking the desktop design.

---

# 15. Navigation Design

Navigation should be:

* Clear
* Consistent
* Lightweight

Navigation items should use:

* Icon
* Label
* Active state

The active state should be clearly visible but not visually excessive.

---

# 16. Buttons

Buttons should have clear visual hierarchy.

## Primary Button

Used for the main action.

Characteristics:

* Strong accent color
* Clear text
* High contrast
* Consistent height
* Visible hover and focus states

---

## Secondary Button

Used for supporting actions.

Characteristics:

* Lower emphasis
* Neutral or outlined style

---

## Ghost Button

Used for low-priority actions.

---

## Danger Button

Reserved for:

* SOS
* Destructive actions
* Critical operations

Danger buttons should not be visually identical to normal primary buttons.

---

# 17. SOS Button

The SOS action is a special component.

It must:

* Be highly visible
* Be easy to locate
* Clearly communicate its purpose
* Use danger styling
* Have an appropriate confirmation flow

It should not blend into ordinary action buttons.

However, the SOS button should not dominate every screen to the point that it causes visual stress.

---

# 18. Cards

Cards should provide structure and hierarchy.

Characteristics:

* Rounded corners
* Subtle border
* Layered surface
* Comfortable internal spacing
* Controlled shadow

Avoid:

* Heavy borders
* Excessive shadows
* Too many nested cards

A page should not look like every element is enclosed in a card.

---

# 19. Glassmorphism

Glassmorphism may be used selectively.

It can be appropriate for:

* Floating navigation
* Modals
* Overlays
* Highlighted dashboard elements

It should not be applied to every card.

The interface should remain readable without depending on heavy transparency.

---

# 20. Inputs

Inputs must be:

* Clearly visible
* Easy to interact with
* Large enough for mobile use
* Clearly labeled

Input states must include:

* Default
* Focus
* Filled
* Disabled
* Error

Error states must not rely only on color.

---

# 21. Form Design

Forms should:

* Use clear labels
* Group related fields
* Provide useful validation messages
* Avoid overwhelming users with too many fields at once

For onboarding, progressive grouping may be used when appropriate.

---

# 22. Modal Design

Modals should be used for focused interactions.

Examples:

* SOS confirmation
* QR display
* Group joining
* Important confirmations

Modals should:

* Have a clear title
* Clearly explain the action
* Provide a visible close mechanism when appropriate
* Not contain excessive nested interactions

---

# 23. Dashboard Design

The dashboard should feel like a **safety command center**, but not an overwhelming enterprise dashboard.

The hierarchy should be:

```text id="3wxnmh"
Safety Status
     ↓
Critical Actions
     ↓
Current Trip
     ↓
Location and Safe Zones
     ↓
Trip and Incident Summary
     ↓
Supporting Information
```

Avoid displaying too many unrelated metrics.

---

# 24. Safety Status Component

Safety status should clearly communicate:

* Current risk level
* Visual severity
* Supporting context where available

It may include:

* Status label
* Icon
* Risk indicator
* Short explanation

The user should understand the current state quickly.

---

# 25. Map and Location UI

Location-related interfaces should prioritize:

* Clear positioning
* Visible location context
* Safe zone visibility
* Safety information

Map controls should not obstruct critical information.

If the location is unavailable, provide a clear fallback state.

---

# 26. Safe Zone UI

Safe zones should be distinguishable from normal map elements.

Each safe zone may display:

* Name
* Type
* Distance
* Relevant status

Avoid overwhelming the user with excessive information.

---

# 27. Trip Cards

Trip cards should provide an at-a-glance summary.

Possible information:

* Destination
* Date
* Trip type
* Status
* Group information when relevant

Current trips should receive stronger emphasis than historical trips.

---

# 28. Incident UI

Incident reporting must prioritize clarity and speed.

The interface should avoid unnecessary fields.

Incident history should clearly distinguish:

* Incident type
* Status
* Time
* Relevant summary

Critical incidents should receive appropriate visual emphasis.

---

# 29. Chatbot UI

The chatbot should feel integrated into the platform.

Requirements:

* Clear message separation
* Comfortable reading width
* Distinct user and assistant messages
* Clear sending state
* Clear loading state

Avoid making the chatbot visually resemble a generic third-party widget.

---

# 30. Empty States

Empty states should be helpful.

Every major empty state should include:

* Clear explanation
* Supporting visual or icon
* Action when appropriate

Examples:

```text id="m3ktnd"
No active trip
→ Create a Trip

No incidents
→ You have no recorded incidents

No nearby safe zones
→ Unable to find safe zones in your current area
```

---

# 31. Error States

Errors should:

* Be clear
* Be human-readable
* Avoid technical jargon
* Offer retry when appropriate

Example structure:

```text id="76r6sr"
Something went wrong

We could not load nearby safe zones.

[Try Again]
```

---

# 32. Loading States

Loading should feel intentional.

Use appropriate loading indicators:

* Button spinner for actions
* Section skeleton for content
* Full-page loader only when necessary

Avoid blocking the entire application for small background operations.

---

# 33. Icons

Icons should:

* Support understanding
* Be visually consistent
* Be used alongside text when clarity requires it

Do not use icons as decoration everywhere.

Critical actions should not depend on icon recognition alone.

---

# 34. Border Radius

Maintain a consistent radius system.

Suggested levels:

```text id="zmxau4"
Small   → Inputs and small controls
Medium  → Buttons
Large   → Cards
XLarge  → Major containers
Full    → Pills and circular elements
```

Do not use random radius values across components.

---

# 35. Borders

Use subtle borders to separate surfaces.

Suggested characteristics:

* Low contrast
* Semi-transparent where appropriate
* More visible on interactive elements

Avoid heavy outlines around every element.

---

# 36. Shadows

Shadows should create subtle elevation.

Use shadows for:

* Floating elements
* Modals
* Important elevated cards

Avoid:

* Extremely dark shadows
* Excessive blur
* Strong shadows on every card

---

# 37. Motion and Animation

Animations should be subtle and purposeful.

Appropriate uses:

* Modal transitions
* Button feedback
* Navigation transitions
* Card hover states
* Loading indicators

Avoid:

* Long animations
* Decorative animations
* Excessive motion
* Animations that delay important actions

Safety-critical actions should provide immediate feedback.

---

# 38. Hover and Interaction States

Desktop interactive elements should provide:

* Hover feedback
* Focus state
* Active feedback

Mobile should prioritize:

* Touch feedback
* Clear active states

Interaction feedback should be subtle and fast.

---

# 39. Responsive Breakpoints

Use the Tailwind CSS responsive system already configured in the project.

The design must adapt across:

```text id="1ihxhy"
Mobile
Tablet
Laptop
Desktop
Large Desktop
```

Do not optimize exclusively for one screen size.

---

# 40. Accessibility

The design must consider:

* Contrast
* Focus visibility
* Text readability
* Touch target size
* Error clarity

Critical information must not rely solely on:

* Color
* Animation
* Hover interactions

---

# 41. Page Consistency

All pages should share:

* Consistent spacing
* Consistent typography
* Consistent navigation
* Consistent component behavior
* Consistent feedback patterns

Each page can have its own purpose and layout without becoming a completely different visual product.

---

# 42. Design Do's

The frontend should:

* Use strong visual hierarchy
* Keep safety actions accessible
* Use semantic colors consistently
* Maintain generous but efficient spacing
* Keep mobile interactions simple
* Use subtle depth
* Reuse components
* Keep pages focused

---

# 43. Design Don'ts

The frontend should not:

* Use emergency colors everywhere
* Overuse gradients
* Overuse glassmorphism
* Put every element inside a card
* Use excessive animations
* Create dense unreadable dashboards
* Hide critical actions
* Depend only on color for status
* Use inconsistent spacing
* Introduce random visual styles per page

---

# 44. Final Design Principle

> **The interface should feel calm when the user is safe and urgent only when urgency is required.**

The design should make the platform feel trustworthy enough for safety-critical situations while remaining modern, premium, and intuitive for everyday travel use.
