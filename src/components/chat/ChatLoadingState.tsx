"use client";

export function ChatLoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 border-3 border-taja-primary/20 border-t-taja-primary rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading messages…</p>
      </div>
    </div>
  );
}
