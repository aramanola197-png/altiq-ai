# ALTIQ AI Backend

AI Builder Operating System for the Stacks ecosystem and Zero Authority DAO.

## Setup

1. Copy `.env.example` to `.env` and fill in all required values.
2. `npm install`
3. `npm run dev` (or `npm start`)

## Required Environment Variables

See `.env.example` for the full list. The server will refuse to start if any required variable is missing.

## Auth Notes

- JWT is stored in an `httpOnly` cookie named `altiq_token`.
- Sessions are sliding (re-issued on every authenticated request).
- Google OAuth uses a temporary session only for the handshake.
- After registration / first Google login, users are redirected to complete the Builder Profile.
