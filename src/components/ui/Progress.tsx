"use client";

import React from "react";

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={className}>
      <div style={{ background: "#e5e7eb", height: 8, borderRadius: 4 }}>
        <div
          style={{
            width: `${pct}%`,
            background: "#4f46e5",
            height: 8,
            borderRadius: 4,
            transition: "width 150ms ease",
          }}
        />
      </div>
    </div>
  );
}


