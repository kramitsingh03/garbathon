# ScamSaathi UI

A responsive React + Vite + Tailwind desktop-first prototype for a Google-only scam awareness hackathon project.

## Included
- Dashboard and scam scenario selection
- Hindi, Gujarati, and English selection
- Scripted call simulator with transcript progression
- Mock evidence-based scam analysis
- Browser speech demo (clearly labelled demo voice)
- Incident saving, local persistence, history search/filter
- Safety tips
- Responsive layout

## Run locally

Requires Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Open the local URL Vite prints in the terminal.

## Production build

```bash
npm run build
npm run preview
```

## Important prototype boundaries
- This ZIP contains a working frontend prototype with scripted scenarios and mock analysis.
- It does not intercept cellular calls and does not connect to Gemini or Firebase yet.
- Incident history is stored in browser `localStorage` for demo persistence.
- The voice response uses the browser's built-in speech synthesis when available. It is not Gemini voice.
- No API keys or credentials are included.

## Next Google-only integration steps
1. Configure a Google Gemini API integration using a supported model.
2. For real-time audio, follow the current Gemini Live API documentation and use a secure ephemeral-token or server-side credential flow where supported.
3. Replace `src/services/mockScamAnalysis.js` with a Gemini-backed analysis service.
4. Replace `src/services/incidentRepository.js` with Cloud Firestore.
5. Deploy the built app to Firebase Hosting.

Official resources:
- https://ai.google.dev/gemini-api/docs/live
- https://firebase.google.com/docs/ai-logic
- https://firebase.google.com/docs/hosting
