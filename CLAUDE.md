# ScholarFlow — CLAUDE.md

AI-powered literature review manager. Full-stack web app for systematic reviews: corpus import, PRISMA-compliant screening, tagging, AI assistant (Claude API), and publication-ready exports.

**Course:** Fundamentals of Software Technology · Beihang University · Spring 2026
**Demo deadline:** 2026-06-12 · **Docs deadline:** 2026-06-26

---

## Repository Layout

```
scholarflow/
├── client/               # React 18 + Vite frontend
├── server/               # Node.js + Express REST API
├── doc/                  # Assignment documents
├── docker-compose.yml    # Three-service stack (db, server, client)
├── .env.example          # Copy to .env and fill secrets
└── CLAUDE.md
```

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Frontend | React 18 + Vite | `client/` |
| Styling | Tailwind CSS | utility-first, no component library |
| HTTP client | Axios | JWT interceptor attached globally |
| Routing | React Router v6 | file in `client/src/router/` |
| State | React Context + local state | no Redux/Zustand — keep it simple |
| Backend | Node.js 20 + Express | `server/` |
| Auth | JWT (jsonwebtoken) + bcrypt | stateless, token in Authorization header |
| ORM | Prisma | schema at `server/prisma/schema.prisma` |
| Database | PostgreSQL 16 | |
| BibTeX | bibtex-parse (npm) | server-side only |
| AI | Anthropic Claude API | backend proxy — key never touches browser |

---

## Dev Commands

```bash
# From project root — run each in a separate terminal

# 1. Start database (Docker)
docker compose up db

# 2. Backend
cd server
npm install
npx prisma migrate dev
npm run dev          # nodemon, port 3001

# 3. Frontend
cd client
npm install
npm run dev          # Vite, port 5173 — proxies /api → localhost:3001
```

### Other useful commands

```bash
# Prisma
npx prisma studio          # GUI for the DB (run from server/)
npx prisma migrate reset   # wipe and re-seed (dev only)

# Frontend build
cd client && npm run build

# Lint (both packages)
npm run lint               # ESLint
```

---

## Project Structure (Detailed)

### `client/src/`

```
assets/              # Static files (SVGs, images)
components/
  ui/                # Generic atoms: Button, Badge, Modal, Spinner, Input
  layout/            # Navbar, Sidebar, PageShell
context/
  AuthContext.jsx    # currentUser, login(), logout()
  ProjectContext.jsx # activeProject, setActiveProject()
features/            # One folder per domain slice
  auth/              # RegisterForm, LoginForm
  projects/          # ProjectList, ProjectCard, NewProjectModal
  library/           # PaperTable, PaperFilters, PaperSidePanel
  screening/         # ScreeningCard, ExclusionDropdown, ProgressBar
  prisma-diagram/    # PRISMADiagram (SVG-based, live data)
  ai-assistant/      # ChatPanel, MessageBubble, CorpusContext
  extraction/        # ExtractionTable, ColumnEditor
hooks/               # useAuth, usePapers, useScreening, useAI, useExport
pages/               # Route-level wrappers (one per route)
router/
  index.jsx          # All <Route> definitions
services/
  api.js             # Axios instance with baseURL + JWT interceptor
  auth.service.js
  projects.service.js
  papers.service.js
  screening.service.js
  ai.service.js
  export.service.js
utils/
  prismaCalc.js      # PRISMA number derivation from paper counts
  bibtexFormat.js    # Client-side BibTeX string helpers (display only)
```

### `server/src/`

```
config/
  env.js             # Centralised env var validation (throws on missing)
  prisma.js          # Prisma client singleton
features/            # Mirrors frontend feature slices
  auth/
    auth.routes.js
    auth.controller.js
    auth.service.js  # register, login, refresh
  projects/
    projects.routes.js
    projects.controller.js
    projects.service.js
  papers/
    papers.routes.js
    papers.controller.js
    papers.service.js
    parsers/
      bibtex.parser.js   # wraps bibtex-parse, returns normalised array
      csv.parser.js      # maps columns → paper schema
  tags/
    tags.routes.js
    tags.controller.js
    tags.service.js
  screening/
    screening.routes.js
    screening.controller.js
    screening.service.js  # update status + exclusion reason
  ai/
    ai.routes.js
    ai.controller.js
    ai.service.js    # builds context prompt, calls Anthropic API
  exports/
    exports.routes.js
    exports.controller.js
    bibtex.exporter.js
    csv.exporter.js
    prisma.svg.js    # generates PRISMA SVG string server-side
middleware/
  auth.middleware.js   # verifyToken — attach req.user
  error.middleware.js  # global Express error handler
  validate.js          # express-validator wrapper
utils/
  asyncHandler.js      # wraps async route handlers, forwards errors
app.js                 # Express setup, mount routes, apply middleware
index.js               # Server entry: listen on PORT
```

