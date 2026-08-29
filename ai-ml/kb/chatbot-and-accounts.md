# Chatbot and Accounts

> Current implementation reference, synchronized **29 August 2026**. Source code and runtime configuration are authoritative.

Rakshak AI requires the authenticated KAVACH user context in production. Chat history is stored per user. Clearing visible history does not authorize access to another user's history.

KAVACH account flows include registration, email OTP verification, login/refresh/logout and password recovery. Transactional email is delivered through Mailjet by the main backend.
