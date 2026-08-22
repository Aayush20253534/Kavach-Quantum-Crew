# Prachi's UI/UX Handoff & Tracking

## 1. Purpose
This document is the bridge between Frontend Architecture (Aayansh & AI) and UI/UX Design (Prachi). 
It contains exactly what needs to be designed, the current status of those designs, and notes for implementation.

## 2. How to Use This File
Hi Prachi! 👋 
- When you start working on a task, change `[ ]` to `[-]`.
- When a design is complete, change it to `[x]` and optionally add a Figma link next to it.
- If you have questions or notes about a specific component, write them directly below the task item.

---

# 🚀 CURRENT ASSIGNMENTS (Completed & Implemented)

All foundational UI/UX components, application shells, and Phase 1-4 screens have been fully designed and integrated following `Design.md`.

## 🎨 Shared Components & Design System
These are the foundational building blocks following the dark theme guidelines in `Design.md`.
- `[x]` **SOS Button**: High-visibility pulsing emergency component with confirmation countdown and hold-to-activate safeguards to prevent accidental clicks (`src/components/ui/SOSButton.jsx`).
- `[x]` **Buttons**: Primary (electric blue/cyan gradient), Secondary (elevated dark surface), Ghost, Danger, and Warning states with loading spinner and icon support (`src/components/ui/Button.jsx`).
- `[x]` **Inputs**: Text fields, Select dropdowns, Textareas with dark theme styling, left/right icons, and validation error messages (`src/components/ui/Input.jsx`, `Select.jsx`, `Textarea.jsx`).
- `[x]` **Cards**: Layered content containers with subtle border depth, glassmorphism, and hover glow (`src/components/ui/Card.jsx`).
- `[x]` **Modals**: Overlay popups with backdrop blur (`backdrop-blur-md`), keyboard ESC handling, and scale-in animations (`src/components/ui/Modal.jsx`).
- `[x]` **Status Badges**: Semantic risk indicators for Low (Green), Medium (Amber), High (Orange), Critical (Red), with glowing pulse dots (`src/components/ui/Badge.jsx`).
- `[x]` **Empty States**: Illustrated, friendly placeholders for empty trips, incidents, and groups with call-to-action buttons (`src/components/ui/EmptyState.jsx`).
- `[x]` **Loading States**: Spinners, Full-page session loader, and Skeleton loaders for cards and lists (`src/components/ui/Loader.jsx`).

## 📐 Application Layouts
- `[x]` **Tourist Layout**: Mobile-first design with Bottom Navigation Bar (for phones) and full-featured desktop Sidebar + top context bar (`src/app/layouts/TouristLayout.jsx`).
- `[x]` **Authority Layout**: Professional, data-heavy Sidebar command center with emergency broadcast triggers and live sector ticker (`src/app/layouts/AuthorityLayout.jsx`).
- `[x]` **Public Layout**: High-converting Landing page layout with emergency ribbon, glass Navbar, and comprehensive footer with safety hotlines (`src/app/layouts/PublicLayout.jsx`).
- `[x]` **Auth Layout**: Minimal, distraction-free wrapper with security watermarks for Login and Register (`src/app/layouts/AuthLayout.jsx`).

## 📄 Phase 1 & 2 Pages
- `[x]` **Landing Page (`HomePage`)**: Hero section with live radar visualizer, live protection stats, Prayagraj Safe Zones preview, features grid, emergency hotlines, and call-to-action (`src/features/public/pages/HomePage.jsx`).
- `[x]` **Login Page**: Multi-role login (Tourist, Authority, Admin) with role tabs, email/username, show/hide password, and validation (`src/features/auth/pages/LoginPage.jsx`).
- `[x]` **Register Page**: Registration form for Name, Username, Email, Phone, Password, Confirm Password, password strength meter, terms acceptance, and forward to onboarding (`src/features/auth/pages/RegisterPage.jsx`).

