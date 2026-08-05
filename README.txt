ALTIQ AI — Submission + opportunities + polish (v1.2.0)

REPLACE these paths into your project root (preserve folder structure):

  backend/utils/ecosystem.js
  backend/routes/opportunities.routes.js
  backend/routes/auth.routes.js
  backend/server.js
  frontend/src/lib/version.js          (NEW)
  frontend/src/pages/workspace/Submission.jsx
  frontend/src/pages/workspace/Overview.jsx
  frontend/src/pages/Opportunities.jsx
  frontend/src/pages/Projects.jsx
  frontend/src/pages/Settings.jsx
  frontend/src/pages/LandingPage.jsx
  frontend/src/components/AppShell.jsx
  frontend/src/components/OrbitalBackground.jsx

THEN
  1. Restart backend
  2. Opportunities → Sync official sources
  3. Hard-refresh frontend

WHAT CHANGED
1. Submission Assistant
   - Section "Funding" → official Zero Authority DeGrants link
   - Section "Matched opportunities" → OPEN bounties/quests only
   - No Prepare draft on closed / private gigs (Marketing, Developer, etc.)
2. Opportunity sync (included)
   - Open bounties from /api/bounties?status=Open
   - Gigs removed from public list
   - Correct /bounty/{id} links
3. Particles slightly bolder (still premium, not noisy)
4. Version v1.2.0 on AppShell footer, Landing footer, and Settings
5. Longer About text on project cards + project Overview
6. Auth rate limit no longer blocks /me after Google login
