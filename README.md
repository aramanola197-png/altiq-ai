# ALTIQ AI

**Build. Position. Win.**

AI Builder Operating System for the Stacks ecosystem and Zero Authority DAO.

## Final cumulative delivery (Phases 1–5)

This package contains the full progressive implementation of the Project Knowledge Transfer roadmap.

### Core journey
Idea → Research → Validation → Branding → Documentation → Opportunity Discovery → Preparation → Submission

### Included
- Landing page (Geist + Montserrat, monochrome, orbital background)
- Auth (email + Google OAuth, JWT httpOnly cookie, sliding sessions)
- Mandatory Builder Profile
- Dashboard, Settings, Projects
- Project Workspace tabs: Overview, AI, Research, Brand, Documentation, Submission, Timeline
- Gemini-backed AI chat (project-scoped, specialist modes, resilient errors)
- Research / Brand / Documentation generation (versioned)
- Opportunity Center (Zero Authority DAO primary, Stacks secondary — never fabricated)
- Intelligent matching with explainable reasons (when official data exists)
- Submission Assistant (editable drafts only)
- Export (Markdown + JSON)
- Activity Timeline
- Centralized design system + glass components
- Production config, logging, rate limiting, ownership checks
- Deployment guide

### Run locally
```bash
# Backend
cd backend && cp .env.example .env
# fill required vars including GEMINI_API_KEY
npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

See `DEPLOYMENT.md` for production.

### Opportunity data
Live records appear only after official API credentials are configured and a sync succeeds. Empty states are intentional and professional — the system never invents grants or bounties.

### Design system
- Colors: #111111, #232323, #A7A7A7, #D9D9D9, #FFFFFF
- Geist (hierarchy) · Montserrat (body)
- Glass via shared components derived from brand palette
