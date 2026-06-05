# ScholarFlow

**An AI-powered literature review manager for systematic reviews.**

ScholarFlow replaces scattered spreadsheets, manual PRISMA counting, and repeated trips between Zotero, Excel, and a word processor with a single, purpose-built environment. Import your corpus, screen papers, tag and organise them, query an AI assistant grounded in your own library, and export a publication-ready PRISMA diagram — all in one place.

> Built as a final project for Fundamentals of Software Technology · Beihang University · Spring 2026

---

## Features

| Feature | Description |
|---------|-------------|
| **Project management** | Create isolated review projects, each with their own corpus, tags, and chat history |
| **Paper import** | BibTeX upload, CSV upload, or manual entry — with automatic duplicate detection |
| **Paper library** | Sortable, filterable table with a full-detail side panel; filter by tag, year, venue, status, or keyword |
| **Screening mode** | Focused one-paper-at-a-time include / exclude / skip workflow with structured exclusion reasons |
| **Tagging system** | Custom colour-coded taxonomy; bulk tag application; drives the extraction table |
| **PRISMA 2020 diagram** | Live auto-generated diagram that updates with every screening decision; exports as SVG or PNG |
| **AI research assistant** | Claude-powered chat grounded exclusively in your corpus — no hallucinated papers |
| **Extraction table** | Configurable columns, AI-assisted pre-fill from abstracts, CSV export |
| **Exports** | BibTeX (included papers), CSV (full corpus), PRISMA diagram (SVG + PNG) |

---

## Tech Stack

**Frontend** — React 18, Vite, Tailwind CSS, Axios, React Router v6

**Backend** — Node.js 20 LTS, Express.js, JSON Web Tokens, bcrypt

**Database** — PostgreSQL 16, Prisma ORM

**AI** — Anthropic Claude API (`claude-sonnet-4-6`)

**DevOps** — Docker, docker-compose, Railway (backend + DB), Netlify (frontend)

---

## Getting Started

### Prerequisites

- Node.js 20 LTS
- Docker (for local Postgres)
- An [Anthropic API key](https://console.anthropic.com/)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Jorshuare/scholarflow.git
cd scholarflow

# 2. Copy environment variables and fill in the blanks
cp .env.example .env
# Edit .env: set JWT_SECRET and ANTHROPIC_API_KEY at minimum

# 3. Start the database
docker compose up db -d

# 4. Install backend dependencies and run migrations
cd server
npm install
npx prisma migrate dev --name init
cd ..

# 5. Install frontend dependencies
cd client
npm install
cd ..
```

### Running locally

Open two terminals:

```bash
# Terminal 1 — backend (port 3001)
cd server && npm run dev

# Terminal 2 — frontend (port 5173)
cd client && npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

Copy `.env.example` to `.env`. The required variables are:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs — use a long random string |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `PORT` | Backend port (default `3001`) |
| `ANTHROPIC_MODEL` | Claude model ID (default `claude-sonnet-4-6`) |
| `VITE_API_BASE_URL` | Frontend → backend URL (default `http://localhost:3001/api`) |

The `ANTHROPIC_API_KEY` is used **server-side only** and is never exposed to the browser.

---

## Self-Hosting with Docker

```bash
# Build and run all three services (db, server, client)
docker compose up --build
```

The app will be available at `http://localhost`. All data is stored in a named Docker volume (`pgdata`) and persists across container restarts.

---

## Deployment

The reference deployment uses:
- **Railway** for the Express backend and PostgreSQL database
- **Netlify** for the React frontend

Set environment variables in the Railway and Netlify dashboards rather than committing a `.env` file. The `VITE_API_BASE_URL` on Netlify should point to your Railway backend URL.

---

## Project Structure

```
scholarflow/
├── client/               # React + Vite frontend
│   └── src/
│       ├── components/   # Shared UI atoms and layout shells
│       ├── features/     # Domain slices: auth, projects, library,
│       │                 #   screening, prisma-diagram, ai-assistant, extraction
│       ├── context/      # AuthContext, ProjectContext
│       ├── hooks/        # Custom hooks per feature
│       ├── services/     # Axios API wrappers
│       ├── pages/        # Route-level components
│       └── utils/        # PRISMA calc, BibTeX helpers
│
├── server/               # Node.js + Express REST API
│   ├── src/
│   │   ├── config/       # Env validation, Prisma singleton
│   │   ├── features/     # auth, projects, papers, tags, screening, ai, exports
│   │   ├── middleware/   # JWT auth, error handler, validator
│   │   └── utils/        # asyncHandler
│   └── prisma/           # schema.prisma + migrations
│
├── doc/                  # Assignment documents
├── docker-compose.yml
└── .env.example
```

---

## How the AI Assistant Works

The AI assistant is backed by the Anthropic Claude API. Before every user message is sent to the API, the backend:

1. Fetches all papers in the current project (title, abstract, notes, status).
2. Builds a structured context block and prepends it to the conversation.
3. Instructs Claude to only cite papers present in the context and to include paper IDs in citations.

This means Claude cannot invent papers that are not in your corpus. Every claim it makes can be traced back to a specific record in your library.

---

## Competitive Comparison

| Feature | ScholarFlow | Rayyan | Covidence | Elicit | Zotero |
|---------|:-----------:|:------:|:---------:|:------:|:------:|
| BibTeX import | ✓ | ✓ | ✓ | ✓ | ✓ |
| Screening workflow | ✓ | ✓ | ✓ | Partial | — |
| PRISMA auto-diagram | ✓ | — | ✓ | — | — |
| AI corpus assistant | ✓ | — | — | ✓ | — |
| Extraction table | ✓ | — | ✓ | ✓ | — |
| Free (no subscription) | ✓ | Freemium | — | Freemium | ✓ |
| Self-hostable | ✓ | — | — | — | ✓ |

---

## Roadmap

- [ ] Collaborative reviews with blinding and conflict resolution
- [ ] Semantic search over abstracts using embeddings
- [ ] Automated screening suggestions (active learning, similar to ASReview)
- [ ] PDF full-text upload and AI Q&A over full texts
- [ ] Citation network visualisation (similar to Connected Papers)

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Acknowledgements

- [Anthropic](https://www.anthropic.com/) for the Claude API
- [Prisma](https://www.prisma.io/) for the ORM
- [bibtex-parse](https://www.npmjs.com/package/bibtex-parse) for BibTeX parsing
- Inspired by the systematic review tooling gap identified while working on a systematic review paper
