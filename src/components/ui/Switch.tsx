"use client";

import React from "react";

export function Switch({
  id,
  checked,
  onCheckedChange,
  className,
}: {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <input
      id={id}
      type="checkbox"
      role="switch"
      className={className}
      checked={!!checked}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
    />
  );
}


