# GUARD.IA: live call scam detection

GUARD.IA is a browser prototype of a personal protection agent that listens to a phone call in real time and warns you before you fall for a scam (fake bank fraud departments, Pix scams, gift card and tech support schemes).

It was the first prototype of Guardia, built with React, TypeScript, Vite and the Gemini API.

## How it works

1. **Listen.** `services/liveAudioService.ts` captures the microphone and streams 16 kHz audio to the Gemini Live API, which returns a running transcript tagged by speaker (`[USER]` or `[SCAMMER]`).
2. **Analyze.** Every new line from the other party goes to `services/geminiService.ts`, which asks Gemini for a structured JSON risk report: a 1 to 10 score, the reason, the sentiment (for example urgent or threatening), the trigger keywords it detected and the actions you should take right now.
3. **Show.** `App.tsx` maps the score to low (1 to 4), medium (5 to 7) or high (8 to 10) risk and updates the risk meter (`components/RiskMeter.tsx`) and status cards (`components/StatusCard.tsx`).
4. **Intervene.** On high risk the screen switches to alert mode and Gemini writes a short, authoritative warning that is added to the transcript.

An **Inject Scam Demo** button adds one of four scripted scam lines, so you can see the full flow without a real call.

## Run locally

Requirements: Node.js 18+ and a Gemini API key.

```bash
npm install
echo "GEMINI_API_KEY=your-key-here" > .env.local   # .env.local is gitignored
npm run dev                                         # http://localhost:3000
```

Then click **Activate Protection**, and either **Start Listening** (allow microphone access) or **Inject Scam Demo**.

> Note: `vite.config.ts` inlines the key into the client bundle, so only run this locally. A public deployment would need a small backend that holds the key and proxies the Gemini calls.

## Project layout

```
App.tsx                      UI, transcript and analysis loop
components/RiskMeter.tsx     1 to 10 risk gauge
components/StatusCard.tsx    status tiles
services/liveAudioService.ts microphone capture and Gemini Live transcription
services/geminiService.ts    structured risk analysis and intervention message
types.ts                     RiskReport, Detection and transcript types
```
