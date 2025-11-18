# RecallAI

RecallAI is a full-stack AI Chat Portal project that enables users to have real-time conversations with a large language model (LLM), persist those conversations, and later query the system for intelligent, context-aware insights on past chats. The project provides conversation summarization, semantic search across conversations, sentiment & topic analysis, and an API-first backend with a React + Tailwind frontend.

Live demo: https://recallai.anuragsawant.in

---

Table of contents
- Project overview
- Key features
- Architecture
- Tech stack
- Getting started (local)
  - Prerequisites
  - Backend setup (Django + PostgreSQL)
  - AI engine options
  - Frontend setup (React + Tailwind)
- Deployment notes
- Requirements

---

Project overview
RecallAI provides:
- Real-time chat with an LLM (streamed/near-real-time)
- Persistent storage of conversation messages and metadata
- Automatic conversation summarization at conversation end
- Semantic search and intelligent query over past conversations
- Conversation intelligence: sentiment, topics, decisions, and action items
- Dashboard to browse, filter, and inspect conversation details

This repository contains a Django REST backend implementing core APIs and AI integration, and a React frontend using Tailwind CSS for the UI.

---

Key features
- Real-time chat interface (web-socket / streaming responses)
- REST APIs to create/list/get/end conversations and send messages
- AI module for summarization, embeddings, semantic retrieval, sentiment/topic extraction
- Query endpoint to ask questions about past conversations with evidence excerpts
- Conversation dashboard with search and filters (date range, keywords, topics)
- Export conversation to JSON/Markdown/PDF (optional)
- Extensible AI integration (OpenAI/Gemini/Claude or local LM Studio)

---

Architecture
High level flow:
1. User interacts with React frontend
2. Frontend sends chat messages via REST for storage and/or WebSocket for streaming
3. Backend persists messages to PostgreSQL and forwards context to AI module
4. AI module returns responses, embeddings, and analysis
5. Completed conversations are indexed into vector store for semantic search (FAISS / Milvus / simple vector DB)
6. User queries past conversations — backend runs semantic retrieval + LLM to produce context-aware answers with excerpts

Components:
- Frontend: React + Tailwind (UI, WebSocket client)
- Backend: Django + Django REST Framework (+ Channels for real-time)
- DB: PostgreSQL (primary storage)
- Vector store: FAISS / SQLite+annoy fallback
- AI: Gemini or LM Studio (local) + sentence-transformers for embeddings
- File storage: local filesystem (exports/screenshots/attachments)

---

Tech stack
- Backend: Python, Django, Django REST Framework, Django Channels
- Frontend: React, TypeScript, Tailwind CSS, Vite (or Create React App)
- Database: PostgreSQL
- Vector search: FAISS (or alternative)
- AI API: OpenAI / Anthropic / Google / LM Studio (local LLM)
- Embeddings: sentence-transformers or provider embeddings

---

Getting started (local)
Follow these steps to run the project locally.

Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (12+)
- pipenv/venv or preferred Python env manager
- (Optional) LM Studio or OpenAI API key if using remote LLM

Backend setup (Django)
1. Clone repository
```bash
git clone https://github.com/annuraggg/RecallAI.git
cd RecallAI/server
```

2. Create Python env and install dependencies
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Configure PostgreSQL and environment variables (see Environment section). Create a database for the project.
```bash
# Example:
createdb recallai_db
```

4. Apply migrations and create superuser
```bash
python manage.py migrate
python manage.py createsuperuser
```

5. Seed sample data (optional)
```bash
python manage.py loaddata server/sample_data/sample_conversations.json
```

6. Start backend (development)
- For REST API only:
```bash
python manage.py runserver 0.0.0.0:8000
```
- For Channels + WebSockets in development:
```bash
daphne -b 0.0.0.0 -p 8000 recallai.asgi:application
```

AI engine options
Option A: Use Gemini
- Provide API key via environment variables (OPENAI_API_KEY)

Option B: Use LM Studio (local)
- Install and run LM Studio and expose your local LLM endpoint. Configure LM_STUDIO_URL and model name in ENV.
- Local hosting avoids external API costs and keeps data private.

Frontend setup (React + Tailwind)
1. Open a new terminal, go to client:
```bash
cd ../client
npm install
```

2. Configure the client to point to backend
- Edit client/.env or set environment variables (REACT_APP_API_URL=http://localhost:8000/api)

3. Start dev server:
```bash
npm run dev
# or
npm start
```

Open https://localhost:5173 or the port displayed by the dev server.

Deployment notes
- Use environment variables on your host for secrets & keys
- Recommended infra:
  - DigitalOcean / AWS / GCP droplet for Django + Gunicorn + Daphne (Channels)
  - Managed PostgreSQL
  - Redis for Channels and background tasks
  - S3-compatible storage for attachments (or local FS)
  - Vector store: FAISS on disk for small scale; use Milvus/Weaviate for larger scale
- Build frontend and serve static files via CDN or Django staticfiles
- Use a process manager (systemd, supervisor) or Docker + docker-compose for full stack

Example docker-compose (conceptual)
- web (Django + Daphne)
- worker (background tasks for indexing, summarization)
- db (Postgres)
- redis (Redis)
- vector (FAISS service or local mount)
- client (optional static build served via nginx)

---

Development notes & extensibility
- Summaries generated at conversation end to reduce embedding/indexing cost
- Store embeddings at conversation-level summary + message-level for fine-grained retrieval
- Use a hybrid search: semantic retrieval (embeddings) + keyword filters (SQL)
- Add rate limiting and token accounting if using paid APIs
- For concurrency and resilience, move heavy AI calls to background worker (Celery/RQ)

Suggested improvements
- Role-based access control and multi-user workspaces
- Conversation sharing and export (PDF/Markdown)
- Client-side streaming fallback for slow responses
- Voice input/output, dark mode, analytics dashboard
