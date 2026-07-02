# Daily Grind Log

Training journal app with RPG-style EXP/leveling system.

## Tech Stack
- React + Vite
- Tailwind CSS
- Supabase (Postgres + Auth + Storage)
- lucide-react icons
- vite-plugin-pwa (PWA / manifest / service worker)

## Environment Variables Required
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
Set these in Replit Secrets before running dev server, and in Vercel dashboard before deploying.

## Dev
```
npm run dev
```

## Build
```
npm run build
```

## Deployment
Deploy via Vercel + GitHub integration (NOT Replit deployment).
Connect GitHub repo to Vercel, set env vars in Vercel dashboard.

## Supabase Setup
Run the SQL in the spec (tables: `profiles`, `entries`, RLS policies, storage buckets: `entry-images`, `profile-images`).

## User Preferences
- Follow spec exactly — no improvised features or redesigns.
- Language: Indonesian UI, Indonesian comments in README/docs.
