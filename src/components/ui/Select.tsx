"use client";

import React, { createContext, useContext } from "react";

type SelectContextValue = {
  value?: string;
  onValueChange?: (val: string) => void;
};

const SelectCtx = createContext<SelectContextValue>({});

export function Select({
  value,
  defaultValue,
  onValueChange,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (val: string) => void;
  children: React.ReactNode;
}) {
  return (
    <SelectCtx.Provider value={{ value: value ?? defaultValue, onValueChange }}>
      <div>{children}</div>
    </SelectCtx.Provider>
  );
}

export function SelectTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useContext(SelectCtx);
  return <span>{value || placeholder || ""}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function SelectItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = useContext(SelectCtx);
  const selected = ctx.value === value;
  return (
    <button
      type="button"
      className={className}
      onClick={() => ctx.onValueChange && ctx.onValueChange(value)}
      aria-pressed={selected}
    >
      {children}
    </button>
  );
}


