# Orchest

Shared kanban boards for teams — Next.js, TypeScript, Tailwind, Zustand, TanStack Query, Supabase, and FormKit drag & drop.

## Setup

1. Create a Supabase project.
2. In the SQL editor, run migrations in order:
   - [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql)
   - [`supabase/migrations/002_ensure_profile.sql`](supabase/migrations/002_ensure_profile.sql)
   - [`supabase/migrations/003_touch_board_updated_at.sql`](supabase/migrations/003_touch_board_updated_at.sql)
3. Copy env values:

```bash
cp .env.local.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

4. Install and run:

```bash
npm install
npm run dev
```

## Features (MVP)

- Email/password auth
- Multiple boards with owner / editor / viewer roles
- Invite by email (auto-claimed on login/signup)
- Lists & cards with FormKit drag-and-drop
- Card details: description, labels, due date, assignees, comments
- Live updates via Supabase Realtime
- Data fetching via TanStack Query; live board UI state in Zustand
