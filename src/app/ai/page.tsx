"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

export default function AIPlaygroundPage() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

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
      <p className="text-gray-600">Test Gemini responses via /api/ai/generate</p>
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