---

## Database Schema (Prisma)

Six tables — see `server/prisma/schema.prisma` for the canonical source.

| Table | Key columns |
|-------|-------------|
| `users` | id, email, password_hash, created_at |
| `projects` | id, user_id, name, description, created_at |
| `papers` | id, project_id, title, authors, year, venue, doi, abstract, status, exclusion_reason, notes |
| `tags` | id, project_id, name, colour |
| `paper_tags` | paper_id, tag_id (many-to-many join) |
| `chat_messages` | id, project_id, role (user/assistant), content, created_at |

`status` is an enum: `PENDING | INCLUDED | EXCLUDED`

---

## API Route Map

```
POST   /api/auth/register
POST   /api/auth/login

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id

GET    /api/projects/:id/papers
POST   /api/projects/:id/papers/import/bibtex
POST   /api/projects/:id/papers/import/csv
POST   /api/projects/:id/papers          (manual single add)
GET    /api/projects/:id/papers/:pid
PUT    /api/projects/:id/papers/:pid
DELETE /api/projects/:id/papers/:pid

PATCH  /api/projects/:id/papers/:pid/screen   (status + exclusion_reason)

GET    /api/projects/:id/tags
POST   /api/projects/:id/tags
DELETE /api/projects/:id/tags/:tid
POST   /api/projects/:id/papers/:pid/tags/:tid
DELETE /api/projects/:id/papers/:pid/tags/:tid

POST   /api/projects/:id/ai/chat
GET    /api/projects/:id/ai/history

GET    /api/projects/:id/export/bibtex
GET    /api/projects/:id/export/csv
GET    /api/projects/:id/export/prisma.svg
GET    /api/projects/:id/export/prisma.png
```

All routes except `/api/auth/*` require `Authorization: Bearer <token>`.

---

## AI Integration Rules

- The Groq API key lives **only** in `server/.env` and is accessed via `server/src/config/env.js`.
- `ai.service.js` fetches all papers for the project, builds a structured context block (titles + abstracts + notes + status), prepends it to every user message, then calls the Groq chat completions API.
- The system prompt instructs the model to only cite papers present in the context and to include paper IDs in citations so the frontend can resolve them.
- Model: use `process.env.GROQ_MODEL` (default `llama-3.3-70b-versatile`). Never hard-code the model string.
- Never stream AI responses in Phase 3 — simple request/response is sufficient for the deadline.

---

## Coding Conventions

- **JavaScript, not TypeScript** — reduces setup overhead given the 7-day demo deadline.
- **Feature-based folders** in both `client/src/features/` and `server/src/features/` — keep all files for one domain slice together.
- **No business logic in route handlers.** Controllers call services; services call Prisma.
- **Async/await everywhere.** Wrap async route handlers with `asyncHandler.js` to forward errors.
- **Tailwind only** — no inline `style={}` props, no separate CSS files (except `index.css` for Tailwind directives).
- **No comments that describe what the code does.** Only comment the *why* when it's non-obvious.
- **Environment validation** — `server/src/config/env.js` must throw at startup if `DATABASE_URL`, `JWT_SECRET`, or `ANTHROPIC_API_KEY` are missing.

---

## PRISMA Diagram Logic

The diagram is derived entirely from paper counts in the DB. `client/src/utils/prismaCalc.js` computes:

```
identified        = total papers imported (all sources)
duplicates        = papers marked duplicate during import
screened          = identified - duplicates
excluded_screening = EXCLUDED papers with reason 'title/abstract'
full_text_assessed = papers that passed title/abstract screening
excluded_full_text = EXCLUDED papers with reason 'full text'
included          = papers with status = INCLUDED
```

The SVG is generated server-side in `server/src/features/exports/prisma.svg.js` using the same formula for export. The frontend renders the same values as a live React component.

---

## Phase Checklist

- [ ] **Phase 1** — Scaffolding, auth (register/login/JWT), DB schema, routing skeleton
- [ ] **Phase 2** — BibTeX/CSV import, Paper Library + filters, Screening Mode, tags
- [ ] **Phase 3** — PRISMA diagram, AI Assistant, Extraction Table
- [ ] **Phase 4** — Exports, Railway + Netlify deploy, Docker compose, documentation

---

## Environment Setup (First Time)

1. `cp .env.example .env` and fill in `JWT_SECRET` and `ANTHROPIC_API_KEY`.
2. `docker compose up db -d` to start Postgres.
3. `cd server && npm install && npx prisma migrate dev --name init`.
4. `cd client && npm install`.
5. Open two terminals: `npm run dev` in `server/`, `npm run dev` in `client/`.
6. App at `http://localhost:5173`, API at `http://localhost:3001`.
