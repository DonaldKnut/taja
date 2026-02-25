"use client";

import React, { useState, createContext, useContext } from "react";

type TabsContextValue = {
  value?: string;
  setValue: (v: string) => void;
};

const TabsCtx = createContext<TabsContextValue | null>(null);

export function Tabs({ value, defaultValue, onValueChange, children }: { value?: string; defaultValue?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) {
  const [internal, setInternal] = useState<string | undefined>(defaultValue);
  const current = value ?? internal;
  const setValue = (v: string) => {
    setInternal(v);
    onValueChange && onValueChange(v);
  };
  return <TabsCtx.Provider value={{ value: current, setValue }}>{children}</TabsCtx.Provider>;
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = useContext(TabsCtx)!;
  const active = ctx.value === value;
  return (
    <button type="button" className={className} aria-pressed={active} onClick={() => ctx.setValue(value)}>
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = useContext(TabsCtx)!;
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}


