# GUARD.IA

Scripted demo of a live call scam detector. A transcript plays on the page, the risk meter climbs, and red flags light up on the phrases that give the scam away. The default demo does not call Gemini and does not need an API key.

## Demo

1. Install dependencies: `npm install`
2. Start the app: `npm run dev`
3. Open http://localhost:3000

The bank security call starts on its own. Pause, restart, or switch to the delivery fee call or the Pix urgency call. Each line updates the meter and the red flag list. When the call ends, the page shows a verdict and what to do next.

No audio is recorded. The lines are written into the app.

## Real analysis (optional)

Real analysis is a server route, `POST /api/analyze`. The browser never receives the Gemini key. Vite does not inject it with `define` or `import.meta.env`.

The "Real analysis" form is rendered only when `GET /api/analyze` returns `{ "realModeAvailable": true }`, which happens only if the server process can see `GEMINI_API_KEY`.

### Environment variables

| Name | Where it lives | Required |
| --- | --- | --- |
| `GEMINI_API_KEY` | Server only (Vercel project env, or `.env.local` for `npm run dev`) | Only for real analysis |
| `GEMINI_MODEL` | Server only | No. Defaults to `gemini-3-flash-preview` |

Do not prefix either name with `VITE_`. A `VITE_` variable is bundled into the client.

Locally:

```bash
cp .env.example .env.local
# edit .env.local, then restart
npm run dev
```

`.env.local` is gitignored. On Vercel, add `GEMINI_API_KEY` in Project Settings for Production and Preview. `npm run preview` serves the static build only, so the route exists when you use `npm run dev` or a Vercel deployment.

### Request limits

`POST /api/analyze` accepts JSON: `{ "transcript": "..." }`.

- Transcript: 8,000 characters
- Body: 16 KB
- Rate limit: 10 POSTs per IP per 60 seconds

The rate limit is in memory, per server instance. It is a basic brake, not a global quota. `GET /api/analyze` is not counted and is sent with `Cache-Control: no-store`. It returns only `realModeAvailable`. It does not return the key.

## Scripts

- `npm run dev` starts Vite and the local `/api/analyze` route
- `npm run build` builds the client and fails if `dist` contains Gemini key material
- `npm test` runs the API limit tests and the client boundary checks

## Security check

```bash
npm run build
```

The build scans `dist` and exits non-zero if it finds an `AIza` string, `GEMINI_API_KEY`, or a direct call to the Gemini host.
