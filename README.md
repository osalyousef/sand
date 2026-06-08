# سند — Hajj Pilgrim Health Management Platform

## Structure

- `mobile/` — React Native + Expo (TypeScript) app
- `dashboard/` — Next.js dashboard (TypeScript, Tailwind, Supabase Realtime)
- `supabase/migrations/` — SQL schema

## Setup

1. Create a Supabase project, run `supabase/migrations/0001_init.sql` against it.
2. Copy `.env.example` → `.env.local` in both `mobile/` and `dashboard/`, fill in Supabase URL/anon key.
3. `EXPO_PUBLIC_AI_URL` / `NEXT_PUBLIC_AI_URL` stay empty until the FastAPI risk model is live —
   `lib/ai.ts` falls back to a mock `{ risk_level: "yellow", score: 0.65 }` response.
4. `npm install` in each of `mobile/` and `dashboard/`.

## Shared contract

Both apps mirror the same `Pilgrim` / `Vitals` / `RiskAssessment` / `PilgrimLocation` types
(`mobile/types/index.ts`, `dashboard/lib/types.ts`) and the same `getRiskLevel` AI wrapper
(`lib/ai.ts`) — keep them in sync if the AI API contract changes.
