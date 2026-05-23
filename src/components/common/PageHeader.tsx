"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: "default" | "outline";
  };
  children?: ReactNode;
}

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  const actionButton = action && (
    action.href ? (
      <a href={action.href}>
        <Button variant={action.variant || "gradient"}>
          {action.label}
        </Button>
      </a>
    ) : (
      <Button
        variant={action.variant || "gradient"}
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    )
  );

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-gray-600 mt-1">{description}</p>}
      </div>
      {actionButton}
      {children}
    </div>
  );
}