## 📄 Phase 3 & 4 Pages
- `[x]` **Onboarding Flow (`OnboardingPage`)**: 4-step wizard collecting Personal Details, Emergency Contact, Medical Info (Blood Group & Allergies), and Safety & Privacy Permissions (`src/features/onboarding/pages/OnboardingPage.jsx`).
- `[x]` **Tourist Dashboard (`TouristDashboardPage`)**: 
  - *State A (No Active Trip)*: Welcome hero, quick action cards, nearby safe havens explorer, city safety index.
  - *State B (Active Trip)*: Live interactive radar & geofence map view, live group companion battery & distance telemetry, current trip risk gauge, and quick SOS access.
  - Includes interactive state switch toolbar to test and demo both states instantly!

---

# 🗓️ UPCOMING ASSIGNMENTS (Completed & Implemented)

## 🗺️ Trips & Groups
- `[x]` **Create Trip**: Destination selection across Prayagraj pilgrimage points, Solo vs Group choice, check-in intervals (`src/features/trips/pages/CreateTripPage.jsx`).
- `[x]` **Current Trip**: Live active view with geofence map, itinerary checkpoints, group members status, and quick SOS drawer (`src/features/trips/pages/CurrentTripPage.jsx`).
- `[x]` **Trip History**: Feed of past trips with safety certificates and duration statistics (`src/features/trips/pages/TripHistoryPage.jsx`).
- `[x]` **Create Group**: Generate dynamic safety QR code and copyable join link (`src/features/groups/pages/CreateGroupPage.jsx`).
- `[x]` **Join Group**: QR Scanner interface with camera viewfinder simulation and manual code fallback (`src/features/groups/pages/JoinGroupPage.jsx`).

## 🚨 Safety & Incidents
- `[x]` **Report Incident**: Form for incident category, severity level, GPS coordinates auto-detect, and photo attachment mockup (`src/features/incidents/pages/ReportIncidentPage.jsx`).
- `[x]` **Incident History**: List of reported incidents with real-time status tracking (Pending, Dispatched, Resolved) and authority notes (`src/features/incidents/pages/IncidentHistoryPage.jsx`).

## 👤 Profile & Chatbot
- `[x]` **Profile Page**: Digital Tourist Safety ID Card (blockchain verified tag, QR code, blood group, emergency contact) and editable profile records (`src/features/profile/pages/ProfilePage.jsx`).
- `[x]` **Chatbot UI**: Floating 24/7 **Rakshak AI** safety assistant widget with conversational responses, quick suggestion chips, hospital finder, and emergency helpline locator (`src/components/chatbot/ChatbotWidget.jsx`).
- `[x]` **Authority Dashboard**: Live SOS triage feed, crowd density monitor, and mass emergency broadcast alert modal (`src/features/authority/pages/AuthorityDashboardPage.jsx`).

---

# 📍 NEW: Tracking, Map, & Real-Time Assignments
*Backend capabilities for geofencing, OTP, and tracking are now functional. Please design the following UI states:*

## 🗺️ Map and Live Tracking
- `[ ]` **Map Visual State**: General styling for the OpenStreetMap layout.
- `[ ]` **Current Location Marker**: With uncertainty/accuracy radius if applicable.
- `[ ]` **Group Member Markers**: Distinct from the current user.
- `[ ]` **Safe Zone / Geofence Visualization**: How risk polygons/circles appear on the map.
- `[ ]` **Permission States**: Request state, Denied state, Location Unavailable state.

## 🚨 Active Trip & Alerts
- `[ ]` **Active Tracking State**: Indicator that GPS tracking is currently active.
- `[ ]` **Alert Presentation**: Severity levels (Warning, Danger), New Alert toast/modal, Acknowledged state, Resolved state.

## 🔔 Notifications
- `[ ]` **Notification Center**: List/panel for historical and real-time notifications.
- `[ ]` **Unread & Critical States**: Visual distinction for unread or critical notifications.

*(Note: Prachi designs the visual experience. Aayansh will implement the technical API and Socket.IO integrations).*

---

## 📝 Design Notes & Discussion
*(Prachi, feel free to drop any questions, Figma links, or global design notes here!)*

All design tasks are completed and verified against Vite build!
