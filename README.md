# ScholarFlow

**An AI-powered literature review manager for systematic reviews.**

ScholarFlow replaces scattered spreadsheets, manual PRISMA counting, and repeated trips between Zotero, Excel, and a word processor with a single, purpose-built environment. Import your corpus, screen papers with AI, upload full-text PDFs for structured extraction, chat with an AI assistant grounded in your own library, and export a publication-ready PRISMA diagram — all in one place.

> Built as a final project for Fundamentals of Software Technology · Beihang University · Spring 2026

**Live demo:** [https://shiny-naiad-3efcd0.netlify.app](https://shiny-naiad-3efcd0.netlify.app)

---

## Features

| Feature | Description |
|---------|-------------|
| **Project management** | Create isolated review projects, each with their own corpus, tags, chat history, and notes. Delete projects when no longer needed. |
| **Paper import** | BibTeX upload, CSV upload, or manual entry |
| **Paper library** | Sortable, filterable table with a full-detail side panel; filter by tag, year, status, or keyword |
| **Manual screening** | Focused one-paper-at-a-time include / exclude / skip workflow with structured exclusion reasons |
| **AI auto-screening** | Define inclusion/exclusion criteria → Groq evaluates every paper and assigns it to a three-queue review (auto-included / needs review / auto-excluded) with confidence scores and reasoning |
| **Tagging system** | Custom colour-coded taxonomy; applied per-paper in the side panel |
| **PDF knowledge extraction** | Upload full-text PDF → AI extracts method, dataset, metrics, performance, limitations, future work, and contribution into structured fields |
| **Evidence matrix** | Cross-paper spreadsheet of all extracted fields; inline-editable; exportable as CSV |
| **RAG AI assistant** | Chat grounded in your corpus via pgvector semantic retrieval — model reads actual paragraphs from your PDFs, not just abstracts |
| **PRISMA 2020 diagram** | Live auto-generated diagram that updates with every screening decision; exports as SVG |
| **Project notes** | Per-project notepad with auto-save (1.5 second debounce) |
| **Exports** | BibTeX (included papers), CSV (full corpus), PRISMA SVG, evidence matrix CSV, screening methodology report |

---

## Tech Stack

**Frontend** — React 18, Vite, Tailwind CSS, Axios, React Router v6

**Backend** — Node.js 20 LTS, Express.js, JSON Web Tokens, bcrypt

**Database** — PostgreSQL 16 on Neon, Prisma ORM, pgvector (RAG vector store)

**AI inference** — Groq API (`llama-3.3-70b-versatile`) for screening, extraction, and chat

**Embeddings** — HuggingFace Inference API (`sentence-transformers/all-MiniLM-L6-v2`, 384-dim) for RAG

**Deployment** — Render (backend), Netlify (frontend), Neon (database)

---

## Getting Started

### Prerequisites

- Node.js 20 LTS
- Docker (for local Postgres)
- A free [Groq API key](https://console.groq.com/)
- A free [HuggingFace token](https://huggingface.co/settings/tokens) (optional — for RAG)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Jorshuare/scholarflow.git
cd scholarflow

# 2. Copy environment variables and fill in the blanks
cp .env.example .env
# Edit server/.env: set JWT_SECRET, GROQ_API_KEY, DATABASE_URL at minimum

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

Set these in `server/.env` for local development, or in the hosting dashboard for production.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs — use a long random string |
| `GROQ_API_KEY` | Yes | Your Groq API key (free at console.groq.com) |
| `GROQ_MODEL` | No | Groq model ID (default `llama-3.3-70b-versatile`) |
| `HF_API_KEY` | No | HuggingFace token — enables RAG; falls back to context-stuffing if missing |
| `ALLOWED_ORIGINS` | No | Comma-separated allowed CORS origins (default: localhost) |
| `PORT` | No | Backend port (default `3001`) |

For the frontend, set `VITE_API_BASE_URL` to your backend URL including `/api` (e.g. `https://your-render-url.onrender.com/api`).

`GROQ_API_KEY` and `HF_API_KEY` are used **server-side only** and are never exposed to the browser.

---

## Self-Hosting with Docker

```bash
# Build and run all three services (db, server, client)
docker compose up --build
```

The app will be available at `http://localhost`. All data is stored in a named Docker volume (`pgdata`) and persists across container restarts.

---

## Deployment

The production deployment uses:
- **Render** for the Express backend (free tier, persistent Node.js process)
- **Netlify** for the React frontend (static CDN, free forever)
- **Neon** for the PostgreSQL database (serverless, free tier, pgvector enabled)

**Deploy order:**
1. Deploy server on Render — set all environment variables in the dashboard
2. Deploy frontend on Netlify — set `VITE_API_BASE_URL` to your Render URL + `/api`
3. Update `ALLOWED_ORIGINS` on Render to your Netlify URL
4. Run `npx prisma migrate deploy` locally pointing at Neon to apply all migrations

Netlify and Render both auto-deploy from the `main` branch on every push.

---

## Project Structure

```
scholarflow/
├── client/               # React + Vite frontend
│   └── src/
│       ├── components/   # Shared UI atoms and layout shells (Sidebar, Navbar)
│       ├── context/      # AuthContext, ProjectContext, ToastContext
│       ├── features/     # Domain slices:
│       │   ├── auth/         # LoginForm, RegisterForm
│       │   ├── projects/     # ProjectList, NewProjectModal
│       │   ├── library/      # PaperTable, PaperSidePanel, ImportModal
│       │   ├── screening/    # ScreeningCard, CriteriaManager, AutoScreeningProgress, ScreeningQueues
│       │   ├── extraction/   # FullTextQueue, EvidenceMatrix, ExtractionTable
│       │   ├── ai-assistant/ # ChatPanel, MessageBubble
│       │   ├── prisma-diagram/ # PRISMADiagram
│       │   └── tags/         # TagsManager
│       ├── hooks/        # Custom hooks per feature
│       ├── pages/        # Route-level components (ProjectDashboard, ProjectHome, Notes)
│       ├── router/       # React Router v6 route definitions
│       ├── services/     # Axios API wrappers (one per domain)
│       └── utils/        # PRISMA calc helpers, BibTeX format helpers
│
├── server/               # Node.js + Express REST API
│   ├── src/
│   │   ├── config/       # Env validation, Prisma singleton
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── projects/
│   │   │   ├── papers/       # Includes BibTeX + CSV parsers
│   │   │   ├── tags/
│   │   │   ├── screening/    # Manual screening
│   │   │   ├── auto-screening/ # Groq pipeline, criteria, three-queue
│   │   │   ├── extraction/   # PDF upload, Groq extraction, evidence matrix
│   │   │   ├── ai/           # Chat with RAG integration
│   │   │   ├── rag/          # chunker.js, embedder.js, rag.service.js
│   │   │   └── exports/      # BibTeX, CSV, PRISMA SVG, matrix, screening report
│   │   ├── middleware/   # JWT auth, error handler, validator
│   │   └── utils/        # asyncHandler
│   └── prisma/           # schema.prisma + migrations
│
├── doc/                  # Assignment documentation
├── docker-compose.yml
└── .env.example
```

---

## How the AI Works

### AI Auto-Screening

The researcher defines inclusion and exclusion criteria in plain English (e.g. "IC1: study must involve human participants"). The server sends each paper's title and abstract to Groq with all criteria and requests a JSON response containing the recommendation (INCLUDE/EXCLUDE/UNCERTAIN), confidence score (0–100), matched/failed criteria codes, and a one-sentence reasoning. Papers are sorted into three queues based on recommendation and confidence. A 2-second delay between calls keeps within the free-tier rate limit.

### PDF Extraction

After a PDF is uploaded, `pdf-parse` extracts the raw text. The server sends the first 2,000 and last 1,000 characters to Groq, requesting a JSON response with 7 structured fields: method, dataset, metric, performance, limitations, futureWork, and contribution. Results are stored in `extraction_results` and displayed in the evidence matrix.

### RAG AI Assistant

Before every chat message, the server:

1. Embeds the user's question using HuggingFace's `all-MiniLM-L6-v2` model (384-dim vector)
2. Runs a pgvector cosine similarity search over all indexed paper chunks for this project
3. Retrieves the top-5 most relevant passages from uploaded PDFs
4. Builds a system prompt containing: all paper abstracts + extraction results + the 5 retrieved passages (labelled with paper title and relevance %)
5. Sends everything to Groq's LLaMA 3.3 70B

If HuggingFace is unavailable or no PDFs have been uploaded, the assistant falls back to context-stuffing (abstracts only) silently.

---

## Competitive Comparison

| Feature | ScholarFlow | Rayyan | Covidence | Elicit | Zotero |
|---------|:-----------:|:------:|:---------:|:------:|:------:|
| BibTeX import | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manual screening workflow | ✓ | ✓ | ✓ | Partial | — |
| AI auto-screening | ✓ | — | — | Partial | — |
| PRISMA auto-diagram | ✓ | — | ✓ | — | — |
| PDF extraction (structured) | ✓ | — | — | ✓ | — |
| Evidence matrix | ✓ | — | ✓ | ✓ | — |
| AI corpus assistant (RAG) | ✓ | — | — | ✓ | — |
| Free (no subscription) | ✓ | Freemium | — | Freemium | ✓ |
| Self-hostable | ✓ | — | — | — | ✓ |

---

## Roadmap

- [x] BibTeX / CSV import and paper library
- [x] Manual screening with exclusion reasons
- [x] PRISMA 2020 auto-diagram
- [x] AI assistant grounded in corpus
- [x] AI auto-screening with criteria manager
- [x] PDF upload + structured extraction
- [x] Evidence matrix with CSV export
- [x] RAG (pgvector semantic retrieval from full-text PDFs)
- [x] Project notes
- [ ] Collaborative reviews with blinding and conflict resolution
- [ ] Duplicate detection on import
- [ ] Citation network visualisation (similar to Connected Papers)

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Acknowledgements

- [Groq](https://groq.com/) for fast, free LLM inference
- [HuggingFace](https://huggingface.co/) for free embedding inference
- [Neon](https://neon.tech/) for serverless PostgreSQL with pgvector
- [Prisma](https://www.prisma.io/) for the ORM
- [citation-js](https://citation.js.org/) for BibTeX parsing
- Inspired by the systematic review tooling gap identified while working on a systematic review paper
