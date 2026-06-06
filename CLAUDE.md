# BrightSAT Trainer — Claude Code Context

## Project
Free, ad-free Digital SAT practice app. Vanilla JS/HTML/CSS. No login required.
Live production site: https://brightsat-live.vercel.app

## Stack
- Frontend: `index.html`, `css/styles.css`, `js/app.js`, `js/storage.js`
- Question data: `data/` directory
- Optional backend: `server.js` (Node, for persistent user profiles via `user-store.json`)

## Branch & Deployment Workflow
- **`main`** → auto-deploys to `brightsat-live.vercel.app` (production)
- **`dev`** → auto-deploys to a Vercel preview URL (staging/testing)

### Standard workflow
1. All changes go to the `dev` branch first
2. Vercel builds a preview URL for `dev` automatically
3. User tests on the preview URL
4. When approved, merge `dev` → `main` to ship to production
5. User runs `git pull` at home to sync local machine

### DEV PREVIEW banner
`index.html` has a visible amber banner (`DEV PREVIEW`) injected at the top of `<body>` when on the `dev` branch. This is intentional — it confirms you're looking at the dev deployment, not production. Remove it only when merging to `main`.

## How This User Works
- Edits are often initiated from a mobile device via claude.ai/code
- Claude pushes changes to `dev`, user tests on Vercel preview, then approves shipping to `main`
- Local home computer syncs via `git pull origin main` after merging
