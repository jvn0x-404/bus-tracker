# TransitPulse Test Report

Date: 2026-10-13

## Executive summary

The React/Vite application builds and serves successfully. The authenticated browser session can reach the existing dashboard, role preview screens, and all primary navigation destinations. Supabase Auth connectivity responds successfully, but a valid test account was not supplied, so valid-login, role-specific authorization, database persistence, Realtime, GPS, and end-to-end tracking are not claimed as passing.

The current UI remains substantially demo-driven outside the map surface. Live Fleet and Student Tracking now use a reusable Leaflet/OpenStreetMap component backed by Supabase bus, trip, route-stop, and current-location queries with Realtime location updates. Google billing is no longer required for local map development. The shared shell, authentication screens, operational panels, tables, statuses, and responsive controls now use a restrained white/black editorial design system.

## Result counts

These counts use grouped requirements rather than counting every individual sentence in the supplied requirements document.

| Result | Count |
|---|---:|
| PASS | 8 |
| FAIL | 0 |
| BLOCKED | 2 |
| NOT IMPLEMENTED | 6 |
| NOT VERIFIED | 5 |

## Traceability matrix

| Area | Result | Evidence |
|---|---|---|
| TypeScript and production build | PASS | `npm run build` completed with Vite output and no errors. |
| Local dev server and page load | PASS | Vite served `http://127.0.0.1:5173/`; browser DOM loaded TransitPulse. |
| Supabase endpoint configuration | PASS | `/auth/v1/settings` returned HTTP 200 using the local anon client key. |
| Login screen and required-field UI | PASS | Auth screen rendered with email, password, sign-in, and registration controls when no session was present. |
| Primary page navigation | PASS | Keyboard navigation reached Dashboard, Live Fleet, Students, Drivers, Buses, Routes & Stops, Trips, and Notifications. Responsive menu was opened and Dashboard was reached by pointer interaction. |
| Student waiting control UI | PASS | Button changed to “You're marked as waiting”. Persistence was not claimed. |
| Valid login | BLOCKED | No designated test-account email/password was provided. |
| Invalid login response | NOT VERIFIED | The browser session became authenticated before the invalid-login form test could be completed; no account was altered. |
| Registration, duplicate registration, password reset | BLOCKED | No safe test identity or reset mailbox was provided. Password reset UI is not implemented. |
| Logout and session persistence | NOT VERIFIED | An authenticated session was present, but the current shell has no visible logout control. |
| Admin/Driver/Student authorization | NOT VERIFIED | Profile-role loading and active-profile gating exist, but three role accounts were not available for direct tests. |
| CRUD for students, drivers, buses, routes, stops, trips | NOT IMPLEMENTED | Existing pages still render hardcoded demo arrays and demo actions. Service-layer coverage is partial. |
| Database persistence and validation | NOT VERIFIED | Schema and RPCs were inspected, but no safe test records were created. |
| Interactive map | NOT VERIFIED | Leaflet 1.9.4 and React Leaflet 4.2.1 are wired into Live Fleet and Student Tracking with OpenStreetMap tiles, bus markers, route-stop markers, route polylines, selection, stale/offline states, refresh, and recenter controls. Browser smoke test reached the map data state without a Google key; no authorized coordinates were available to render tile/marker content. |
| Driver GPS submission | NOT IMPLEMENTED | A secure-RPC GPS utility exists, but Driver Console does not start it. |
| Supabase Realtime UI updates | NOT VERIFIED | The map subscribes to `bus_locations_current` updates and cleans up a unique channel. A duplicate-channel bug exposed during smoke testing was fixed. No authorized live location event was available for end-to-end verification. |
| Student live tracking and ETA | NOT IMPLEMENTED | Current route, bus, ETA, and coordinates are hardcoded demo content. |
| Notifications persistence and deduplication | NOT IMPLEMENTED | Read/list service methods exist, but Notifications still uses hardcoded rows. |
| RLS/schema inspection | PASS | Live project schema, RLS-enabled tables, RPCs, and Realtime publication were inspected without changing production data. |
| Security advisor review | NOT VERIFIED | Supabase advisors reported existing GraphQL exposure, SECURITY DEFINER execution, permissive-policy, and policy-performance warnings requiring owner review. No production policy changes were made. |
| Privileged secret exposure | PASS | No service-role key was added to source or environment configuration; `.env.local` is gitignored. |

## Bugs fixed during testing

1. `src/App.tsx` referenced undefined `setActive`; corrected it to the existing state setter so the build succeeds.
2. Supabase environment handling now supports the publishable key or legacy anon key and does not crash the app before configuration is available.
3. The auth gate no longer blocks the entire application when the optional Google Maps key is missing.

## Files added or modified

- `.env.local` and `.env.example`
- `.gitignore`
- `src/AuthGate.tsx`
- `src/main.tsx`
- `src/App.tsx`
- `src/lib/supabase.ts`
- `src/lib/types.ts`
- `src/lib/services.ts`
- `src/lib/gps.ts`
- `src/vite-env.d.ts`
- `src/components/TransitMap.tsx`
- `src/map.css`
- `src/leaflet-map.css`
- `src/editorial.css`
- `package.json` and `package-lock.json`
- `package.json` and `package-lock.json`

## Commands and checks

```text
npm run build                         PASS
npm run dev -- --host 127.0.0.1      PASS
curl http://127.0.0.1:5173/          PASS
Supabase /auth/v1/settings           HTTP 200
Leaflet map component                PASS (clear empty-data state)
Browser console warnings/errors       none observed
```

## Manual setup still required

1. For production scale, choose a managed/self-hosted tile provider or verify OpenStreetMap tile usage limits and attribution requirements. No Google Maps key is required for the current local implementation.
2. Create safe Admin, Driver, and Student test accounts in a non-production test environment.
3. Confirm email/password Auth settings and redirect URLs in Supabase.
4. Replace the remaining non-map demo UI data with the existing schema/RPC services.
5. Review the Supabase advisor findings before production deployment; do not weaken RLS to make UI tests pass.

## Reproduce

```bash
cd /Users/jeevankumar/Documents/transitpulse-ui
npm run build
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/` and test with designated non-production accounts. Do not use service-role keys in `.env.local` or the browser.
