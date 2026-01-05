# One-template Portfolio Builder (SaaS)

Production-ready portfolio builder with:

- Next.js App Router + TypeScript
- Prisma ORM + PostgreSQL
- NextAuth (Credentials)
- Tailwind CSS + glassy white UI
- dnd-kit drag & drop section ordering
- Zod validation

## Local setup

1. Install deps

```bash
npm install
```

2. Configure environment

Copy [.env.example](.env.example) to `.env` and fill in values:

- `DATABASE_URL` (PostgreSQL; for Neon use the _Pooled_ connection string)
- `MIGRATE_DATABASE_URL` (optional; for Neon use the _Direct_ connection string for migrations)
- `NEXTAUTH_URL` (e.g. `http://localhost:3000`)
- `NEXTAUTH_SECRET` (long random string)

3. Prisma

```bash
npx prisma migrate dev
```

4. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## App routes

- `/register` create account
- `/login` sign in
- `/dashboard` edit username, create portfolio (1 per user), publish/unpublish
- `/dashboard/editor` drag & drop reorder + inline editing + save
- `/<username>` public portfolio (404 if unpublished)

## Deployment (Vercel + Prisma)

1. Create a PostgreSQL database (Neon recommended)
2. Set Vercel Environment Variables:
   - `DATABASE_URL` (Neon: pooled)
   - `MIGRATE_DATABASE_URL` (Neon: direct; used for `prisma migrate deploy`)
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`
3. Run migrations in CI or manually:
   - Option A: `npx prisma migrate deploy` during build (recommended)
   - Option B: run `prisma migrate deploy` from a deploy hook

Notes:

- API route handlers use `runtime = "nodejs"` (safe for Prisma + bcrypt).
- Ensure `NEXTAUTH_URL` matches your Vercel domain.
