"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  iconColor?: string;
  iconBgColor?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  iconColor = "text-emerald-600",
  iconBgColor = "bg-gradient-to-br from-emerald-100 to-emerald-50",
}: EmptyStateProps) {
  const actionButton = actionLabel && (
    <Button
      size="lg"
      variant="gradient"
      onClick={onAction}
    >
      {actionLabel}
      <ArrowRight className="ml-2 h-5 w-5" />
    </Button>
  );

  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
      <div className="max-w-md mx-auto">
        <div className={`mx-auto w-24 h-24 rounded-full ${iconBgColor} flex items-center justify-center mb-6`}>
          <Icon className={`h-12 w-12 ${iconColor}`} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-8">{description}</p>
        {actionHref ? (
          <Link href={actionHref}>{actionButton}</Link>
        ) : (
          actionButton
        )}
      </div>
    </div>
  );
}

