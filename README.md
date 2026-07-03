# Employee Training Agent (Pilot)

Standalone Next.js pilot for manager-led employee training: upload documents, AI-generate daily interactive modules with tests, and track trainee progress.

## Stack

- Next.js 16 (App Router) + TypeScript
- PostgreSQL + Prisma
- shadcn/ui + Tailwind
- OpenAI (optional — fallback generator works offline)

## Quick start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Configure environment

Copy `.env.example` to `.env` and set at minimum:

```
DATABASE_URL="postgresql://training:training@localhost:5432/training_module?schema=public"
SESSION_SECRET="your-long-random-secret"
```

Optional for real AI generation:

```
AI_API_KEY="sk-..."
AI_MODEL="gpt-4o"
```

### 3. Install and migrate

```bash
npm install
npm run db:push
npm run db:seed
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo credentials (after seed)

| Role    | Email             | Password    |
|---------|-------------------|-------------|
| Manager | manager@demo.com  | manager123  |
| Trainee | trainee@demo.com  | trainee123  |

## Manager flow

1. Sign in as manager
2. **Create program** — configure days, test policy (complexity, pass %, max attempts)
3. **Upload documents** — PDF, DOCX, TXT, MD
4. **Generate plan** — AI builds daily modules with interactive sections + tests (fallback if no API key)
5. **Publish** and **assign trainees**
6. Monitor progress, test attempts, activity logs
7. Use **Trainee view** to preview the experience

## Trainee flow

1. Sign in as trainee
2. See day timeline (future days locked by calendar)
3. Study modules section-by-section
4. Ask manager questions inline
5. Pass module tests to complete modules
6. Finish all modules for the day

## Auth note

Authentication is stubbed (email/password in DB, HTTP-only JWT cookie) behind `AuthAdapter` in `src/lib/auth/adapter.ts` for future parent-system integration.

## Project structure

```
src/app/
  manager/          Trainer panel
  trainee/          Trainee experience
  api/              REST handlers
src/components/
  library/          Interactive training UI registry
src/lib/
  ai/               Document ingestion + plan generation
  auth/             Auth adapter + stub session
  training/         Unlock rules, scoring, queries
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run db:push` | Apply schema to database |
| `npm run db:seed` | Load demo manager/trainee/program |
| `npm run build` | Production build |
| `npm run test:e2e` | Playwright smoke tests |

## Deployment

- App: Vercel
- Database: Neon / Supabase Postgres
- Files: Vercel Blob or S3 (pilot uses local `./uploads`)
