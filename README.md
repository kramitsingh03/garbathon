# ScamSaathi 🛡️

**ScamSaathi** is an AI-powered scam-awareness prototype that analyzes user-provided audio recordings for suspicious conversation patterns and provides evidence-based safety guidance.

🌐 **Live demo:** https://scamsaathi.web.app/audio-test

> **Important:** ScamSaathi is an awareness aid, not an official fraud-verification service. AI results can be incorrect. A low-risk result does not guarantee that a call is safe.

## Why ScamSaathi?

Scammers may use urgency, threats, impersonation, requests for one-time passwords (OTPs), or pressure to transfer money. ScamSaathi aims to help users pause, review suspicious signals, and choose safer next steps.

## Current features

- Upload an audio recording from a phone or computer.
- Preview the selected recording before analysis.
- Analyze audio using Gemini through Firebase AI Logic.
- Display the transcript and detected language.
- Highlight potential warning signs with supporting audio evidence.
- Show a risk category: **Low**, **Medium**, or **High**.
- Provide practical safety recommendations.
- Support analysis prompts for Hindi, Gujarati, English, and mixed-language speech.
- Include file validation, loading states, and user-facing error messages.

### Supported uploads

The current interface accepts common formats such as WAV, MP3, M4A, MP4, WEBM, AAC, FLAC, and OGG, with a conservative **12 MB maximum**. Actual support can vary by the selected Gemini model and MIME type. If analysis fails, try a short WAV or MP3 file.

## How it works

1. The user selects a recording on their device.
2. The browser reads the file and sends it to the configured Firebase AI Logic / Gemini model for analysis.
3. Gemini returns a structured result containing the transcript, risk level, potential warning signs, and recommended action.
4. ScamSaathi validates the response and displays the report.

**Privacy note:** The recording is sent to the configured AI service for processing. Do not upload recordings unless you have permission to use them, and avoid recordings containing unnecessary sensitive personal information. The audio-analysis page does not save the recording to ScamSaathi incident history.

## Technology stack

- **React** — user interface
- **Vite** — development server and build tooling
- **Tailwind CSS** — styling
- **Lucide React** — interface icons
- **Firebase AI Logic** — connection to generative AI
- **Gemini** — audio analysis and structured responses
- **Firebase Hosting** — deployment

## Run locally

### Prerequisites

- Node.js and npm
- A Firebase project configured for Firebase AI Logic
- Access to the Gemini provider configured for that project

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

Replace the placeholders with your repository URL and folder name.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```dotenv
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Use the values from your own Firebase web app configuration. Do not commit `.env.local` to version control.

> Firebase web configuration values are included in client-side builds; they are not server-side secrets. Configure appropriate API restrictions, Firebase AI Logic protections, quotas, and monitoring for production.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

### 5. Build for production

```bash
npm run build
```

Vite writes the production build to `dist/`.

## Deploy to Firebase Hosting

If Firebase Hosting has already been initialized in the repository:

```bash
npm run build
firebase deploy --only hosting
```

For a new Hosting setup, sign in and initialize Hosting first:

```bash
npx firebase-tools login
npx firebase-tools init hosting
```

Choose the existing Firebase project, use `dist` as the public directory, and configure the app as a single-page application so client-side routes work on refresh. Review the generated `firebase.json` before deploying.

## Example analysis behavior

ScamSaathi looks for contextual indicators such as:

- Requests for OTPs, PINs, passwords, or verification codes
- Requests to transfer money or share sensitive financial information
- Threats or pressure to act immediately
- Requests for secrecy or remote-access app installation
- Possible impersonation of bank staff, police, or government officials

Mentioning a bank, KYC, or verification by itself should not be treated as proof of a scam. The AI should cite specific audible evidence and indicate when the recording is unclear or insufficient.

## Limitations

- The current audio workflow analyzes a recording selected by the user; it does **not** intercept live cellular calls.
- Results depend on audio quality, language, model support, network availability, and AI accuracy.
- Risk labels are advisory and are not calibrated probabilities or verified fraud determinations.
- Multilingual behavior should be tested with real examples before relying on it.
- The current app also contains scripted scenario demonstrations; those should be distinguished clearly from live AI analysis.
- The app should not be used as the only basis for financial, legal, or emergency decisions.

## Roadmap

- [ ] Add automated tests for scam and legitimate conversation samples.
- [ ] Measure false positives and missed scam indicators.
- [ ] Improve handling of noisy, silent, very short, or ambiguous recordings.
- [ ] Add accessibility checks for keyboard navigation, contrast, and screen readers.
- [ ] Configure and verify Firebase App Check, API restrictions, quotas, and monitoring.
- [ ] Add privacy-conscious scan history only with clear user consent.
- [ ] Improve the demo flow and clearly label simulated features.
- [ ] Explore streaming or near-real-time analysis as a separate future feature, subject to platform and privacy constraints.

## Safety guidance

If a caller requests an OTP, PIN, password, remote access, or an urgent transfer of money, pause and independently verify the request. Contact the organization through its official app, website, or a trusted number—not a number supplied only by the caller. If you suspect financial fraud, contact your bank and the appropriate official reporting channel promptly.

## Contributing

Contributions and feedback are welcome. Before submitting a change:

1. Keep claims aligned with implemented functionality.
2. Test both suspicious and legitimate examples.
3. Avoid committing API keys, private recordings, or personal information.
4. Run `npm run build` and document any known limitations.

## License

No license has been specified yet. Add a `LICENSE` file before describing this repository as open source.

---

Built to explore how AI can support safer digital conversations. 🛡️
