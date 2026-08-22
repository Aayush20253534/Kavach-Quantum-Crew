# Prachi's UI/UX Handoff & Tracking

## 1. Purpose
This document is the bridge between Frontend Architecture (Aayansh) and UI/UX Design (Prachi). 
Aayansh has successfully wired up the complete functional logic of the React application to the Backend across all 6 phases. The components are functional but are currently using very basic, placeholder Tailwind styling.

Your task is to take these functional components and apply the **Premium Design Aesthetics** (Dark modes, glassmorphism, vibrant gradients, micro-animations, modern typography) as requested by the project requirements.

## 2. How to Use This File
Hi Prachi! 👋 
- When you start working on a design task, change `[ ]` to `[-]`.
- When a design is complete, change it to `[x]` and optionally add a Figma link next to it.
- **IMPORTANT**: Do not remove or change the `onClick`, `onSubmit`, `onChange`, `ref`, or React Query/Redux hooks in the components! Aayansh has wired them perfectly to the backend. You only need to change the `className` attributes and HTML structure for styling.

---

# 🚀 CURRENT DESIGN ASSIGNMENTS

Please design and polish the following newly functional pages and components:

## 🔐 Phase 1: Authentication
- `[ ]` **VerifyEmailPage.jsx**: Style the OTP input screen. Make it look secure and modern. Add focus states to the input.
- `[ ]` **LoginPage.jsx & RegisterPage.jsx**: Upgrade the basic forms to have glassmorphic cards, glowing borders on focus, and smooth validation error transitions.

## 👤 Phase 2: Onboarding
- `[ ]` **OnboardingPage.jsx**: This form uses `react-hook-form` to dynamically add multiple emergency contacts. Style the "Add another contact" button and make the dynamic fields look like cohesive cards rather than basic borders.

## 🗺️ Phase 3: Trips & Groups
- `[ ]` **CreateTripPage.jsx**: Style the "Solo vs Group" toggle to look like premium segmented controls. Make the date pickers look modern.
- `[ ]` **CurrentTripPage.jsx**: This is the live trip dashboard. Style the "Start Trip", "Mark as Completed", and "Cancel Trip" buttons. They currently look very basic. Add micro-animations on hover.
- `[ ]` **TripHistoryPage.jsx**: Style the history table. Make it look like a sleek data grid.
- `[ ]` **CreateGroupPage.jsx**: This page generates a QR/Invite token. Style the token display to look like a premium digital ticket. (You can also replace the placeholder with a real `react-qr-code` component if you wish).
- `[ ]` **JoinGroupPage.jsx**: Style the token input field. Make it look like a scanner or a high-tech input terminal.

## 📍 Phase 4: Maps & Tracking
- `[ ]` **TouristDashboardPage.jsx**: This page now houses the live `MapComponent`. 
  - Design the "Ready for your trip?" banner to look inviting.
  - Design a premium HUD (Heads Up Display) overlay that sits *on top* of the map (using `absolute z-[1000]`) to show speed, accuracy, and active tracking status.
- `[ ]` **MapComponent.jsx**: (Optional) You can customize the Leaflet tile layer URL to a dark mode map provider (like CartoDB Dark Matter) if you want it to fit a dark aesthetic.

## 🚨 Phase 5: SOS & Incidents
- `[ ]` **SOSButton.jsx**: Aayansh built a 3-second "Hold to Trigger" logic. 
  - Make the button look extremely critical and important. 
  - Add a visual fill or ripple animation while the user is holding it down (using the `holding` state). 
  - Make the "SOS DISPATCHED" state look highly urgent.
- `[ ]` **ReportIncidentPage.jsx**: Style the incident reporting form. Make the file upload input look like a modern drag-and-drop zone instead of a default browser `<input type="file">`.

## 🏢 Phase 6: Authority Command Center
- `[ ]` **AuthorityDashboardPage.jsx**: This is the disaster manager's view.
  - Style the "Active SOS Alerts" feed to look like a high-tech dispatch terminal with pulsing red alerts.
  - Style the "Recent Hazards" feed.
  - Ensure the layout is dense but readable, suitable for a desktop command center monitor.

---

## 📝 Design Notes & Discussion
*(Prachi, feel free to drop any questions, Figma links, or global design notes here!)*

*Remember to test your designs on both mobile (Tourist side) and desktop (Authority side) to ensure responsiveness.*
