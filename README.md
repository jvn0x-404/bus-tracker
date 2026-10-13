# Bus Tracker

TransitPulse — a smart campus bus tracking application built with React, TypeScript, Vite, Supabase, Leaflet, and OpenStreetMap.

## Live site

[Open Bus Tracker](https://transitpulse-ui.vercel.app/)

## Local development

```bash
npm install
npm run dev
```

Create `.env.local` with the Supabase browser configuration. Do not commit local environment files or privileged keys.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Verification

```bash
npm run build
```

The detailed verification matrix is in [TRANSITPULSE_TEST_REPORT.md](./TRANSITPULSE_TEST_REPORT.md).
