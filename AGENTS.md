# Repository Guidelines

## Project Structure & Module Organization
- `src/app` holds Next.js App Router routes, layouts, and server actions.
- `src/components` contains shared UI components; colocate small, route-specific components in `src/app` where used.
- `src/lib` is for reusable utilities (API helpers, auth helpers, data access).
- `src/hooks` contains React hooks (name as `useX`).
- `src/types` stores shared TypeScript types.
- `prisma/schema.prisma` defines the data model; migrations live in `prisma/migrations`.
- Static assets belong in `public`.

## Build, Test, and Development Commands
- `pnpm dev`: run the local Next.js dev server.
- `pnpm build`: create a production build.
- `pnpm start`: serve the production build.
- `pnpm lint`: run ESLint on the codebase.
- `pnpm prisma db push`: push the Prisma schema to the configured Postgres database.

## Coding Style & Naming Conventions
- TypeScript-first; prefer `type`/`interface` definitions in `src/types` or alongside usage.
- Follow existing formatting; the repo relies on ESLint (`eslint.config.mjs`) rather than a formatter.
- Component names use `PascalCase` and live in files like `ArtistTable.tsx`.
- Hooks use `camelCase` with a `use` prefix (e.g., `useArtists.ts`).

## Testing Guidelines
- No test runner is currently configured. If you add tests, document the tool and add a `pnpm test` script.
- Keep any new test files next to the feature or in a `__tests__` folder with clear naming (e.g., `artists.test.ts`).

## Commit & Pull Request Guidelines
- No Git history is available in this workspace, so commit conventions are undefined. Use concise, imperative messages (e.g., "Add artist sync UI").
- PRs should include a short summary, a testing note (`pnpm lint`, `pnpm dev`), and screenshots for UI changes.

## Configuration & Secrets
- Use `.env.local` for local config. Required keys include `DATABASE_URL` and `NEXTAUTH_URL` (see `README.md`).
- Never commit secrets; prefer `.env.local` and Vercel environment variables for deploys.
