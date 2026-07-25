# ALTIQ AI — Deployment Guide

## Prerequisites
- Node.js 18+
- MongoDB Atlas cluster
- Google Cloud OAuth credentials
- Google AI Studio Gemini API key
- (Optional for live opportunities) Zero Authority DAO API credentials + Stacks API base URL

## Backend (e.g. Render)
1. Create a Web Service from the `backend` folder.
2. Set environment variables from `backend/.env.example` (all required keys must be present).
3. Build: `npm install`
4. Start: `npm start`
5. Ensure `CLIENT_URL` matches the deployed frontend origin exactly.
6. Add production Google OAuth redirect URI: `https://YOUR_API/api/auth/google/callback`

## Frontend (e.g. Vercel)
1. Root directory: `frontend`
2. Build command: `npm run build`
3. Output: `dist`
4. Environment: none required at build time for API (uses relative `/api` in production behind a reverse proxy, or configure your host to proxy `/api` to the backend).
5. For separate hosts, set a frontend API base if you introduce one; current Vite proxy is for local dev only.

## Post-deploy checklist
- [ ] Health: `GET /api/health`
- [ ] Register + login (email)
- [ ] Google OAuth end-to-end
- [ ] Complete builder profile
- [ ] Create project
- [ ] AI chat responds (Gemini key valid)
- [ ] Research / Brand / Docs generate
- [ ] Opportunities list shows empty state or cached official data
- [ ] Sync opportunities (with credentials) does not invent data
- [ ] Submission draft works when opportunities exist
- [ ] Export markdown/json downloads
- [ ] Mobile drawer + desktop sidebar

## Security notes
- JWT is httpOnly cookie only
- CORS locked to CLIENT_URL with credentials
- Rate limiting enabled
- Passwords bcrypt cost 12
- Gemini / ZADAO / Stacks keys never sent to the client
EOF
