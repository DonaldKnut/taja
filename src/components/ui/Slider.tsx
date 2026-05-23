"use client";

import React from "react";

export function Slider({
  value,
  onValueChange,
  max = 100,
  step = 1,
  className,
}: {
  value: [number, number];
  onValueChange: (val: [number, number]) => void;
  max?: number;
  step?: number;
  className?: string;
}) {
  const [min, maxVal] = value;
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          value={min}
          onChange={(e) => onValueChange([Math.min(Number(e.target.value), maxVal), maxVal])}
        />
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          value={maxVal}
          onChange={(e) => onValueChange([min, Math.max(Number(e.target.value), min)])}
        />
      </div>
    </div>
  );
}


