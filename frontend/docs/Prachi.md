# Prachi's UI/UX Handoff & Tracking

## 1. Purpose
This document is the bridge between Frontend Architecture (Aayansh) and UI/UX Design (Prachi). 
Aayansh has successfully wired up the complete functional logic of the React application to the Backend. The components are functional but are currently using very basic, placeholder Tailwind styling.

Your task is to take these functional components and apply the **Premium Design Aesthetics** (Dark modes, glassmorphism, vibrant gradients, micro-animations, modern typography) as requested by the project requirements.

## 2. How to Use This File
Hi Prachi! 👋 
- When you start working on a design task, change `[ ]` to `[-]`.
- When a design is complete, change it to `[x]` and optionally add a Figma link next to it.
- **IMPORTANT**: Do not remove or change the `onClick`, `onSubmit`, `onChange`, `ref`, or React Query/Redux hooks in the components! Aayansh has wired them perfectly to the backend. You only need to change the `className` attributes and HTML structure for styling.

---

# 🚀 CURRENT DESIGN ASSIGNMENTS

Please design and polish the following newly functional pages and components from scratch. Since Aayansh has provided the basic structural placeholders, it's your job to make them look world-class.

## 🎨 Shared UI Components (`src/components/ui/`)
- `[ ]` **SOSButton.jsx**: The critical "Hold to Trigger" emergency button. Make it highly visible, pulsing, and scary to press.
- `[ ]` **Button.jsx**: Create primary, secondary, ghost, and danger variations. Add hover effects and loading states.
- `[ ]` **Input.jsx / Select.jsx / Textarea.jsx**: Modern, clean form fields with focus rings, icons, and error states.
- `[ ]` **Card.jsx**: Glassmorphic, elevated containers used throughout the dashboards.
- `[ ]` **Modal.jsx**: Overlay popups with backdrop blur.
- `[ ]` **Badge.jsx**: Status indicators (e.g. Danger, Safe, Pending).
- `[ ]` **Loader.jsx**: Spinners and skeleton screens.
- `[ ]` **EmptyState.jsx**: Friendly "No data found" views for empty lists.

## 📐 Application Layouts (`src/app/layouts/`)
- `[ ]` **PublicLayout.jsx**: Navbars and Footers for the landing page.
- `[ ]` **AuthLayout.jsx**: A clean, distraction-free split-screen layout for login/register.
- `[ ]` **TouristLayout.jsx**: Must include a mobile-first Bottom Navigation Bar and a desktop sidebar.
- `[ ]` **AuthorityLayout.jsx**: A professional, dense sidebar layout for disaster managers.

## 🌐 Public Pages (`src/features/public/pages/`)
- `[ ]` **HomePage.jsx**: The high-converting landing page. Hero section, features, safety statistics, and call-to-actions.
- `[ ]` **NotFoundPage.jsx**: Creative 404 page.

## 🔐 Auth Pages (`src/features/auth/pages/`)
- `[ ]` **LoginPage.jsx**: Login form with role selection (Tourist/Authority/Admin).
- `[ ]` **RegisterPage.jsx**: Multi-field registration form with password strength indicator.
- `[x]` **VerifyEmailPage.jsx**: The 6-box OTP input screen with auto-focus, email editor, and resend countdown.

## 👤 Onboarding & Profile
- `[ ]` **OnboardingPage.jsx** (`src/features/onboarding/pages/`): A wizard for Medical Details and dynamically adding Emergency Contacts.
- `[ ]` **ProfilePage.jsx** (`src/features/profile/pages/`): A digital Tourist ID card displaying the user's safety profile and settings.

## 🗺️ Tourist Dashboard & Tracking
- `[ ]` **TouristDashboardPage.jsx** (`src/features/tourist/pages/`): The primary home screen. Design a "Ready for trip?" banner and a premium Heads-Up Display (HUD) that sits on top of the map when tracking is active.
- `[ ]` **MapComponent.jsx** (`src/features/tracking/components/`): Customize the map frame and tooltips.

## 🎒 Trips (`src/features/trips/pages/`)
- `[ ]` **CreateTripPage.jsx**: A sleek form to plan a trip with segmented controls for Solo vs. Group.
- `[ ]` **CurrentTripPage.jsx**: The live trip screen. Style the itinerary, checkpoints, and action buttons (Start, Complete, Cancel).
- `[ ]` **TripHistoryPage.jsx**: A modern data grid/table showing past trips.

## 👥 Groups (`src/features/groups/pages/`)
- `[ ]` **CreateGroupPage.jsx**: Displays a generated Invite Token (QR Code placeholder). Make it look like a premium digital ticket.
- `[ ]` **JoinGroupPage.jsx**: Token input field. Style it like a high-tech scanner.

## 🚨 Incidents & Safety (`src/features/incidents/pages/`)
- `[ ]` **ReportIncidentPage.jsx**: The hazard reporting form. Make the file upload look like a modern drag-and-drop zone.
- `[ ]` **IncidentHistoryPage.jsx**: List of past reports and their resolution status.

## 🤖 Chatbot (`src/components/chatbot/`)
- `[ ]` **ChatbotWidget.jsx**: The floating Rakshak AI widget. Needs a chat bubble, message history window, and quick-action chips.

## 🏢 Authority Command Center (`src/features/authority/pages/`)
- `[ ]` **AuthorityDashboardPage.jsx**: The disaster manager's view. Needs to look dense but readable. Style the "Active SOS Alerts" feed to look like a high-tech dispatch terminal with pulsing red indicators. Style the "Recent Hazards" feed.

---

## 📝 Design Notes & Discussion
*(Prachi, feel free to drop any questions, Figma links, or global design notes here!)*

*Remember to test your designs on both mobile (Tourist side) and desktop (Authority side) to ensure responsiveness.*
