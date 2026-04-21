# packages/db/supabase

Supabase PostgreSQL schema for 너목들 (neomokdeul).

## Directory layout

```
supabase/
├── migrations/
│   ├── 0001_init.sql   ← full schema (tables, indexes, RLS policies)
│   └── 0002_seed.sql   ← test cohort for dev/staging
└── README.md           ← this file
```

## Applying migrations

### Option A — Supabase Dashboard (quickest for one-off)

1. Open your project → **SQL Editor**
2. Paste and run `0001_init.sql`, then `0002_seed.sql` in order.

### Option B — Supabase CLI (`supabase db push`)

```bash
# install CLI if needed
npm install -g supabase

# link to your project (run once)
supabase link --project-ref <your-project-ref>

# push all pending migrations
supabase db push
```

> The CLI reads files in the `migrations/` folder in lexicographic order.
> Always keep filenames zero-padded (`0001_`, `0002_`, …) to guarantee order.

### Option C — Direct psql

```bash
psql "$DATABASE_URL" -f migrations/0001_init.sql
psql "$DATABASE_URL" -f migrations/0002_seed.sql
```

## RLS notes

Current policies are intentionally minimal for MVP:

| Table        | anon role          | service_role |
|--------------|--------------------|--------------|
| `cohorts`    | SELECT (recruiting only) | full access |
| `applications` | INSERT only      | full access |

**Before going to production, consider:**

- Restricting which columns anon can INSERT into `applications`
  (e.g. prevent setting `status`, `note`, `payment_completed_at`).
- Adding an `authenticated` role policy if you introduce participant login.
- Auditing `voice_file_url` / `photo_file_url` Supabase Storage bucket policies
  to ensure anon cannot list or read other applicants' files.

## TypeScript types

The source of truth is this schema. Keep `src/schema.ts` (or the generated
`database.types.ts` from `supabase gen types typescript`) in sync whenever a
migration is added. Column names follow `snake_case` in Postgres; the
TypeScript layer maps them to `camelCase`.
