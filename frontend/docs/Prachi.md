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

# 🚀 CURRENT ASSIGNMENTS (High Priority)

The frontend architecture and routing are fully set up. We are currently blocked on Phase 1 & 2, which require the foundational designs and the initial public/auth screens.

## 🎨 Shared Components & Design System
These are the foundational building blocks. Ensure they follow the visual guidelines in `Design.md`.
- `[ ]` **SOS Button**: Needs to be highly visible, accessible, but not visually stressful. Should include a confirmation state to prevent accidental clicks.
- `[ ]` **Buttons**: Primary, Secondary, Ghost, and Danger states (Default, Hover, Active, Disabled).
- `[ ]` **Inputs**: Text fields, Select dropdowns, Textareas (Default, Focus, Error, Disabled).
- `[ ]` **Cards**: Standard content containers with subtle depth/shadows.
- `[ ]` **Modals**: Overlay popups for confirmations and QR codes.
- `[ ]` **Status Badges**: Indicators for Risk Levels (Low, Medium, High, Critical).
- `[ ]` **Empty States**: Friendly placeholders when there is no data (e.g., "No active trips").
- `[ ]` **Loading States**: Spinners or skeleton loaders.

## 📐 Application Layouts
These are the structural shells that wrap around the pages.
- `[ ]` **Tourist Layout**: Mobile-first design. Needs a Bottom Navigation Bar (for phones) and a Sidebar (for desktop).
- `[ ]` **Authority Layout**: Needs a professional, data-heavy Sidebar for desktop users.
- `[ ]` **Public Layout**: Needs a clean Navbar and Footer for the landing page.
- `[ ]` **Auth Layout**: Minimal, distraction-free wrapper for Login/Register.

## 📄 Phase 1 & 2 Pages
- `[ ]` **Landing Page (`HomePage`)**: Hero section, problem/solution, features, and call-to-action to sign up.
- `[ ]` **Login Page**: Form for Username/Email and Password.
- `[ ]` **Register Page**: Form for Name, Username, Email, Phone, Password, and Confirm Password.

## 📄 Phase 3 & 4 Pages
- `[ ]` **Onboarding Flow**: Multi-step or clean long-form collecting Gender, Age, Medical History, Emergency Contact, Nationality.
- `[ ]` **Tourist Dashboard**: 
  - *State A (No Active Trip)*: Prompt to create a trip, safe zones, general risk, past stats.
  - *State B (Active Trip)*: Live map/location, SOS access, current trip risk level.

---

# 🗓️ UPCOMING ASSIGNMENTS (Next Priorities)

Once the foundation is complete, we will move on to these features:

## 🗺️ Trips & Groups
- `[ ]` **Create Trip**: Destination selection, Solo vs Group choice.
- `[ ]` **Current Trip**: Live active view with map, group members, and safety status.
- `[ ]` **Trip History**: Feed of past trips.
- `[ ]` **Create Group**: Generate QR code and link.
- `[ ]` **Join Group**: QR Scanner interface.

## 🚨 Safety & Incidents
- `[ ]` **Report Incident**: Form for incident type and description.
- `[ ]` **Incident History**: List of reported incidents and their statuses (e.g., Pending, Resolved).

## 👤 Profile & Chatbot
- `[ ]` **Profile Page**: View and edit personal/safety info.
- `[ ]` **Chatbot UI**: Floating chat widget or dedicated chat panel.

---

## 📝 Design Notes & Discussion
*(Prachi, feel free to drop any questions, Figma links, or global design notes here!)*

- **Figma Link:** `[Paste Link Here]`
