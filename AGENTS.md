# Repository Guidelines

## Project Overview
Lost Hills CRM is an internal artist outreach and campaign management system built with Next.js 16, Prisma, and NextAuth. It manages artist leads, Spotify enrichment, release tracking, and outreach campaigns.

## Project Structure & Module Organization
- `src/app` holds Next.js App Router routes, layouts, and server actions
  - `src/app/(app)` contains authenticated routes (artists, releases, help)
  - `src/app/api` contains API routes (auth, sync, artist operations)
  - `src/app/login` handles authentication UI
- `src/components` contains shared UI components; colocate small, route-specific components in `src/app` where used
  - UI primitives live in `src/components/ui` (shadcn/ui components)
- `src/lib` is for reusable utilities:
  - `auth.ts`: NextAuth configuration with Google OAuth
  - `prisma.ts`: Prisma client singleton
  - `spotify.ts` & `spotify-sync.ts`: Spotify API integration and sync logic
  - `audit.ts`: Audit logging utilities
  - `cache.ts`: Server-side caching helpers
- `src/hooks` contains React hooks (name as `useX`)
- `src/types` stores shared TypeScript types and module declarations
- `prisma/schema.prisma` defines the data model; migrations live in `prisma/migrations`
- Static assets belong in `public`

## Data Model
Key entities in `prisma/schema.prisma`:
- `User`: Authenticated users with role-based access (ADMIN/MEMBER)
- `Artist`: Core entity with status pipeline (LEAD → CONTACTED → NEGOTIATING → WON/LOST)
- `ArtistRelease`: Upcoming releases synced from Spotify
- `SpotifySyncJob`: Background job tracking for bulk Spotify syncs
- `AuditLog`: Activity tracking for compliance and debugging
- `OutboundMessage`: Email campaign tracking

## Build, Test, and Development Commands
- `pnpm install`: install dependencies
- `pnpm dev`: run the local Next.js dev server (Turbopack disabled via TURBOPACK=0)
- `pnpm build`: create a production build
- `pnpm start`: serve the production build
- `pnpm lint`: run ESLint on the codebase
- `pnpm prisma db push`: push the Prisma schema to the configured Postgres database
- `pnpm prisma generate`: regenerate Prisma client (runs automatically on postinstall)
- `pnpm prisma migrate dev`: create and apply a new migration
- `pnpm prisma studio`: open Prisma Studio to browse/edit data

## Coding Style & Naming Conventions
- TypeScript-first; prefer `type`/`interface` definitions in `src/types` or alongside usage
- Follow existing formatting; the repo relies on ESLint (`eslint.config.mjs`) rather than a formatter
- Component names use `PascalCase` and live in files like `artist-table.tsx` (kebab-case filenames)
- Hooks use `camelCase` with a `use` prefix (e.g., `useArtists.ts`)
- Server actions should be colocated in route files or extracted to `src/lib` for reuse
- Use React Server Components by default; add `"use client"` only when needed for interactivity

## API & Integration Patterns
- Spotify API calls use rate limiting (`src/lib/spotify-rate-limit.ts`) to avoid 429 errors
- Server-side caching (`src/lib/cache.ts`) reduces database load for frequently accessed data
- Audit logging (`src/lib/audit.ts`) tracks all artist modifications and user actions
- NextAuth handles Google OAuth; session data includes user role for authorization
- Automated Spotify sync runs daily at 2 AM UTC via Vercel Cron (`/api/spotify/cron-sync`)
  - Syncs artists not updated in 24 hours, marked with `needsSync: true`, or never synced
  - Creates a `SpotifySyncJob` processed by the sync worker
  - Manual sync available via "Sync all Spotify" button in UI

## Testing Guidelines
- No test runner is currently configured. If you add tests, document the tool and add a `pnpm test` script
- Keep any new test files next to the feature or in a `__tests__` folder with clear naming (e.g., `artists.test.ts`)

## Commit & Pull Request Guidelines
- Use concise, imperative commit messages (e.g., "Add artist sync UI", "Fix release calendar filters")
- PRs should include:
  - Short summary of changes
  - Testing notes (`pnpm lint`, `pnpm dev`, manual testing steps)
  - Screenshots for UI changes
  - Database migration notes if schema changed

## Configuration & Secrets
- Use `.env.local` for local config. Required keys:
  - `DATABASE_URL`: Postgres connection string
  - `NEXTAUTH_URL`: Base URL for NextAuth (e.g., `http://localhost:3000`)
  - `NEXTAUTH_SECRET`: Random secret for session encryption
  - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
  - `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET`: Spotify API credentials
  - `CRON_SECRET`: Random secret for Vercel Cron authentication (production only)
- Never commit secrets; use `.env.local` locally and Vercel environment variables for deploys
- See `README.md` and `.env.example` for full setup instructions

## Deployment
- Deployed on Vercel with Vercel Postgres
- Set Google OAuth redirect URL to: `https://admin.crm.losthills.io/api/auth/callback/google`
- Ensure all environment variables from `.env.local` are configured in Vercel
- Database migrations should be applied before deploying new schema changes
