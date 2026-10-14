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
VITE_GOOGLE_AUTH_ENABLED=false
```

## Google account sign-in

The **Continue with Google** button uses Supabase OAuth. After Google is enabled in Supabase, it opens Google's standard account chooser and returns to TransitPulse.

1. In Supabase, open **Authentication → Providers → Google** and add your Google OAuth client ID and secret.
2. Add these redirect URLs in Supabase:
   - `http://127.0.0.1:5173/`
   - `https://transitpulse-ui.vercel.app/`
3. Set `VITE_GOOGLE_AUTH_ENABLED=true` in the local or Vercel environment and redeploy.

The app keeps the button on the login page with setup instructions while the provider is disabled, so users never see Supabase's raw provider error.

## Verification

```bash
npm run build
```

The detailed verification matrix is in [TRANSITPULSE_TEST_REPORT.md](./TRANSITPULSE_TEST_REPORT.md).
