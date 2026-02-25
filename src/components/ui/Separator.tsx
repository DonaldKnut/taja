"use client";

import * as React from "react";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Separator({ className = "", ...props }: SeparatorProps) {
  return (
    <div
      className={("h-px w-full bg-gray-200 " + className).trim()}
      {...props}
    />
  );
}

export default Separator;











