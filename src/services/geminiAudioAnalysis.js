
import { geminiModel } from "../lib/firebase";

const PROMPT = `
You are ScamSaathi, a cautious multilingual phone-scam detection assistant.

Analyze the attached audio directly. Support Hindi, Gujarati, English,
and mixed-language speech.

Look for specific evidence of:
- OTP, PIN, password, or verification-code requests
- Requests to transfer money or share financial information
- Threats, urgency, or pressure to act immediately
- Requests for secrecy or remote-access app installation
- Impersonation of bank staff, police, or government officials

Do not mark a call as a scam just because it mentions a bank, police,
KYC, an account, or verification. Evaluate the behavior and context.
Do not invent speech. If audio is unclear, say so.

Return ONLY a valid JSON object:
{
  "language": "Hindi, Gujarati, English, Mixed, Other, or Unknown",
  "transcript": "What was actually said",
  "riskLevel": "LOW, MEDIUM, or HIGH",
  "redFlags": [
    {
      "category": "otp_request, money_request, threat, urgency, impersonation, secrecy, remote_access, or other",
      "evidence": "Specific words heard",
      "explanation": "Why this behavior is suspicious"
    }
  ],
  "recommendedAction": "Practical safety advice",
  "evidenceSufficient": true
}

HIGH requires strong evidence of dangerous behavior.
MEDIUM means concerning but inconclusive behavior.
LOW means no meaningful scam evidence was identified.
Never claim certainty when the evidence is unclear.
`;

function parseModelJson(text) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end <= start) {
    throw new Error("Gemini did not return valid JSON.");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

function validateAnalysis(data) {
  const allowedLevels = ["LOW", "MEDIUM", "HIGH"];

  if (
    !data ||
    typeof data.transcript !== "string" ||
    !allowedLevels.includes(data.riskLevel) ||
    !Array.isArray(data.redFlags) ||
    typeof data.recommendedAction !== "string"
  ) {
    throw new Error("The AI response is missing required fields.");
  }

  return data;
}

export async function analyzeAudioFile(file) {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a valid audio file.");
  }

  const supportedTypes = [
    "audio/wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/webm",
    "audio/aac",
    "audio/flac",
    "audio/ogg",
  ];

  const extensionAllowed = /\.(wav|mp3|m4a|mp4|webm|aac|flac|ogg)$/i
    .test(file.name);

  if (!supportedTypes.includes(file.type) && !extensionAllowed) {
    throw new Error("Choose a supported audio file, preferably WAV.");
  }

  // Keep the first test small because base64 increases request size.
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Choose a recording smaller than 12 MB.");
  }

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(",");

      if (comma === -1) {
        reject(new Error("Could not encode the audio file."));
        return;
      }

      resolve(result.slice(comma + 1));
    };

    reader.onerror = () => reject(
      new Error("Could not read the selected audio file.")
    );

    reader.readAsDataURL(file);
  });

  const mimeType = file.type || "audio/wav";

  const result = await geminiModel.generateContent([
    PROMPT,
    {
      inlineData: {
        data: base64,
        mimeType,
      },
    },
  ]);

  const responseText = result.response.text();

  return validateAnalysis(parseModelJson(responseText));
}
