"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

type HealthState =
  | { status: "loading" }
  | { status: "ok"; gemini: boolean; model: string; r2: Record<string, unknown> }
  | { status: "error"; message: string };

export default function AIPlaygroundPage() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [liveLoading, setLiveLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/health", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!data?.success) {
          setHealth({ status: "error", message: data?.message || "Health check failed" });
          return;
        }
        setHealth({
          status: "ok",
          gemini: Boolean(data.gemini?.configured),
          model: String(data.gemini?.model || ""),
          r2: (data.r2 as Record<string, unknown>) || {},
        });
      } catch (e: any) {
        if (!cancelled) setHealth({ status: "error", message: e?.message || "Network error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runLiveGeminiTest = async () => {
    setLiveLoading(true);
    try {
      const res = await fetch("/api/ai/health?live=1", { cache: "no-store" });
      const data = await res.json();
      const live = data?.liveTest;
      if (live?.ok) {
        setOutput(`Live Gemini OK: ${live.replyPreview || "(empty)"}`);
      } else {
        setOutput(`Live test failed: ${live?.error || data?.message || "unknown"}`);
      }
    } catch (e: any) {
      setOutput(e?.message || "Live test error");
    } finally {
      setLiveLoading(false);
    }
  };

  const run = async () => {
    setLoading(true);
    setOutput("");
    try {
      const res = await api("/api/ai/generate", { method: "POST", body: JSON.stringify({ prompt }) });
      setOutput(res?.text || "");
    } catch (e: any) {
      setOutput(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">AI Playground</h1>
      <p className="text-gray-600">Test Gemini via <code className="text-sm bg-gray-100 px-1 rounded">/api/ai/generate</code> and configuration via <code className="text-sm bg-gray-100 px-1 rounded">/api/ai/health</code>.</p>

      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm space-y-2">
        <p className="font-semibold text-gray-800">Configuration</p>
        {health.status === "loading" && <p className="text-gray-500">Checking…</p>}
        {health.status === "error" && <p className="text-red-600">{health.message}</p>}
        {health.status === "ok" && (
          <>
            <p>
              <span className="font-medium">Gemini:</span>{" "}
              {health.gemini ? (
                <span className="text-emerald-700">key present ({health.model})</span>
              ) : (
                <span className="text-amber-700">GEMINI_API_KEY missing in env</span>
              )}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">R2 / images:</span>{" "}
              {String(health.r2?.imageHint || "See R2_* env vars.")}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={runLiveGeminiTest} disabled={liveLoading || !health.gemini}>
              {liveLoading ? "Calling Gemini…" : "Run live Gemini ping (?live=1)"}
            </Button>
          </>
        )}
      </div>
      <textarea
        className="w-full border rounded-lg p-3 min-h-[160px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask the AI..."
      />
      <div className="flex justify-end">
        <Button onClick={run} disabled={loading || !prompt.trim()} variant="gradient">
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>
      <pre className="whitespace-pre-wrap bg-gray-50 border rounded-lg p-3 min-h-[120px]">{output}</pre>
    </div>
  );
}






