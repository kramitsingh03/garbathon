
import { useState } from "react";
import { analyzeAudioFile } from "./services/geminiAudioAnalysis";

export default function AudioTest() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    if (!file) {
      setError("Select an audio file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const analysis = await analyzeAudioFile(file);
      setResult(analysis);
    } catch (err) {
      console.error("Gemini audio test failed:", err);
      setError(err.message || "Audio analysis failed. Check the console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-3xl font-bold">ScamSaathi AI Test</h1>
        <p className="text-slate-300">
          Test real Gemini audio analysis using a short fictional call.
        </p>

        <input
          type="file"
          accept="audio/*,.wav,.mp3,.m4a"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setResult(null);
            setError("");
          }}
          className="block w-full rounded-lg border border-slate-700 p-3"
        />

        {file && (
          <div className="rounded-lg bg-slate-900 p-3">
            <p>{file.name}</p>
            <audio controls src={URL.createObjectURL(file)} className="mt-3 w-full" />
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
        >
          {loading ? "Gemini is analyzing..." : "Analyze with Gemini"}
        </button>

        {error && (
          <div className="rounded-lg border border-red-500 p-4 text-red-300">
            <strong>Test failed</strong>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {result && (
          <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="text-xl font-bold">AI Analysis Result</h2>

            <p>
              Risk:{" "}
              <strong className={
                result.riskLevel === "HIGH"
                  ? "text-red-400"
                  : result.riskLevel === "MEDIUM"
                    ? "text-amber-300"
                    : "text-emerald-300"
              }>
                {result.riskLevel}
              </strong>
            </p>

            <p><strong>Language:</strong> {result.language}</p>

            <div>
              <h3 className="font-semibold">Transcript</h3>
              <p className="whitespace-pre-wrap text-slate-300">
                {result.transcript}
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Red flags</h3>
              {result.redFlags.length ? (
                <ul className="list-disc space-y-2 pl-5">
                  {result.redFlags.map((flag, index) => (
                    <li key={index}>
                      <strong>{flag.category}</strong>: {flag.evidence}
                      <p className="text-slate-400">{flag.explanation}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-300">No red flags identified.</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold">Recommended action</h3>
              <p className="text-slate-300">{result.recommendedAction}</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
