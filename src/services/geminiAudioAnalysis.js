import { geminiModel } from "../lib/firebase";

const MAX_FILE_BYTES = 12 * 1024 * 1024;

const PROMPT = `
You are ScamSaathi, a cautious multilingual phone-scam awareness assistant.
Analyze the attached audio itself. Support Hindi, Gujarati, English, and mixed-language speech.

Assess the behavior and context. Look for:
- Requests for OTPs, PINs, passwords, verification codes, or sensitive financial information
- Requests to transfer money or pay unexpected fees
- Threats, urgency, intimidation, or pressure to act immediately
- Requests for secrecy or remote-access app installation
- Impersonation of bank staff, police, government officials, or delivery companies
- Attempts to prevent independent verification

Do not classify a conversation as a scam merely because it mentions a bank, police, KYC, an account, or verification. A warning sign is not proof. Do not invent speech or evidence. Quote only words that are clearly audible. If audio is silent, too noisy, too short, or unclear, set evidenceSufficient to false and explain the limitation in recommendedAction. If no meaningful warning signs are found, LOW is appropriate but must not be described as proof of safety.

Risk guidance:
- HIGH: strong, specific evidence of dangerous behavior, such as requesting an OTP/PIN or pressuring a person to transfer money under threat.
- MEDIUM: concerning behavior exists but the evidence or context is inconclusive.
- LOW: no meaningful scam indicators were identified in the audible content.
Do not output a numeric probability or claim a calibrated confidence score.

Return only one valid JSON object, with this exact structure:
{
  "language": "Hindi, Gujarati, English, Mixed, Other, or Unknown",
  "transcript": "Faithful transcript; mark unclear segments as [unclear] instead of guessing",
  "riskLevel": "LOW, MEDIUM, or HIGH",
  "redFlags": [
    {
      "category": "otp_request, money_request, threat, urgency, impersonation, secrecy, remote_access, sensitive_information, or other",
      "evidence": "Exact short words heard in the audio",
      "explanation": "Why this behavior may be suspicious in context"
    }
  ],
  "recommendedAction": "Specific, practical next steps in clear language",
  "evidenceSufficient": true
}
`;

const SUPPORTED_MIME_TYPES = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/webm",
  "audio/aac",
  "audio/flac",
  "audio/ogg",
  "audio/opus",
  "video/mp4"
]);

const MIME_BY_EXTENSION = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  webm: "audio/webm",
  aac: "audio/aac",
  flac: "audio/flac",
  ogg: "audio/ogg"
};

function getMimeType(file) {
  const provided = (file.type || "").toLowerCase();
  if (SUPPORTED_MIME_TYPES.has(provided)) return provided;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return MIME_BY_EXTENSION[extension] || "";
}

function parseModelJson(text) {
  const cleaned = String(text || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("The AI returned an unreadable result. Please try another recording.");
  }

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error("The AI response could not be parsed. Please try again.");
  }
}

function validateAnalysis(data) {
  const allowedLevels = new Set(["LOW", "MEDIUM", "HIGH"]);
  const allowedLanguages = new Set(["Hindi", "Gujarati", "English", "Mixed", "Other", "Unknown"]);

  if (
    !data ||
    typeof data.transcript !== "string" ||
    !allowedLevels.has(data.riskLevel) ||
    !Array.isArray(data.redFlags) ||
    typeof data.recommendedAction !== "string"
  ) {
    throw new Error("The AI response was incomplete. Please try the recording again.");
  }

  const redFlags = data.redFlags
    .filter((flag) => flag && typeof flag === "object")
    .map((flag) => ({
      category: typeof flag.category === "string" ? flag.category.slice(0, 80) : "other",
      evidence: typeof flag.evidence === "string" ? flag.evidence.slice(0, 500) : "",
      explanation: typeof flag.explanation === "string" ? flag.explanation.slice(0, 1000) : "",
    }));

  return {
    language: allowedLanguages.has(data.language) ? data.language : "Unknown",
    transcript: data.transcript.slice(0, 20000),
    riskLevel: data.riskLevel,
    redFlags,
    recommendedAction: data.recommendedAction.slice(0, 3000),
    evidenceSufficient: typeof data.evidenceSufficient === "boolean" ? data.evidenceSufficient : false,
  };
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const comma = dataUrl.indexOf(",");
      if (comma === -1) {
        reject(new Error("The selected audio could not be prepared. Please try another file."));
        return;
      }
      resolve(dataUrl.slice(comma + 1));
    };

    reader.onerror = () => reject(new Error("The browser could not read this file. Please try another recording."));
    reader.onabort = () => reject(new Error("Reading the audio file was cancelled."));
    reader.readAsDataURL(file);
  });
}

function userFriendlyError(error) {
  const message = String(error?.message || "");
  if (/api-not-enabled|not enabled|permission denied|403/i.test(message)) {
    return "The AI service is not enabled or this request is not permitted. Check Firebase AI Logic setup, provider configuration, and App Check settings.";
  }
  if (/quota|resource exhausted|429/i.test(message)) {
    return "The AI service is busy or its usage limit has been reached. Wait a little and try again.";
  }
  if (/network|fetch failed|failed to fetch|offline/i.test(message)) {
    return "Could not reach the AI service. Check your internet connection and try again.";
  }
  if (/unsupported|mime|audio format/i.test(message)) {
    return "This audio format may not be supported by the configured Gemini model. Try a short WAV or MP3 recording.";
  }
  return message || "Audio analysis failed. Please try again with a short WAV or MP3 recording.";
}

export async function analyzeAudioFile(file) {
  if (typeof File === "undefined" || !(file instanceof File) || file.size === 0) {
    throw new Error("Choose a valid, non-empty audio file.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Choose a recording smaller than 12 MB.");
  }

  const mimeType = getMimeType(file);
  if (!mimeType) {
    throw new Error("Unsupported file type. Choose WAV, MP3, M4A, MP4, WEBM, AAC, FLAC, or OGG audio.");
  }

  try {
    const base64 = await readFileAsBase64(file);
    const response = await geminiModel.generateContent([
      PROMPT,
      { inlineData: { data: base64, mimeType } },
    ]);
    const responseText = response.response.text();
    return validateAnalysis(parseModelJson(responseText));
  } catch (error) {
    console.error("Gemini audio analysis request failed:", error);
    throw new Error(userFriendlyError(error));
  }
}
