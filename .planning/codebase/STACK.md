# Technology Stack

**Analysis Date:** 2026-05-09

## Languages

**Primary:**
- TypeScript 5.x - Full codebase (Next.js app, API routes, utilities)
- JavaScript (ES2017 target) - Build scripts and config files

## Runtime

**Environment:**
- Node.js 20.x (inferred from `@types/node` v20)

**Package Manager:**
- npm (lockfile: `package-lock.json`)

## Frameworks

**Core:**
- Next.js 16.2.4 - Full-stack React framework with file-based routing
- React 19.2.4 - UI components and hooks
- React DOM 19.2.4 - DOM rendering

**Styling:**
- Tailwind CSS 4.x - Utility-first CSS framework
- PostCSS 4.x - CSS processing pipeline

**UI Components & Graphics:**
- Leaflet 1.9.4 - Interactive mapping library
- React Leaflet 5.0.0 - React wrapper for Leaflet
- Lucide React 1.8.0 - Icon library
- Recharts 3.8.1 - React charting library
- GSAP 3.15.0 - Animation library

**Testing:**
- Jest 30.3.0 - Test runner and framework
- ts-jest 29.4.9 - TypeScript support for Jest
- @testing-library/react 16.3.2 - React component testing utilities
- @testing-library/jest-dom 6.9.1 - Jest matchers for DOM assertions
- Jest environment jsdom 30.3.0 - DOM environment for tests

**Build/Dev:**
- ESLint 9.x - Linting (with Next.js core-web-vitals and TypeScript configs)
- eslint-config-next 16.2.4 - Next.js ESLint preset

**Authentication:**
- NextAuth 5.0.0-beta.31 - Session management and OAuth providers
- next-themes 0.4.6 - Dark mode and theme management

## Key Dependencies

**Critical:**
- @neondatabase/serverless 1.0.2 - Postgres database client (serverless)
- @anthropic-ai/sdk 0.90.0 - Anthropic Claude API client

**Infrastructure:**
- next-auth - Handles Google OAuth authentication and JWT sessions

## Configuration

**Environment:**
- `DATABASE_URL` - Neon PostgreSQL connection string (required for production)
- `GOOGLE_ID`, `GOOGLE_SECRET` - Google OAuth credentials
- `NEXTAUTH_SECRET` - NextAuth session encryption key
- `NEXTAUTH_URL` - NextAuth callback URL (for OAuth flow)
- `TELEGRAM_BOT_TOKEN` - Telegram bot token for notifications
- `TELEGRAM_CHAT_ID` - Target Telegram chat for messages
- `CRON_SECRET` - Bearer token for scheduled ingest endpoint
- `INGEST_SECRET` - API secret for ingest endpoint
- `HOME_LAT`, `HOME_LNG`, `HOME_RADIUS_KM` - Default map center configuration

**Build:**
- `tsconfig.json` - TypeScript compilation config (ES2017 target, strict mode, bundler resolution)
- `next.config.ts` - Next.js config (image remote patterns for Google profile pictures)
- `eslint.config.mjs` - ESLint config (Next.js core web vitals + TypeScript)
- `jest.config.ts` - Jest config (node environment, ts-jest transformer)
- `postcss.config.mjs` - PostCSS config (for Tailwind)

## Platform Requirements

**Development:**
- Node.js 20.x
- npm package manager
- Git for version control

**Production:**
- Vercel (Next.js deployment platform) - inferred from commit history and build script
- Neon PostgreSQL database (serverless Postgres)
- Google OAuth (authentication provider)

---

*Stack analysis: 2026-05-09*
