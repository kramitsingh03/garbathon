import { useEffect, useState } from "react";
import {
  AudioLines,
  CheckCircle2,
  FileAudio,
  FileUp,
  Info,
  LoaderCircle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { analyzeAudioFile } from "./services/geminiAudioAnalysis";

const MAX_FILE_BYTES = 12 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = /\.(wav|mp3|m4a|mp4|webm|aac|flac|ogg)$/i;

const riskStyles = {
  HIGH: {
    label: "High risk",
    icon: ShieldAlert,
    badge: "border-rose-400/30 bg-rose-500/10 text-rose-200",
    panel: "border-rose-400/20 bg-rose-500/[0.06]",
    bar: "bg-rose-400",
  },
  MEDIUM: {
    label: "Potential risk",
    icon: TriangleAlert,
    badge: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    panel: "border-amber-400/20 bg-amber-500/[0.06]",
    bar: "bg-amber-300",
  },
  LOW: {
    label: "No strong indicators found",
    icon: ShieldCheck,
    badge: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    panel: "border-emerald-400/20 bg-emerald-500/[0.05]",
    bar: "bg-emerald-400",
  },
};

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateSelectedFile(file) {
  if (!file) return "Choose an audio recording first.";
  if (file.size === 0) return "This file is empty. Choose another recording.";
  if (file.size > MAX_FILE_BYTES) {
    return "This recording is larger than 12 MB. Choose a shorter or smaller file.";
  }
  if (!file.type.startsWith("audio/") && !ACCEPTED_EXTENSIONS.test(file.name)) {
    return "This file type is not supported. Choose an audio file such as WAV, MP3, M4A, or WEBM.";
  }
  return "";
}

export default function AudioTest() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progressMessage, setProgressMessage] = useState("Preparing your recording…");
  const [audioUrl, setAudioUrl] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setAudioUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectFile(nextFile) {
    if (loading) return;
    const validationError = validateSelectedFile(nextFile);
    setError(validationError);
    setResult(null);
    setFile(validationError ? null : nextFile);
  }

  async function handleAnalyze(event) {
    event?.preventDefault();
    const validationError = validateSelectedFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setProgressMessage("Reading your recording securely…");

    try {
      // The service performs the actual Gemini request. This message is a status
      // indicator, not a percentage-based progress claim.
      setProgressMessage("Gemini is listening for conversation context and warning signs…");
      const analysis = await analyzeAudioFile(file);
      setResult(analysis);
      setProgressMessage("");
    } catch (err) {
      console.error("ScamSaathi audio analysis failed:", err);
      setError(err instanceof Error ? err.message : "Audio analysis failed. Please try again.");
      setProgressMessage("");
    } finally {
      setLoading(false);
    }
  }

  async function loadDemoRecording() {
    if (loading || demoLoading) return;
    setDemoLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/ai-voice.wav");
      if (!response.ok) {
        throw new Error("The demo recording could not be loaded. Confirm public/ai-voice.wav exists, then restart the dev server.");
      }
      const blob = await response.blob();
      const demoFile = new File([blob], "ai-voice.wav", {
        type: blob.type || "audio/wav",
        lastModified: Date.now(),
      });
      const validationError = validateSelectedFile(demoFile);
      if (validationError) throw new Error(validationError);
      setFile(demoFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the demo recording.");
    } finally {
      setDemoLoading(false);
    }
  }

  function reset() {
    if (loading || demoLoading) return;
    setFile(null);
    setResult(null);
    setError("");
    setProgressMessage("");
  }

  const risk = result ? riskStyles[result.riskLevel] || riskStyles.MEDIUM : null;
  const RiskIcon = risk?.icon;

  return (
    <main className="min-h-[70vh] text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-xs font-semibold text-cyan-200">
            <AudioLines size={14} aria-hidden="true" />
            AI-powered audio review
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Analyze a suspicious recording</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Upload a short recording to review its transcript, possible scam indicators, and practical safety steps.
            ScamSaathi provides an AI assessment—not a verified determination of fraud.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="surface min-w-0 p-5 sm:p-6" aria-labelledby="upload-heading">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200">
                <FileUp size={21} aria-hidden="true" />
              </div>
              <div>
                <h2 id="upload-heading" className="font-bold">Your audio recording</h2>
                <p className="mt-1 text-xs text-slate-500">WAV, MP3, M4A, MP4, WEBM, AAC, FLAC or OGG · Max 12 MB</p>
              </div>
            </div>

            <label
              htmlFor="scamsaathi-audio"
              onDragOver={(event) => { event.preventDefault(); if (!loading) setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                selectFile(event.dataTransfer.files?.[0] || null);
              }}
              className={`mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition ${
                dragging
                  ? "border-cyan-300 bg-cyan-300/[0.08]"
                  : "border-white/15 bg-white/[0.02] hover:border-cyan-300/40 hover:bg-cyan-300/[0.03]"
              } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                <Upload size={22} aria-hidden="true" />
              </span>
              <span className="mt-3 text-sm font-semibold">Choose an audio file or drop it here</span>
              <span className="mt-1 text-xs text-slate-500">The recording is selected from your device</span>
              <input
                id="scamsaathi-audio"
                type="file"
                accept="audio/*,.wav,.mp3,.m4a,.mp4,.webm,.aac,.flac,.ogg"
                disabled={loading}
                onChange={(event) => {
                  selectFile(event.target.files?.[0] || null);
                  // Allow selecting the same file again after clearing.
                  event.target.value = "";
                }}
                className="sr-only"
                aria-describedby="audio-help"
              />
            </label>
            <button
              type="button"
              onClick={loadDemoRecording}
              disabled={loading || demoLoading}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/[0.06] px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/[0.1] focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {demoLoading ? <><LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> Loading demo…</> : <><AudioLines size={16} aria-hidden="true" /> Try demo recording (WAV)</>}
            </button>
            <p id="audio-help" className="mt-2 text-xs leading-5 text-slate-500">
              Use the built-in sample for a quick demo, or upload a recording you have permission to analyze. Avoid uploading private conversations or recordings containing unnecessary personal information.
            </p>

            {file && (
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#07111f] p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-violet-200">
                    <FileAudio size={19} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-semibold text-slate-100">{file.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatBytes(file.size)}{file.type ? ` · ${file.type}` : ""}</p>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    disabled={loading}
                    aria-label="Remove selected audio"
                    className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-40"
                  >
                    <X size={17} />
                  </button>
                </div>
                {audioUrl && (
                  <audio controls preload="metadata" src={audioUrl} className="mt-4 w-full" aria-label="Preview selected audio">
                    Your browser does not support audio playback.
                  </audio>
                )}
              </div>
            )}

            {error && (
              <div role="alert" className="mt-4 flex gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-sm text-rose-200">
                <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-teal-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <><LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> Analyzing recording…</> : <><AudioLines size={18} aria-hidden="true" /> Analyze with Gemini</>}
            </button>

            {loading && (
              <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
                  <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                  {progressMessage}
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">Analysis time depends on the recording and network connection. Please keep this page open.</p>
              </div>
            )}

            <div className="mt-5 flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-xs leading-5 text-slate-400">
              <Info size={16} className="mt-0.5 shrink-0 text-cyan-200" aria-hidden="true" />
              <p>Audio is sent to the configured AI service for analysis. This page does not save it to ScamSaathi history. Review the provider’s data practices before uploading sensitive recordings.</p>
            </div>
          </section>

          <section className="surface min-w-0 p-5 sm:p-6" aria-labelledby="results-heading" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Analysis report</p>
                <h2 id="results-heading" className="mt-1 text-xl font-bold">What did the AI find?</h2>
              </div>
              {result && (
                <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5">
                  <RotateCcw size={14} aria-hidden="true" /> New scan
                </button>
              )}
            </div>

            {!result && !loading && (
              <div className="grid min-h-[330px] place-items-center py-8 text-center">
                <div className="max-w-xs">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] text-cyan-200">
                    <ShieldCheck size={30} aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-bold">Your report will appear here</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Select a recording and start analysis to see the transcript, evidence, and recommended next steps.</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="grid min-h-[330px] place-items-center py-8 text-center">
                <div>
                  <LoaderCircle size={36} className="mx-auto animate-spin text-cyan-200" aria-hidden="true" />
                  <p className="mt-4 font-semibold">Reviewing the conversation</p>
                  <p className="mt-2 text-sm text-slate-400">Checking context and potential warning signs…</p>
                </div>
              </div>
            )}

            {result && risk && (
              <div className="mt-5 space-y-5">
                <div className={`rounded-2xl border p-4 ${risk.panel}`}>
                  <div className="flex items-start gap-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${risk.badge}`}>
                      <RiskIcon size={21} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-extrabold">{risk.label}</h3>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${risk.badge}`}>{result.riskLevel}</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {result.evidenceSufficient === false
                          ? "There may not be enough clear audio evidence for a reliable assessment. Treat this result as inconclusive."
                          : result.riskLevel === "LOW"
                            ? "The AI did not identify strong scam indicators in this recording. This does not guarantee the call is safe."
                            : "Review the evidence below and independently verify any request involving money, credentials, or urgent action."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                    <p className="text-xs text-slate-500">Detected language</p>
                    <p className="mt-1 break-words text-sm font-semibold">{result.language || "Unknown"}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                    <p className="text-xs text-slate-500">Evidence indicators</p>
                    <p className="mt-1 text-sm font-semibold">{result.redFlags.length}</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><FileAudio size={16} className="text-cyan-200" aria-hidden="true" /> Transcript</h3>
                  <div className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-white/[0.07] bg-[#07111f] p-4 text-sm leading-6 text-slate-300">
                    {result.transcript || "No clear transcript was returned."}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><TriangleAlert size={16} className="text-amber-200" aria-hidden="true" /> Evidence and warning signs</h3>
                  {result.redFlags.length ? (
                    <ul className="space-y-3">
                      {result.redFlags.map((flag, index) => (
                        <li key={`${flag.category}-${index}`} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-amber-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-200">{String(flag.category || "other").replaceAll("_", " ")}</span>
                          </div>
                          <p className="mt-2 break-words text-sm font-semibold text-slate-100">“{flag.evidence || "No exact phrase provided"}”</p>
                          <p className="mt-2 text-sm leading-6 text-slate-400">{flag.explanation || "Review this signal in context."}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm leading-6 text-slate-400">
                      No specific warning signs were returned. Do not treat this alone as proof that the recording is safe.
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-cyan-100"><CheckCircle2 size={17} aria-hidden="true" /> Recommended next steps</h3>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{result.recommendedAction}</p>
                </div>

                <p className="text-xs leading-5 text-slate-500">AI output can be wrong. If money or account access is involved, stop and verify independently through the organization’s official app, website, or phone number.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
